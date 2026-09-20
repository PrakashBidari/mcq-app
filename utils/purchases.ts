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

// Release builds don't forward JS console output to the device log, so console.log alone
// can't diagnose a production-only purchase failure. Every IAP failure is therefore also
// turned into a short code (see describeIapError) that the UI shows in the alert.
//
// Best-effort device-log visibility: React Native's release-build log threshold is
// "error", so console.log/warn are dropped before reaching the system log while
// console.error is forwarded. IAP diagnostics are therefore emitted via console.error
// (they are trace lines, not necessarily errors) so they can show up in Console.app /
// Xcode > Devices > Open Console when a real device is connected.
function iapLog(message: string, ...details: unknown[]) {
  console.error(`[IAP] ${message}`, ...details);
}

// Builds a short "code: message" string from whatever the store/native layer threw, e.g.
// "item-unavailable: Product not found". Capped so it fits in an alert.
export function describeIapError(error: unknown): string {
  if (!error) return "unknown";
  if (typeof error === "string") return error.slice(0, 160);
  const e = error as { code?: unknown; message?: unknown };
  const code = typeof e.code === "string" || typeof e.code === "number" ? String(e.code) : "";
  const message = typeof e.message === "string" ? e.message : "";
  const text = code && message && code !== message ? `${code}: ${message}` : code || message;
  return (text || "unknown").slice(0, 160);
}

const PENDING_INTENTS_KEY = "pending_purchase_intents";

// A pending intent should only ever live for the few seconds between tapping
// "buy" and the store's success/error callback firing. Anything older than this
// is a leftover from a purchase whose callback never arrived (app killed
// mid-sheet, or a StoreKit 2 error event with no productId that our error
// handler couldn't match) - it must not block a fresh attempt on the same tier.
const PENDING_INTENT_TTL_MS = 10 * 60 * 1000;

export type PurchaseType = "question_set" | "package" | "attempt_pack" | "subscription";

export interface PurchaseIntent {
  productId: string; // the sku actually passed to requestPurchase for this platform
  purchaseType: PurchaseType;
  targetId: number; // question_set_id | package_id | attempt_pack_id | subscription_plan_id
  priceTier: string; // the tier/product key used for the backend verify() call
  createdAt: number; // epoch ms - used to expire stale/orphaned intents (see TTL above)
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
  if (!raw) return [];
  const all: PurchaseIntent[] = JSON.parse(raw);

  // Drop anything past its TTL (and anything from before createdAt existed) so a
  // stuck/orphaned intent can never permanently block re-purchasing that tier.
  const now = Date.now();
  const fresh = all.filter((i) => i.createdAt && now - i.createdAt < PENDING_INTENT_TTL_MS);
  if (fresh.length !== all.length) {
    await AsyncStorage.setItem(PENDING_INTENTS_KEY, JSON.stringify(fresh));
  }
  return fresh;
}

