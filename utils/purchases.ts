// Real IAP wrapper (react-native-iap). Products are one-time, repeatable "consumable"
// purchases - the same price-tier product can be bought again for a different question
// set, so our own backend (not the store) is the source of truth for what's unlocked.
//
// react-native-iap ships a native Nitro module that only exists after a native rebuild
// (`npx expo prebuild` + `npx expo run:android`/`run:ios`, or an EAS dev-client build) -
// it does NOT work in Expo Go, and a plain JS reload right after installing the package
// won't have it either. A static top-level `import` would crash the whole app on boot
// (this file is reached from app/_layout.tsx) in any environment where that rebuild
// hasn't happened yet, so every call goes through this lazy, guarded loader instead -
// the rest of the app keeps working, only purchase actions themselves fail with a
// clear error until a real native build exists.
import { API_URL } from "@/config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { Purchase, PurchaseError } from "react-native-iap";

type IapModule = typeof import("react-native-iap");

let iapModule: IapModule | null | undefined;

// In Expo Go, react-native-iap's native Nitro module can never exist (no native rebuild
// is possible there) - calling require() would still log its own noisy diagnostic error
// even though we catch the throw, so skip the require entirely rather than just catching it.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function loadIap(): IapModule | null {
  if (iapModule !== undefined) return iapModule;
  if (isExpoGo) {
    iapModule = null;
    return iapModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    iapModule = require("react-native-iap") as IapModule;
  } catch {
    iapModule = null;
  }
  return iapModule;
}

export const PURCHASE_CANCELLED_CODE = "user-cancelled";

const PENDING_INTENTS_KEY = "pending_purchase_intents";

export type PurchaseType = "question_set" | "package" | "attempt_pack" | "subscription";

export interface PurchaseIntent {
  productId: string; // the sku actually passed to requestPurchase for this platform
  purchaseType: PurchaseType;
  targetId: number; // question_set_id | package_id | attempt_pack_id | subscription_plan_id
  priceTier: string; // the tier/product key used for the backend verify() call
}

// Backend field name for the target id varies by purchase type.
const TARGET_ID_FIELD: Record<PurchaseType, string> = {
  question_set: "question_set_id",
  package: "package_id",
  attempt_pack: "attempt_pack_id",
  subscription: "subscription_plan_id",
};

async function getPendingIntents(): Promise<PurchaseIntent[]> {
  const raw = await AsyncStorage.getItem(PENDING_INTENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Throws if a purchase for this exact product (price tier) is already in flight. The
// same tier SKU is reused across many different question sets/packages, so if we let a
// second purchase silently overwrite the first's pending intent here, the first
// purchase's money would end up applied to the wrong target once its store callback
// fires and looks up this productId.
async function savePendingIntent(intent: PurchaseIntent) {
  const all = await getPendingIntents();
  if (all.some((i) => i.productId === intent.productId)) {
    throw new Error("purchase_already_pending");
  }
  await AsyncStorage.setItem(PENDING_INTENTS_KEY, JSON.stringify([...all, intent]));
}

async function removePendingIntent(productId: string) {
  const all = await getPendingIntents();
  await AsyncStorage.setItem(
    PENDING_INTENTS_KEY,
    JSON.stringify(all.filter((i) => i.productId !== productId)),
  );
}

let connected = false;
let listenersStarted = false;

type UnlockListener = (unlock: { purchaseType: PurchaseType; targetId: number }) => void;
type FailureListener = (productId: string, message: string) => void;

const unlockListeners = new Set<UnlockListener>();
const failureListeners = new Set<FailureListener>();

export function onPurchaseUnlocked(listener: UnlockListener) {
  unlockListeners.add(listener);
  return () => unlockListeners.delete(listener);
}

export function onPurchaseFailed(listener: FailureListener) {
  failureListeners.add(listener);
  return () => failureListeners.delete(listener);
}

async function verifyWithBackend(
  iap: IapModule,
  intent: PurchaseIntent,
  purchase: Purchase,
): Promise<boolean> {
  const token = await SecureStore.getItemAsync("auth_token");
  if (!token) return false;

  const platform = Platform.OS === "ios" ? "ios" : "android";

  // react-native-iap v15 exposes a single unified token on the purchase object: on iOS
  // it's the StoreKit 2 JWS-signed transaction, on Android it's the Play purchase token.
  // The legacy getReceiptIOS() (Apple's old base64 app receipt) is NOT produced when a
  // build runs against a local StoreKit configuration file, so we never rely on it -
  // getTransactionJwsIOS(productId) is only a fallback for the rare case purchaseToken
  // isn't populated on the event.
  let receiptOrToken = purchase.purchaseToken ?? "";
  if (!receiptOrToken && platform === "ios") {
    try {
      receiptOrToken = (await iap.getTransactionJwsIOS(purchase.productId)) ?? "";
    } catch {
      // fall through to the empty-token guard below
    }
  }

  if (!receiptOrToken) {
    console.warn("[IAP] verify skipped: no receipt/JWS token on purchase", purchase.productId);
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/purchases/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        purchase_type: intent.purchaseType,
        [TARGET_ID_FIELD[intent.purchaseType]]: intent.targetId,
        platform,
        product_id: intent.productId,
        price_tier: intent.priceTier,
        ...(platform === "ios" ? { receipt: receiptOrToken } : { purchase_token: receiptOrToken }),
      }),
    });
    const data = await response.json();
    if (!data.success) {
      // The backend explains exactly why in `errors` (e.g. bad signature, Xcode env not
      // allowed, product/bundle mismatch, transaction already used) - surface it so a
      // failed verify isn't just a silent generic "purchase failed".
      console.warn(
        `[IAP] verify rejected (${response.status}):`,
        JSON.stringify(data),
      );
    }
    return !!data.success;
  } catch (error) {
    console.error("[IAP] verify request failed:", error);
    return false;
  }
}

