import AuthShell, { authColors, authStyles } from "@/components/AuthShell";
import { API_URL } from "@/config/constants";
import { useRecaptchaToken } from "@/context/RecaptchaContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useRecaptchaToken();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("auth.forgotPassword.errorEmail"));
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t("common.error"), t("auth.forgotPassword.errorEmailInvalid"));
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
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(t("common.success"), t("auth.forgotPassword.codeSent"), [
          {
            text: t("common.ok"),
            onPress: () =>
              router.push({
                pathname: "/(auth)/verify-reset-otp",
                params: { email: email.trim().toLowerCase() },
              }),
          },
        ]);
      } else {
        Alert.alert(t("common.error"), data.message || t("auth.forgotPassword.failedToSend"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      Alert.alert(t("common.error"), message || t("common.somethingWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.forgotPassword.title")}
      subtitle={t("auth.forgotPassword.subtitle")}
      backLabel={t("auth.forgotPassword.backToLogin")}
      onBack={() => router.back()}
    >
      <View style={authStyles.form}>
        {/* Email Input */}
        <View style={authStyles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={authColors.muted}
            style={authStyles.inputIcon}
          />
          <TextInput
            style={authStyles.input}
            placeholder={t("auth.forgotPassword.emailPlaceholder")}
            placeholderTextColor={authColors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        {/* Send Code Button */}
        <TouchableOpacity
          style={[authStyles.primaryButton, isLoading && authStyles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={isLoading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[authColors.inkSoft, authColors.brand]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={authStyles.primaryButtonFill}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={authStyles.primaryButtonText}>{t("auth.forgotPassword.sendCode")}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}
