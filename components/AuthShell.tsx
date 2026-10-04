import BrandLogo from "@/components/BrandLogo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Brand palette shared by the auth screens
export const authColors = {
  ink: "#0a0f24",
  inkSoft: "#161d3d",
  brand: "#3b47b0",
  brandDark: "#232a5a",
  gold: "#d4b160",
  goldLight: "#e3c781",
  goldDark: "#a37f37",
  text: "#0f1530",
  muted: "#6b7280",
  placeholder: "#9ca3af",
  border: "#e5e7ef",
  field: "#f7f8fc",
  surface: "#ffffff",
};

type Props = {
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
};

// Dark branded header with the form in a raised white sheet below it
export default function AuthShell({
  title,
  subtitle,
  backLabel,
  onBack,
  children,
}: Props) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[authColors.ink, authColors.inkSoft, authColors.brandDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowGold} />
      <View style={styles.glowBrand} />

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={18} color={authColors.goldLight} />
                <Text style={styles.backButtonText}>{backLabel}</Text>
              </TouchableOpacity>

              <View style={styles.logo}>
                <BrandLogo size={88} />
              </View>
              <Text style={styles.brand}>Ikigai Connect</Text>
              <View style={styles.brandRule} />
            </View>

            <View style={styles.sheet}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Field, button and link styles shared by the auth forms
export const authStyles = StyleSheet.create({
  form: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.field,
    borderWidth: 1,
    borderColor: authColors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: authColors.text,
  },
  primaryButton: {
    borderRadius: 14,
    marginTop: 6,
    shadowColor: authColors.brandDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButtonFill: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },
  linkText: {
    color: authColors.muted,
    fontSize: 14,
  },
  link: {
    color: authColors.brand,
    fontSize: 14,
    fontWeight: "700",
  },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: authColors.ink,
  },
  glowGold: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: authColors.gold,
    opacity: 0.1,
  },
  glowBrand: {
    position: "absolute",
    top: 120,
    left: -110,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: authColors.brand,
    opacity: 0.22,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: 20,
  },
  backButtonText: {
    color: authColors.goldLight,
    fontSize: 14,
    fontWeight: "600",
  },
  logo: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  brand: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.4,
  },
  brandRule: {
    marginTop: 10,
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: authColors.gold,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: authColors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: authColors.text,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 26,
    fontSize: 15,
    lineHeight: 22,
    color: authColors.muted,
  },
});