// StoreKit / Play Billing re-deliver an unfinished transaction repeatedly (on every
// connection, and StoreKit 2 streams updates continuously), and deliveries can arrive
// concurrently. finishTransaction doesn't always take effect immediately against a local
// StoreKit config either. Without a guard, every redelivery runs verify again and fires
// another onPurchaseUnlocked - and each stacked "Purchase successful / Start Quiz" prompt
// the user taps through consumes one paid attempt. Track each transaction so it unlocks
// exactly once per app session.
const settledTransactions = new Set<string>();
const inFlightTransactions = new Set<string>();

function transactionKey(purchase: Purchase): string {
  return `${purchase.productId}::${purchase.transactionId || purchase.purchaseToken || ""}`;
}

async function finishSilently(iap: IapModule, purchase: Purchase) {
  try {
    await iap.finishTransaction({ purchase, isConsumable: true });
  } catch (error) {
    console.warn("[IAP] finishTransaction failed:", error);
  }
}

async function handlePurchaseUpdate(iap: IapModule, purchase: Purchase) {
  const key = transactionKey(purchase);

  // Already unlocked this exact transaction (or a concurrent delivery of it is mid-flight):
  // just make sure the store stops replaying it, and don't fire another unlock.
  if (settledTransactions.has(key) || inFlightTransactions.has(key)) {
    await finishSilently(iap, purchase);
    return;
  }
  inFlightTransactions.add(key);

  try {
    const intents = await getPendingIntents();
    const intent = intents.find((i) => i.productId === purchase.productId);
    if (!intent) {
      // No local intent for this product - e.g. a leftover transaction from a previous
      // install, or one we already fully handled. Finish it so it stops replaying.
      console.warn("[IAP] purchase event with no matching pending intent for", purchase.productId);
      await finishSilently(iap, purchase);
      return;
    }

    const unlocked = await verifyWithBackend(iap, intent, purchase);
    console.log("[IAP] verifyWithBackend ->", unlocked, "for", purchase.productId);

    if (!unlocked) {
      // Leave the intent and the unfinished transaction in place - it will be replayed
      // and retried the next time the store connection is (re)established.
      failureListeners.forEach((listener) =>
        listener(purchase.productId, "purchase_verification_failed"),
      );
      return;
    }

    settledTransactions.add(key);
    await finishSilently(iap, purchase);
    await removePendingIntent(purchase.productId);
    unlockListeners.forEach((listener) =>
      listener({ purchaseType: intent.purchaseType, targetId: intent.targetId }),
    );
  } finally {
    inFlightTransactions.delete(key);
  }
}

