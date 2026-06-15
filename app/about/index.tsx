// app/about/index.tsx
import AppBottomTabBar from "@/components/AppBottomTabBar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AboutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const FEATURES = [
    {
      icon: "school-outline",
      title: t("about.feature1Title"),
      desc: t("about.feature1Desc"),
      color: "#7c3aed",
      bg: "#f5f3ff",
    },
    {
      icon: "book-outline",
      title: t("about.feature2Title"),
      desc: t("about.feature2Desc"),
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      icon: "trophy-outline",
      title: t("about.feature3Title"),
      desc: t("about.feature3Desc"),
      color: "#059669",
      bg: "#ecfdf5",
    },
    {
      icon: "shield-checkmark-outline",
      title: t("about.feature4Title"),
      desc: t("about.feature4Desc"),
      color: "#dc2626",
      bg: "#fef2f2",
    },
  ];

  const STATS = [
    { value: "10K+", label: t("about.questionsLabel") },
    { value: "50+", label: t("about.categoriesLabel") },
    { value: "5K+", label: t("about.learnersLabel") },
    { value: "4.8★", label: t("about.ratingLabel") },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={["#6d28d9", "#7c3aed", "#a855f7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />

        <View style={styles.logoWrap}>
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
            style={styles.logoCircle}
          >
            <Ionicons name="school" size={44} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.appName}>MCQ Hub</Text>
        <Text style={styles.appTagline}>{t("about.appTagline")}</Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>{t("common.version")}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about.aboutTitle")}</Text>
          <Text style={styles.bodyText}>{t("about.aboutText1")}</Text>
          <Text style={[styles.bodyText, { marginTop: 10 }]}>{t("about.aboutText2")}</Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about.featuresTitle")}</Text>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon as any} size={24} color={f.color} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Developer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about.developerTitle")}</Text>
          <View style={styles.devCard}>
            <LinearGradient
              colors={["#7c3aed", "#a855f7"]}
              style={styles.devAvatar}
            >
              <Ionicons name="code-slash" size={28} color="#fff" />
            </LinearGradient>
            <View style={styles.devInfo}>
              <Text style={styles.devName}>Ikigai Job Placement</Text>
              <Text style={styles.devRole}>Product Team</Text>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://app.ikigaijobplacement.com")
                }
              >
                <Text style={styles.devLink}>app.ikigaijobplacement.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push("/privacy-policy")}
          >
            <Ionicons name="shield-outline" size={20} color="#7c3aed" />
            <Text style={styles.linkText}>{t("about.privacyPolicy")}</Text>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push("/contact-us")}
          >
            <Ionicons name="mail-outline" size={20} color="#7c3aed" />
            <Text style={styles.linkText}>{t("about.contactUs")}</Text>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>{t("about.copyright")}</Text>
      </ScrollView>
      <AppBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F3FF" },
  header: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  backBtn: {
    position: "absolute",
    top: 52,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  headerDecor1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -50,
    right: -40,
  },
  headerDecor2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -20,
    left: -20,
  },
  logoWrap: { marginTop: 16, marginBottom: 14 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  appName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginTop: 4,
    letterSpacing: 1,
  },
  versionBadge: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  versionText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  statsRow: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: -1,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 6,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRightWidth: 1,
    borderRightColor: "#f1f5f9",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#7c3aed",
    letterSpacing: -0.5,
  },
  statLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "600", marginTop: 2 },

  section: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e0f4e",
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  bodyText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 22,
  },

  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 14,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 3,
  },
  featureDesc: { fontSize: 13, color: "#64748b", lineHeight: 19 },

  devCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  devAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  devInfo: { flex: 1 },
  devName: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  devRole: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  devLink: {
    fontSize: 13,
    color: "#7c3aed",
    fontWeight: "600",
    marginTop: 4,
    textDecorationLine: "underline",
  },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 12,
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#334155" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },

  copyright: {
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 24,
    marginBottom: 8,
  },
});
