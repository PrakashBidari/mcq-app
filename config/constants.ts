// config/constants.ts
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
// export const API_URL = "http://192.168.1.67:8000/api";
// export const API_URL = "https://app.ikigaicompanyjpn.com/api";
export const API_URL = "https://app.ikigaijobplacement.com/api";

export const RECAPTCHA_SITE_KEY =
  process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY ?? "6Lc2AaUtAAAAAHyokRlTQKVse91Ee0kK4lPiqh5h";
// Must match a domain registered against the site key above in the Google
// reCAPTCHA admin console — the WebView reports this as its origin.
export const RECAPTCHA_BASE_URL = "https://ikigaicompanyjpn.com";