// A failed/cancelled purchase (wrong sandbox setup, user backs out, StoreKit/Play Billing
// rejects it outright, etc.) must clear its pending intent here - otherwise the next tap on
// the same price tier hits savePendingIntent's already-pending guard forever, with no way to
// retry short of clearing app storage.
async function handlePurchaseError(error: PurchaseError) {
  if (error.productId) {
    await removePendingIntent(error.productId);
  }
  failureListeners.forEach((listener) => listener(error.productId ?? "", error.code));
}

// Subscribes to store purchase events BEFORE connecting, so any purchase left unfinished
// from a previous session (app killed mid-flow) replays through handlePurchaseUpdate.
// No-ops silently if the native module isn't present in this build.
export async function initGlobalPurchaseHandling() {
  if (listenersStarted) return;
  const iap = loadIap();
  if (!iap) return;
  listenersStarted = true;

  iap.purchaseUpdatedListener((purchase) => handlePurchaseUpdate(iap, purchase));
  iap.purchaseErrorListener(handlePurchaseError);

  try {
    await iap.initConnection();
    connected = true;
  } catch (error) {
    // billing unavailable (e.g. simulator, or store not reachable) - purchase buttons
    // will surface an error when actually tapped
    console.error("[IAP] initConnection failed:", error);
  }
}

// Best-effort recovery: re-fetches purchases the store still knows about (unfinished /
// unconsumed transactions) and replays any that match a still-pending local intent
// through the normal verify flow, without requiring the user to force-quit and relaunch
// the app. Never throws - callers should just re-check unlock state afterwards.
export async function retryPendingPurchases(): Promise<void> {
  const iap = loadIap();
  if (!iap) return;

  const intents = await getPendingIntents();
  if (intents.length === 0) return;

  try {
    const available = await iap.getAvailablePurchases();
    const pendingProductIds = new Set(intents.map((i) => i.productId));
    const toRetry = available.filter((purchase) => pendingProductIds.has(purchase.productId));

    for (const purchase of toRetry) {
      await handlePurchaseUpdate(iap, purchase);
    }
  } catch {
    // billing unavailable or request failed - leave intents in place for the next
    // automatic replay on app relaunch.
  }
}

export async function closeIapConnection() {
  const iap = loadIap();
  if (!iap || !connected) return;
  await iap.endConnection();
  connected = false;
}

export async function buyItem(params: {
  purchaseType: PurchaseType;
  targetId: number;
  priceTier: string;
  iosProductId: string | null;
  androidProductId: string | null;
}) {
  const iap = loadIap();
  if (!iap) {
    throw new Error("iap_unavailable");
  }
  if (!connected) {
    // requestPurchase is event-based and can otherwise hang forever with no prompt and
    // no error if the store connection never came up - fail fast instead.
    throw new Error("iap_not_connected");
  }

  const productId = Platform.OS === "ios" ? params.iosProductId : params.androidProductId;
  if (!productId) {
    throw new Error("no_product_id_for_platform");
  }

  await savePendingIntent({
    productId,
    purchaseType: params.purchaseType,
    targetId: params.targetId,
    priceTier: params.priceTier,
  });

  try {
    console.log("[IAP] requestPurchase starting for", productId);
    await iap.requestPurchase({
      type: "in-app",
      request: {
        apple: { sku: productId },
        google: { skus: [productId] },
      },
    });
    console.log("[IAP] requestPurchase call returned (native flow initiated) for", productId);
  } catch (error) {
    // requestPurchase can reject directly (e.g. StoreKit/Play Billing refuses the request
    // before any native sheet appears) instead of only going through purchaseErrorListener -
    // clear the intent here too so the same tier isn't stuck "pending" forever.
    console.error("[IAP] requestPurchase failed for", productId, error);
    await removePendingIntent(productId);
    throw error;
  }
}

// Thin wrapper kept for existing call sites - buys a single question set outright.
export async function buyQuestionSet(params: {
  questionSetId: number;
  priceTier: string;
  iosProductId: string | null;
  androidProductId: string | null;
}) {
  return buyItem({
    purchaseType: "question_set",
    targetId: params.questionSetId,
    priceTier: params.priceTier,
    iosProductId: params.iosProductId,
    androidProductId: params.androidProductId,
  });
}