// Records the intent for the purchase about to be started, replacing any earlier
// intent for the same product id. The same tier SKU is reused across many
// question sets/packages, so an earlier intent for this SKU that's still around
// means a previous purchase never reported back. `buyItem` reconciles that case
// against the store first (a genuine unconsumed transaction is replayed, not
// discarded); by the time we get here a leftover intent for this SKU is an
// orphan and it's safe - and necessary, so the user isn't blocked - to overwrite.
async function savePendingIntent(intent: Omit<PurchaseIntent, "createdAt">) {
  const others = (await getPendingIntents()).filter((i) => i.productId !== intent.productId);
  const stamped: PurchaseIntent = { ...intent, createdAt: Date.now() };
  await AsyncStorage.setItem(PENDING_INTENTS_KEY, JSON.stringify([...others, stamped]));
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
// Why the last initConnection / backend verify failed, so the user-facing error can say
// so instead of a generic "purchase failed".
let lastConnectError = "";
let lastVerifyError = "";

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
  lastVerifyError = "";
  const token = await SecureStore.getItemAsync("auth_token");
  if (!token) {
    lastVerifyError = "not_logged_in";
    return false;
  }

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
    iapLog("verify skipped: no receipt/JWS token on purchase", purchase.productId);
    lastVerifyError = "no_receipt_token";
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
      iapLog(`verify rejected (${response.status}):`, JSON.stringify(data));
      const reason = data?.errors ? JSON.stringify(data.errors) : (data?.message ?? "");
      lastVerifyError = `http_${response.status}${reason ? ` ${reason}` : ""}`.slice(0, 160);
    }
    return !!data.success;
  } catch (error) {
    console.error("[IAP] verify request failed:", error);
    lastVerifyError = `verify_request_failed: ${describeIapError(error)}`;
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
    iapLog("finishTransaction failed:", describeIapError(error));
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
      iapLog("purchase event with no matching pending intent for", purchase.productId);
      await finishSilently(iap, purchase);
      return;
    }

    const unlocked = await verifyWithBackend(iap, intent, purchase);
    iapLog("verifyWithBackend ->", unlocked, "for", purchase.productId);

    if (!unlocked) {
      // Leave the intent and the unfinished transaction in place - it will be replayed
      // and retried the next time the store connection is (re)established.
      failureListeners.forEach((listener) =>
        listener(purchase.productId, `purchase_verification_failed: ${lastVerifyError}`),
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
  } else {
    // react-native-iap v15 / StoreKit 2 routinely reports a cancelled or failed
    // purchase with no productId on the error object. The app only ever has one
    // purchase in flight at a time (the UI blocks concurrent taps), so clearing
    // every pending intent here is safe - and without it the intent is orphaned
    // and savePendingIntent's guard blocks that price tier until app storage is
    // wiped.
    await AsyncStorage.removeItem(PENDING_INTENTS_KEY);
  }
  iapLog("purchase error event:", error.code, error.message, error.productId);
  // Keep the bare code for cancellations (the UI compares against it); add the native
  // message for everything else so the alert shows the real reason.
  const description =
    error.code === PURCHASE_CANCELLED_CODE ? error.code : describeIapError(error);
  failureListeners.forEach((listener) => listener(error.productId ?? "", description));
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
    lastConnectError = "";
    iapLog("initConnection ok");
  } catch (error) {
    // billing unavailable (e.g. simulator, or store not reachable) - purchase buttons
    // will surface an error when actually tapped
    lastConnectError = describeIapError(error);
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
    // The startup connection may have failed transiently - try once more before giving up.
    try {
      await iap.initConnection();
      connected = true;
      lastConnectError = "";
      iapLog("initConnection ok (retry from buyItem)");
    } catch (error) {
      lastConnectError = describeIapError(error);
      console.error("[IAP] initConnection retry failed:", error);
    }
  }
  if (!connected) {
    // requestPurchase is event-based and can otherwise hang forever with no prompt and
    // no error if the store connection never came up - fail fast instead.
    throw new Error(`iap_not_connected: ${lastConnectError || "unknown"}`);
  }

  const productId = Platform.OS === "ios" ? params.iosProductId : params.androidProductId;
  if (!productId) {
    throw new Error(`no_product_id_for_platform: ${Platform.OS} tier=${params.priceTier}`);
  }

  // Confirm the store actually serves this product before starting the purchase. A product
  // that isn't approved/live in production (or whose id doesn't match the store console)
  // is otherwise a silent failure - no payment sheet, just a generic error.
  try {
    const products = await iap.fetchProducts({ skus: [productId], type: "all" });
    iapLog("fetchProducts", productId, "->", products?.length ?? 0, "product(s)");
    if (!products || products.length === 0) {
      throw new Error(`product_not_found: ${productId}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("product_not_found")) throw error;
    // The lookup itself failed (network, etc.) - not proof the product is missing, so
    // log it and let requestPurchase report the definitive result.
    iapLog("fetchProducts failed:", describeIapError(error));
  }

  // If an earlier intent for this SKU is still around (a previous purchase whose
  // store callback never arrived - the common iOS case), decide what it is before
  // starting a new one:
  //   - the store still has a matching unconsumed transaction -> that purchase is
  //     real; finish handling it instead of charging again, then stop here.
  //   - the store has nothing -> it's an orphan; drop it and start a fresh
  //     purchase. Never surface a blocking "already in progress" error.
  const hasStaleIntent = (await getPendingIntents()).some((i) => i.productId === productId);
  if (hasStaleIntent) {
    try {
      const available = await iap.getAvailablePurchases();
      const unconsumed = available.find((p) => p.productId === productId);
      if (unconsumed) {
        await handlePurchaseUpdate(iap, unconsumed);
        return;
      }
    } catch {
      // store lookup failed - treat the leftover intent as an orphan
    }
    await removePendingIntent(productId);
  }

  await savePendingIntent({
    productId,
    purchaseType: params.purchaseType,
    targetId: params.targetId,
    priceTier: params.priceTier,
  });

  try {
    iapLog("requestPurchase starting for", productId);
    await iap.requestPurchase({
      type: "in-app",
      request: {
        apple: { sku: productId },
        google: { skus: [productId] },
      },
    });
    iapLog("requestPurchase call returned (native flow initiated) for", productId);
  } catch (error) {
    // requestPurchase can reject directly (e.g. StoreKit/Play Billing refuses the request
    // before any native sheet appears) instead of only going through purchaseErrorListener -
    // clear the intent here too so the same tier isn't stuck "pending" forever.
    console.error("[IAP] requestPurchase failed for", productId, error);
    await removePendingIntent(productId);
    const code = (error as { code?: string } | null)?.code;
    if (code === PURCHASE_CANCELLED_CODE) throw new Error(PURCHASE_CANCELLED_CODE);
    throw new Error(`requestPurchase_failed: ${describeIapError(error)}`);
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
