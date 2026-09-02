// components/Recaptcha.tsx
// Google reCAPTCHA v2 (Invisible) wrapper. Every public endpoint that sends SMTP
// mail (register / resend OTP / forgot password) or is a spam vector (login /
// contact) now requires a reCAPTCHA token — the backend verifies it before
// sending any mail. See mcq-backend/docs/RECAPTCHA.md.
//
// Usage:
//   const { Recaptcha, getToken } = useRecaptcha();
//   ...
//   const token = await getToken();            // throws on failure/cancel/timeout
//   fetch(url, { body: JSON.stringify({ ...fields, recaptcha_token: token }) });
//   ...
//   return (<>{Recaptcha}{/* rest of screen */}</>);
import { RECAPTCHA_BASE_URL, RECAPTCHA_SITE_KEY } from "@/config/constants";
import React, { useCallback, useRef } from "react";
import RecaptchaWidget, {
  RecaptchaRef,
} from "react-native-recaptcha-that-works";

const TIMEOUT_MS = 30000;
const LOG = "[Recaptcha]";

type Pending = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

export function useRecaptcha() {
  const widgetRef = useRef<RecaptchaRef>(null);
  const pending = useRef<Pending | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settle = useCallback(
    (kind: "resolve" | "reject", value: string | Error) => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      const p = pending.current;
      pending.current = null;
      if (!p) return;
      if (kind === "resolve") {
        console.log(`${LOG} verified, token length`, (value as string).length);
        p.resolve(value as string);
      } else {
        console.warn(`${LOG} failed:`, (value as Error).message);
        p.reject(value as Error);
      }
    },
    [],
  );

  const getToken = useCallback((): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      if (!RECAPTCHA_SITE_KEY) {
        // No key configured (e.g. local dev). Send an empty token and let the
        // backend decide: it passes when RECAPTCHA_ENABLED=false, rejects otherwise.
        console.warn(
          `${LOG} EXPO_PUBLIC_RECAPTCHA_SITE_KEY is not set; sending empty token`,
        );
        resolve("");
        return;
      }
      if (pending.current) {
        reject(new Error("A reCAPTCHA check is already in progress"));
        return;
      }
      console.log(
        `${LOG} opening — siteKey ${RECAPTCHA_SITE_KEY.slice(0, 10)}… baseUrl ${RECAPTCHA_BASE_URL}`,
      );
      pending.current = { resolve, reject };
      timer.current = setTimeout(() => {
        widgetRef.current?.close();
        settle(
          "reject",
          new Error(
            "reCAPTCHA timed out — the widget never loaded (check network / reCAPTCHA script)",
          ),
        );
      }, TIMEOUT_MS);
      widgetRef.current?.open();
    });
  }, [settle]);

  const Recaptcha = (
    <RecaptchaWidget
      ref={widgetRef}
      siteKey={RECAPTCHA_SITE_KEY}
      baseUrl={RECAPTCHA_BASE_URL}
      size="invisible"
      webViewProps={{
        // react-native-recaptcha-that-works ships an onShouldStartLoadWithRequest
        // that returns `navigationType === 'other'`, which blocks the initial
        // HTML load on Android/newer react-native-webview and the widget never
        // loads (→ timeout). Allow the load; originWhitelist already limits it.
        onShouldStartLoadWithRequest: () => true,
        // Surface WebView-level failures (e.g. reCAPTCHA script blocked).
        onError: (e: any) =>
          console.warn(`${LOG} webview error`, JSON.stringify(e?.nativeEvent)),
        onHttpError: (e: any) =>
          console.warn(`${LOG} webview http error`, JSON.stringify(e?.nativeEvent)),
      }}
      onLoad={() => console.log(`${LOG} widget loaded`)}
      onVerify={(token) => settle("resolve", token)}
      onExpire={() => settle("reject", new Error("reCAPTCHA expired"))}
      onError={(err) => {
        // grecaptcha's error-callback: usually an invalid/mismatched site key
        // (wrong type or domain not registered) or a network failure.
        console.warn(`${LOG} onError`, JSON.stringify(err));
        settle(
          "reject",
          new Error(
            "reCAPTCHA error — likely the site key type is not 'v2 Invisible' or the domain is not registered on the key",
          ),
        );
      }}
      onClose={() => {
        // The library calls onClose *immediately before* onVerify/onError on the
        // same call stack, so we can't reject here synchronously or we'd throw
        // away a successful token. Defer: if the promise is still pending on the
        // next tick, onVerify/onError never came → the user really dismissed it.
        setTimeout(() => {
          if (pending.current) {
            settle("reject", new Error("reCAPTCHA was cancelled"));
          }
        }, 500);
      }}
    />
  );

  return { Recaptcha, getToken };
}
