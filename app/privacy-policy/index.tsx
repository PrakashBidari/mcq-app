// app/privacy-policy/index.tsx
import AppBottomTabBar from "@/components/AppBottomTabBar";
import { API_URL } from "@/config/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SectionItem = {
  icon: string;
  title: string;
  color: string;
  bg: string;
  content: string;
};

// Editorial content (text + per-section icon) is admin-managed — see backend
// Settings > Privacy Policy. Colors and accordion behavior stay cosmetic/code-owned.
type PrivacyContent = {
  last_updated_label: string | null;
  intro_text_1: string | null;
  items: { title: string; content: string; icon?: string }[];
};

const SECTION_COLORS = [
  { color: "#7c3aed", bg: "#f5f3ff" },
  { color: "#2563eb", bg: "#eff6ff" },
  { color: "#059669", bg: "#ecfdf5" },
  { color: "#dc2626", bg: "#fef2f2" },
  { color: "#d97706", bg: "#fffbeb" },
  { color: "#0891b2", bg: "#ecfeff" },
  { color: "#7c3aed", bg: "#f5f3ff" },
] as const;

const DEFAULT_SECTION_ICONS = [
  "person-outline",
  "server-outline",
  "share-social-outline",
  "lock-closed-outline",
  "archive-outline",
  "phone-portrait-outline",
  "refresh-outline",
] as const;

function PolicySection({
  section,
  index,
}: {
  section: SectionItem;
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
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState<PrivacyContent | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/app-pages/privacy-policy`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setContent(d.data);
      })
      .catch(() => {});
  }, []);

  const rawSections =
    content?.items?.length
      ? content.items
      : [1, 2, 3, 4, 5, 6, 7].map((n, i) => ({
          title: t(`privacy.section${n}Title`),
          content: t(`privacy.section${n}Content`),
          icon: DEFAULT_SECTION_ICONS[i % DEFAULT_SECTION_ICONS.length] as string,
        }));

  const SECTIONS: SectionItem[] = rawSections.map((s, i) => ({
    icon: s.icon || DEFAULT_SECTION_ICONS[i % DEFAULT_SECTION_ICONS.length],
    title: s.title,
    color: SECTION_COLORS[i % SECTION_COLORS.length].color,
    bg: SECTION_COLORS[i % SECTION_COLORS.length].bg,
    content: s.content,
  }));

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
        <Text style={styles.headerTitle}>{t("privacy.title")}</Text>
        <Text style={styles.headerSubtitle}>{t("privacy.subtitle")}</Text>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={12} color="#fff" />
          <Text style={styles.dateText}>{content?.last_updated_label ?? t("privacy.lastUpdated")}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 90 },
        ]}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="information-circle" size={20} color="#7c3aed" />
          <Text style={styles.introText}>{content?.intro_text_1 ?? t("privacy.introText")}</Text>
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
            <Text style={styles.contactTitle}>{t("privacy.questionsTitle")}</Text>
            <Text style={styles.contactDesc}>{t("privacy.questionsDesc")}</Text>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => router.push("/contact-us")}
              activeOpacity={0.85}
            >
              <Text style={styles.contactBtnText}>{t("privacy.contactUs")}</Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
      <AppBottomTabBar />
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
