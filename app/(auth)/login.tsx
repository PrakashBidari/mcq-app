// app/(auth)/login.tsx
import AuthShell, { authColors, authStyles } from "@/components/AuthShell";
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login: saveAuth } = useAuth();

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

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
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
    <AuthShell
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      backLabel={t("auth.login.backToHome")}
      onBack={() => router.replace("/(tabs)")}
    >
      {/* Login Form */}
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
            placeholder={t("auth.login.emailPlaceholder")}
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
            placeholder={t("auth.login.passwordPlaceholder")}
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

        {/* Forgot Password Link */}
        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={() => router.push("/(auth)/forgot-password")}
        >
          <Text style={authStyles.link}>{t("auth.login.forgotPassword")}</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[authStyles.primaryButton, isLoading && authStyles.buttonDisabled]}
          onPress={handleLogin}
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
              <Text style={authStyles.primaryButtonText}>{t("auth.login.signIn")}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t("auth.login.or")}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Buttons (Coming Soon) */}
      <Text style={styles.socialComingSoon}>{t("auth.login.socialComingSoon")}</Text>

      {/* Register Link */}
      <View style={authStyles.linkRow}>
        <Text style={authStyles.linkText}>{t("auth.login.noAccount")} </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={authStyles.link}>{t("auth.login.signUp")}</Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgotPasswordLink: {
    alignSelf: "flex-end",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: authColors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: authColors.placeholder,
    fontSize: 14,
    fontWeight: "500",
  },
  socialComingSoon: {
    textAlign: "center",
    color: authColors.placeholder,
    fontSize: 14,
  },
});
