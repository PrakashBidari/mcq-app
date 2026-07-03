// config/constants.ts
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
// export const API_URL = "http://192.168.1.69:8000/api";
export const API_URL = "https://app.ikigaijobplacement.com/api";

// Payment system is not live yet (App Store review). Flip this back to true
// once purchases are wired up to restore free/paid badges and buy buttons.
export const SHOW_PAID_UI = false;
