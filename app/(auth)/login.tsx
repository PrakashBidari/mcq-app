// app/(auth)/login.tsx
import { useRecaptcha } from "@/components/Recaptcha";
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useRecaptchaToken } from "@/context/RecaptchaContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login: saveAuth } = useAuth();
  const { getToken } = useRecaptchaToken();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("auth.login.errorEmail"));
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t("common.error"), t("auth.login.errorEmailInvalid"));
      return;
    }
    if (!password.trim()) {
      Alert.alert(t("common.error"), t("auth.login.errorPassword"));
      return;
    }

    setIsLoading(true);

    let recaptchaToken: string;
    try {
      recaptchaToken = await getToken();
    } catch (e) {
      setIsLoading(false);
      Alert.alert(
        t("common.error"),
        e instanceof Error ? e.message : t("common.recaptchaFailed"),
      );
      return;
    }

    try {
      const recaptchaToken = await getToken();

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await saveAuth(data.data.user, data.data.token);

        Alert.alert(t("common.success"), t("auth.login.loginSuccess"), [
          {
            text: t("common.ok"),
            onPress: () => router.replace("/(tabs)"),
          },
        ]);
      } else {
        Alert.alert(t("common.error"), data.message || t("auth.login.loginFailed"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      Alert.alert(t("common.error"), message || t("common.somethingWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {Recaptcha}
      <LinearGradient
        colors={["#7c3aed", "#a855f7", "#ec4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/(tabs)")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={20} color="#7c3aed" />
              <Text style={styles.backButtonText}>{t("auth.login.backToHome")}</Text>
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoWrapper}>
              <View style={styles.logoShadow} />
              <View style={styles.logoContainer}>
                <Ionicons name="school" size={72} color="#ffffff" />
              </View>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{t("auth.login.title")}</Text>
              <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>
            </View>

            {/* Login Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#6b7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.login.emailPlaceholder")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#6b7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.login.passwordPlaceholder")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  maxLength={128}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.loginButtonText}>{t("auth.login.signIn")}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={styles.forgotPasswordText}>{t("auth.login.forgotPassword")}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("auth.login.or")}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons (Coming Soon) */}
            <Text style={styles.socialComingSoon}>{t("auth.login.socialComingSoon")}</Text>

            {/* Register Link */}
            <View style={styles.registerLink}>
              <Text style={styles.registerLinkText}>{t("auth.login.noAccount")} </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.registerLinkButton}>{t("auth.login.signUp")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    opacity: 0.1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoShadow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#7c3aed",
    opacity: 0.2,
    top: 10,
  },
  logoContainer: {
    width: 140,
    height: 140,
    backgroundColor: "#7c3aed",
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  buttonsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  facebookButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleButtonText: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  facebookButtonText: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    gap: 12,
  },
  emailButtonText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
  },
  comingSoonBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    color: "#7c3aed",
    fontWeight: "600",
  },
  registerLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerLinkText: {
    color: "#6b7280",
    fontSize: 14,
  },
  registerLinkButton: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "600",
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  loginButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  socialComingSoon: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 24,
    gap: 6,
  },
  backButtonText: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "600",
  },
  forgotPasswordLink: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  forgotPasswordText: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "600",
  },
});
