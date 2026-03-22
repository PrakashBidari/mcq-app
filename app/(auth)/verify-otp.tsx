import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

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

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { login: saveAuth } = useAuth();

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds (change to match your backend)
  const [isExpired, setIsExpired] = useState(false);

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

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 30) return "#ef4444"; // Red
    if (timeLeft <= 60) return "#f59e0b"; // Orange
    return "#7c3aed"; // Purple
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input or dismiss keyboard when complete
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (value && index === 5) {
      // Last digit entered — dismiss keyboard so the button is visible
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit OTP");
      return;
    }

    if (isExpired) {
      Alert.alert(
        "OTP Expired",
        "Your OTP has expired. Please request a new one.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otpCode,
        }),
      });

      const data = await response.json();
      console.log("Verify response:", data);

      if (data.success) {
        // Save auth data (verification API returns token)
        await saveAuth(data.data.user, data.data.token);

        Alert.alert(
          "Success!",
          "Email verified successfully! You are now logged in.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(tabs)"),
            },
          ],
        );
      } else {
        Alert.alert("Error", data.message || "Invalid OTP");
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);

    try {
      const response = await fetch(`${API_URL}/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", "OTP resent successfully! Check your email.");
        setOtp(["", "", "", "", "", ""]);
        setTimeLeft(600); // Reset to 10 minutes (change to match your backend)
        setIsExpired(false);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert("Error", data.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      console.error("Resend error:", error);
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
                <Ionicons name="mail-outline" size={60} color="#7c3aed" />
              </View>
              <Text style={styles.title}>Verify Email</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit code to{"\n"}
                <Text style={styles.email}>{email}</Text>
              </Text>
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={24} color={getTimerColor()} />
              <Text style={[styles.timerText, { color: getTimerColor() }]}>
                {isExpired ? "Expired" : formatTime(timeLeft)}
              </Text>
            </View>

            {isExpired && (
              <View style={styles.expiredBanner}>
                <Text style={styles.expiredText}>
                  OTP has expired. Please request a new one.
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
                <Text style={styles.verifyButtonText}>Verify Email</Text>
              )}
            </TouchableOpacity>

            {/* Resend OTP */}
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
                  {isResending ? "Sending..." : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Back to Login */}
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
    height: "30%",
    opacity: 0.1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#f3f4f6",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
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
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
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
});
