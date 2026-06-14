import { API_URL } from "@/config/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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

export default function VerifyResetOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isExpired, setIsExpired] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const isExpiredRef = useRef(false);

  // Sync isExpired to ref (stale closure fix)
  useEffect(() => {
    isExpiredRef.current = isExpired;
  }, [isExpired]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 30) return "#ef4444";
    if (timeLeft <= 60) return "#f59e0b";
    return "#7c3aed";
  };

  // Core API function — accepts otpCode directly (no stale state)
  const handleVerifyWithCode = useCallback(
    async (otpCode: string) => {
      if (isExpiredRef.current) {
        Alert.alert(
          "Code Expired",
          "Your reset code has expired. Please request a new one.",
        );
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`${API_URL}/verify-reset-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpCode }),
        });

        const data = await response.json();

        if (data.success) {
          router.push({
            pathname: "/(auth)/reset-password",
            params: { email: email, otp: otpCode },
          });
        } else {
          Alert.alert("Error", data.message || "Invalid reset code");
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      } catch {
        Alert.alert("Error", "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, router],
  );

  // Called by verify buttons — reads from state
  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }
    await handleVerifyWithCode(otpCode);
  };

  // Auto-verify when all 6 digits filled — works on both iOS and Android
  useEffect(() => {
    const otpCode = otp.join("");
    if (otpCode.length === 6 && !otp.includes("")) {
      Keyboard.dismiss();
      handleVerifyWithCode(otpCode);
    }
  }, [otp]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) value = value[0];

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else if (value && index === 5) {
        Keyboard.dismiss();
      }
    },
    [otp],
  );

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", "Reset code resent! Check your email.");
        setOtp(["", "", "", "", "", ""]);
        setTimeLeft(600);
        setIsExpired(false);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert("Error", data.message || "Failed to resend code");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7c3aed", "#a855f7", "#ec4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={60}
                  color="#7c3aed"
                />
              </View>
              <Text style={styles.title}>Verify Reset Code</Text>
              <Text style={styles.subtitle}>
                Enter the code sent to{"\n"}
                <Text style={styles.email}>{email}</Text>
              </Text>
            </View>

            {/* Timer + Quick Verify Btn */}
            <View style={styles.timerContainer}>
              <View style={styles.timerLeft}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={getTimerColor()}
                />
                <Text style={[styles.timerText, { color: getTimerColor() }]}>
                  {isExpired ? "Expired" : formatTime(timeLeft)}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.timerVerifyBtn,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>

            {isExpired && (
              <View style={styles.expiredBanner}>
                <Text style={styles.expiredText}>
                  Reset code has expired. Please request a new one.
                </Text>
              </View>
            )}

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent: { key } }) =>
                    handleKeyPress(index, key)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isLoading}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            {/* Resend */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={isResending}
              >
                <Text
                  style={[
                    styles.resendButton,
                    isResending && styles.resendButtonDisabled,
                  ]}
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Back */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
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
    height: "12%",
    opacity: 0.1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#f3f4f6",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  email: {
    color: "#7c3aed",
    fontWeight: "600",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
  },
  timerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  timerVerifyBtn: {
    backgroundColor: "#7c3aed",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  expiredBanner: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  expiredText: {
    color: "#ef4444",
    textAlign: "center",
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  otpInputFilled: {
    borderColor: "#7c3aed",
    backgroundColor: "#ffffff",
  },
  verifyButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  resendText: {
    color: "#6b7280",
    fontSize: 14,
  },
  resendButton: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "600",
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  backButtonText: {
    color: "#6b7280",
    fontSize: 14,
  },
});
