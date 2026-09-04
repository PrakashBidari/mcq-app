// components/Recaptcha.tsx
//
// Runs Google's invisible reCAPTCHA v2 widget in a WebView and exposes an
// `execute()` method that resolves with the verification token. The
// backend's `recaptcha` middleware
// (mcq-backend/app/Http/Middleware/VerifyRecaptcha.php) requires this token
// as `recaptcha_token` on /register, /login, /resend-otp and
// /forgot-password. See mcq-backend/docs/RECAPTCHA.md.
//
// The WebView only exists while a check is running, presented in a Modal:
//   - A permanently-mounted, zero/near-zero-size WebView turned out to be
//     unreliable — clipped to nothing (`overflow: hidden` on a 0x0 parent)
//     it never finished loading Google's script and every execute() timed
//     out; sized but merely `position: absolute` off-screen it worked, but
//     leaked its own internal sizing into the surrounding screen's flex
//     layout and pushed every screen down.
//   - Modal renders through a wholly separate native surface, so while
//     hidden (the common case) it cannot affect any screen's layout no
//     matter what the WebView does internally, and while shown it gets a
//     real, properly measured on-screen area to load and run in — which
//     also means a visible reCAPTCHA challenge (Google occasionally shows
//     one for suspicious traffic) has somewhere to render and be solved.
// Each execute() forces a fresh WebView instance (`key`) so the widget is
// reliably reloaded — Modal doesn't guarantee unmounting the previous one
// on every platform when it's toggled hidden then shown again.
import { RECAPTCHA_BASE_URL, RECAPTCHA_SITE_KEY } from "@/config/constants";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";

export type RecaptchaHandle = {
  /** Runs the invisible challenge and resolves with a verification token. */
  execute: () => Promise<string>;
};

// Long enough for a real visible challenge (image grid, etc.) to actually be
// solved by hand — the fast path (no challenge shown) resolves in a couple
// of seconds regardless, so this only matters when Google decides to show
// one.
const EXECUTE_TIMEOUT_MS = 3 * 60 * 1000;

// The WebView's `baseUrl` (RECAPTCHA_BASE_URL) is what Google sees as the
// requesting origin, so it must be one of the domains registered against the
// site key in the Google reCAPTCHA admin console.
const buildHtml = (siteKey: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>html, body { margin: 0; padding: 0; background: transparent; }</style>
  </head>
  <body>
    <div id="recaptcha-container"></div>
    <script>
      function post(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
      window.onRecaptchaLoad = function () {
        try {
          var widgetId = grecaptcha.render("recaptcha-container", {
            sitekey: "${siteKey}",
            size: "invisible",
            callback: function (token) {
              post({ type: "token", token: token });
            },
            "error-callback": function () {
              post({ type: "error" });
            },
            "expired-callback": function () {
              post({ type: "expired" });
            },
          });
          grecaptcha.execute(widgetId);
        } catch (e) {
          post({ type: "error" });
        }
      };
    </script>
    <script src="https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit" async defer></script>
  </body>
</html>
`;

const Recaptcha = forwardRef<RecaptchaHandle>((_props, ref) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const runIdRef = useRef(0);
  const pendingRef = useRef<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  } | null>(null);

  const settlePending = useCallback(
    (run: (pending: NonNullable<typeof pendingRef.current>) => void) => {
      const pending = pendingRef.current;
      if (!pending) return;
      clearTimeout(pending.timeout);
      pendingRef.current = null;
      setVisible(false);
      run(pending);
    },
    [],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: { type?: string; token?: string };
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (data.type === "token" && data.token) {
        settlePending((pending) => pending.resolve(data.token!));
      } else if (data.type === "error" || data.type === "expired") {
        settlePending((pending) =>
          pending.reject(
            new Error("reCAPTCHA verification failed. Please try again."),
          ),
        );
      }
    },
    [settlePending],
  );

  useImperativeHandle(
    ref,
    () => ({
      execute: () =>
        new Promise<string>((resolve, reject) => {
          if (pendingRef.current) {
            reject(new Error("reCAPTCHA is already running."));
            return;
          }

          const timeout = setTimeout(() => {
            settlePending((pending) =>
              pending.reject(
                new Error("reCAPTCHA timed out. Please try again."),
              ),
            );
          }, EXECUTE_TIMEOUT_MS);

          pendingRef.current = { resolve, reject, timeout };
          runIdRef.current += 1;
          setVisible(true);
        }),
    }),
    [settlePending],
  );

  // Nothing rendered at all while idle (the common state) — guaranteed zero
  // effect on any screen's layout.
  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={styles.backdrop} pointerEvents="box-none">
        <View style={styles.card}>
          {/* Behind the WebView (mounted after, so it draws on top) — the
              page's transparent background lets this show through until
              content (or a real challenge) renders inside the WebView. */}
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color="#7c3aed" />
            <Text style={styles.loadingText}>
              {t("auth.recaptcha.verifying")}
            </Text>
          </View>
          <WebView
            key={runIdRef.current}
            source={{
              html: buildHtml(RECAPTCHA_SITE_KEY),
              baseUrl: RECAPTCHA_BASE_URL,
            }}
            onMessage={handleMessage}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            mixedContentMode="always"
          />
        </View>
      </View>
    </Modal>
  );
});

Recaptcha.displayName = "Recaptcha";

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 384,
    height: 480,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  // Sits behind the WebView's own content (z-order = mount order), so a
  // visible Google challenge — which renders inside the WebView — draws
  // over this. It only shows during the near-instant common case where no
  // challenge appears.
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    gap: 8,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 13,
  },
});

export default Recaptcha;
