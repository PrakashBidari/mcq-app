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
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { Purchase, PurchaseError } from "react-native-iap";

type IapModule = typeof import("react-native-iap");

let iapModule: IapModule | null | undefined;

function loadIap(): IapModule | null {
  if (iapModule !== undefined) return iapModule;
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

export interface PurchaseIntent {
  productId: string; // the sku actually passed to requestPurchase for this platform
  questionSetId: number;
  priceTier: string;
}

async function getPendingIntents(): Promise<PurchaseIntent[]> {
  const raw = await AsyncStorage.getItem(PENDING_INTENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function savePendingIntent(intent: PurchaseIntent) {
  const all = await getPendingIntents();
  await AsyncStorage.setItem(
    PENDING_INTENTS_KEY,
    JSON.stringify([...all.filter((i) => i.productId !== intent.productId), intent]),
  );
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

type UnlockListener = (questionSetId: number) => void;
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
  const receiptOrToken =
    platform === "ios" ? await iap.getReceiptIOS() : (purchase.purchaseToken ?? "");

  if (!receiptOrToken) return false;

  try {
    const response = await fetch(`${API_URL}/purchases/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question_set_id: intent.questionSetId,
        platform,
        product_id: intent.productId,
        price_tier: intent.priceTier,
        ...(platform === "ios" ? { receipt: receiptOrToken } : { purchase_token: receiptOrToken }),
      }),
    });
    const data = await response.json();
    return !!data.success;
  } catch {
    return false;
  }
}

async function handlePurchaseUpdate(iap: IapModule, purchase: Purchase) {
  const intents = await getPendingIntents();
  const intent = intents.find((i) => i.productId === purchase.productId);
  if (!intent) return; // not one of our tracked purchases

  const unlocked = await verifyWithBackend(iap, intent, purchase);

  if (unlocked) {
    await iap.finishTransaction({ purchase, isConsumable: true });
    await removePendingIntent(purchase.productId);
    unlockListeners.forEach((listener) => listener(intent.questionSetId));
  } else {
    // Leave the intent and the unfinished transaction in place - it will be replayed
    // and retried the next time the store connection is (re)established.
    failureListeners.forEach((listener) =>
      listener(purchase.productId, "purchase_verification_failed"),
    );
  }
}

function handlePurchaseError(error: PurchaseError) {
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
  } catch {
    // billing unavailable (e.g. simulator, or store not reachable) - purchase buttons
    // will surface an error when actually tapped
  }
}

export async function closeIapConnection() {
  const iap = loadIap();
  if (!iap || !connected) return;
  await iap.endConnection();
  connected = false;
}

export async function buyQuestionSet(params: {
  questionSetId: number;
  priceTier: string;
  iosProductId: string | null;
  androidProductId: string | null;
}) {
  const iap = loadIap();
  if (!iap) {
    throw new Error("iap_unavailable");
  }

  const productId = Platform.OS === "ios" ? params.iosProductId : params.androidProductId;
  if (!productId) {
    throw new Error("no_product_id_for_platform");
  }

  await savePendingIntent({
    productId,
    questionSetId: params.questionSetId,
    priceTier: params.priceTier,
  });

  await iap.requestPurchase({
    type: "in-app",
    request: {
      apple: { sku: productId },
      google: { skus: [productId] },
    },
  });
}
