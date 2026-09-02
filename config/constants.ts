// config/constants.ts
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
export const API_URL = "http://192.168.1.65:8000/api";
// export const API_URL = "https://app.ikigaijobplacement.com/api";

// Google reCAPTCHA v2 (Invisible). The site key is public; the secret lives on
// the backend. RECAPTCHA_BASE_URL must be a domain registered on the key in the
// reCAPTCHA admin console (see mcq-backend/docs/RECAPTCHA.md). The current key is
// registered for ikigaicompanyjpn.com — the WebView just reports this as its
// origin, it does not need to actually host anything.
export const RECAPTCHA_SITE_KEY = "6Lc2AaUtAAAAAHyokRlTQKVse91Ee0kK4lPiqh5h";
export const RECAPTCHA_BASE_URL = "https://ikigaicompanyjpn.com";
