// context/RecaptchaContext.tsx
//
// Mounts a single, always-present invisible reCAPTCHA WebView at the app
// root (see app/_layout.tsx) and hands out its token via context. Screens
// call useRecaptchaToken().getToken() right before hitting an endpoint
// gated by the backend's `recaptcha` middleware (register / login /
// resend-otp / forgot-password) — see components/Recaptcha.tsx.
//
// Kept as a single root-level instance (rather than one per screen) so no
// screen's own layout tree has to render it.
import { createContext, ReactNode, useCallback, useContext, useRef } from "react";
import Recaptcha, { RecaptchaHandle } from "@/components/Recaptcha";

type RecaptchaContextValue = {
  getToken: () => Promise<string>;
};

const RecaptchaContext = createContext<RecaptchaContextValue | null>(null);

export function RecaptchaProvider({ children }: { children: ReactNode }) {
  const recaptchaRef = useRef<RecaptchaHandle>(null);

  const getToken = useCallback(async () => {
    if (!recaptchaRef.current) {
      throw new Error("reCAPTCHA is not ready yet. Please try again.");
    }
    return recaptchaRef.current.execute();
  }, []);

  return (
    <RecaptchaContext.Provider value={{ getToken }}>
      <Recaptcha ref={recaptchaRef} />
      {children}
    </RecaptchaContext.Provider>
  );
}

export function useRecaptchaToken() {
  const ctx = useContext(RecaptchaContext);
  if (!ctx) {
    throw new Error("useRecaptchaToken must be used within a RecaptchaProvider");
  }
  return ctx;
}
