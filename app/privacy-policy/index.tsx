// app/privacy-policy/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    icon: "person-outline",
    title: "Information We Collect",
    color: "#7c3aed",
    bg: "#f5f3ff",
    content: `We collect information you provide directly to us when you create an account, such as your name, email address, and profile details.\n\nWe also automatically collect certain information when you use our app, including:\n\n• Device information (model, OS version)\n• Usage data (screens visited, quizzes taken)\n• Performance and crash data to improve stability`,
  },
  {
    icon: "server-outline",
    title: "How We Use Your Information",
    color: "#2563eb",
    bg: "#eff6ff",
    content: `We use the information we collect to:\n\n• Provide, maintain, and improve our services\n• Personalize your learning experience\n• Track your progress and achievements\n• Send you updates and notifications (with your consent)\n• Respond to your comments and questions\n• Monitor and analyze usage patterns to enhance the app`,
  },
  {
    icon: "share-social-outline",
    title: "Information Sharing",
    color: "#059669",
    bg: "#ecfdf5",
    content: `We do not sell, trade, or rent your personal information to third parties.\n\nWe may share your information only in these limited circumstances:\n\n• With service providers who assist us in operating our app\n• When required by law or to protect our legal rights\n• In connection with a merger or acquisition (you will be notified)\n\nAll third-party partners are bound by strict data protection agreements.`,
  },
  {
    icon: "lock-closed-outline",
    title: "Data Security",
    color: "#dc2626",
    bg: "#fef2f2",
    content: `We take the security of your data seriously. We implement industry-standard security measures including:\n\n• SSL/TLS encryption for all data transmission\n• Secure token-based authentication\n• Regular security audits and vulnerability testing\n• Encrypted storage of sensitive information\n\nHowever, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password.`,
  },
  {
    icon: "archive-outline",
    title: "Data Retention",
    color: "#d97706",
    bg: "#fffbeb",
    content: `We retain your personal information for as long as your account is active or as needed to provide our services.\n\nYou may request deletion of your account and associated data at any time by contacting us. We will process your request within 30 days.\n\nSome information may be retained for legal or legitimate business purposes even after account deletion.`,
  },
  {
    icon: "phone-portrait-outline",
    title: "Your Rights",
    color: "#0891b2",
    bg: "#ecfeff",
    content: `You have the following rights regarding your personal data:\n\n• Access: Request a copy of the data we hold about you\n• Correction: Update or correct inaccurate information\n• Deletion: Request removal of your personal data\n• Portability: Receive your data in a machine-readable format\n• Objection: Opt out of certain data processing activities\n\nTo exercise any of these rights, please contact us through the app.`,
  },
  {
    icon: "refresh-outline",
    title: "Changes to This Policy",
    color: "#7c3aed",
    bg: "#f5f3ff",
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons.\n\nWhen we make significant changes, we will notify you through the app or by email. The "Last Updated" date at the bottom of this page indicates when the policy was last revised.\n\nContinued use of the app after changes constitutes acceptance of the updated policy.`,
  },
];

function PolicySection({
  section,
  index,
}: {
  section: (typeof SECTIONS)[0];
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIconBox, { backgroundColor: section.bg }]}>
          <Ionicons name={section.icon as any} size={20} color={section.color} />
        </View>
        <Text style={styles.cardTitle}>{section.title}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#94a3b8"
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardBody}>
          <View style={[styles.cardAccent, { backgroundColor: section.color }]} />
          <Text style={styles.cardContent}>{section.content}</Text>
        </View>
      )}
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

        <View style={styles.shieldWrap}>
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
            style={styles.shieldCircle}
          >
            <Ionicons name="shield-checkmark" size={40} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.headerSubtitle}>
          Your privacy is our priority
        </Text>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={12} color="#fff" />
          <Text style={styles.dateText}>Last updated: January 2025</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="information-circle" size={20} color="#7c3aed" />
          <Text style={styles.introText}>
            This policy explains how MCQ Hub collects, uses, and protects your
            personal information. Tap any section to expand it.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <PolicySection key={section.title} section={section} index={index} />
        ))}

        {/* Contact */}
        <View style={styles.contactCard}>
          <LinearGradient
            colors={["#7c3aed", "#a855f7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contactGrad}
          >
            <Ionicons name="mail-outline" size={28} color="#fff" />
            <Text style={styles.contactTitle}>Questions about privacy?</Text>
            <Text style={styles.contactDesc}>
              Contact our privacy team and we'll respond within 48 hours.
            </Text>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => router.push("/contact-us")}
              activeOpacity={0.85}
            >
              <Text style={styles.contactBtnText}>Contact Us</Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F3FF" },

  header: {
    paddingBottom: 30,
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
  shieldWrap: { marginTop: 16, marginBottom: 14 },
  shieldCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginTop: 4,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dateText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  content: { padding: 18 },

  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#7c3aed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardBody: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 12,
  },
  cardAccent: {
    width: 3,
    borderRadius: 2,
    minHeight: 20,
    alignSelf: "stretch",
  },
  cardContent: {
    flex: 1,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 21,
  },

  contactCard: {
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  contactGrad: {
    padding: 24,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginTop: 12,
    marginBottom: 6,
  },
  contactDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7c3aed",
  },
});
