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

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useRecaptchaToken();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("auth.register.errorName"));
      return;
    }
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("auth.register.errorEmail"));
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t("common.error"), t("auth.register.errorEmailInvalid"));
      return;
    }
    if (!password.trim()) {
      Alert.alert(t("common.error"), t("auth.register.errorPassword"));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t("common.error"), t("auth.register.errorPasswordLength"));
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
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(t("common.success"), data.message, [
          {
            text: t("common.ok"),
            onPress: () =>
              router.push({
                pathname: "/(auth)/verify-otp",
                params: { email: email.trim().toLowerCase() },
              }),
          },
        ]);
      } else {
        if (data.message && data.message.includes("already registered")) {
          Alert.alert(t("auth.register.alreadyRegistered"), data.message, [
            {
              text: t("auth.register.goToLogin"),
              onPress: () => router.push("/(auth)/login"),
            },
            {
              text: t("common.cancel"),
              style: "cancel",
            },
          ]);
        } else {
          Alert.alert(t("common.error"), data.message || t("auth.register.registrationFailed"));
        }
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
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      backLabel={t("auth.register.backToHome")}
      onBack={() => router.replace("/(tabs)")}
    >
      {/* Form */}
      <View style={authStyles.form}>
        {/* Name Input */}
        <View style={authStyles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color={authColors.muted}
            style={authStyles.inputIcon}
          />
          <TextInput
            style={authStyles.input}
            placeholder={t("auth.register.fullName")}
            placeholderTextColor={authColors.placeholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!isLoading}
          />
        </View>

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
            placeholder={t("auth.register.emailPlaceholder")}
            placeholderTextColor={authColors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        {/* Password Input */}
        <View style={authStyles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={authColors.muted}
            style={authStyles.inputIcon}
          />
          <TextInput
            style={authStyles.input}
            placeholder={t("auth.register.passwordPlaceholder")}
            placeholderTextColor={authColors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            maxLength={128}
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={authColors.muted}
            />
          </TouchableOpacity>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[authStyles.primaryButton, isLoading && authStyles.buttonDisabled]}
          onPress={handleRegister}
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
              <Text style={authStyles.primaryButtonText}>{t("auth.register.createAccount")}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Login Link */}
      <View style={authStyles.linkRow}>
        <Text style={authStyles.linkText}>{t("auth.register.alreadyHaveAccount")} </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={authStyles.link}>{t("auth.register.signIn")}</Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}
