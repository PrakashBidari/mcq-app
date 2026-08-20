// app/my-learning/index.tsx
import AchievementCard from "@/components/AchievementCard";
import AppBottomTabBar from "@/components/AppBottomTabBar";
import { useAuth } from "@/context/AuthContext";
import { useAchievements } from "@/hooks/useAchievements";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyLearningScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const { achievements, summary, loading } = useAchievements();

  const totalAttempts = summary.reduce((sum, s) => sum + s.attempts_count, 0);
  const avgScore = summary.length
    ? Math.round(summary.reduce((sum, s) => sum + s.best_score_percentage, 0) / summary.length)
    : 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === "ja" ? "ja-JP" : "en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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

        <View style={styles.iconWrap}>
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
            style={styles.iconCircle}
          >
            <Ionicons name="ribbon" size={40} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.headerTitle}>{t("myLearning.title")}</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {!isAuthenticated ? (
          <View style={[styles.promptCard, { backgroundColor: colors.card }]}>
            <Ionicons name="lock-closed-outline" size={32} color="#7c3aed" />
            <Text style={[styles.promptTitle, { color: colors.text }]}>
              {t("myLearning.loginTitle")}
            </Text>
            <Text style={[styles.promptDesc, { color: colors.textSecondary }]}>
              {t("myLearning.loginDesc")}
            </Text>
            <TouchableOpacity
              style={styles.promptBtn}
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.85}
            >
              <Text style={styles.promptBtnText}>{t("sidebar.logIn")}</Text>
            </TouchableOpacity>
          </View>
        ) : !loading && summary.length === 0 ? (
          <View style={[styles.promptCard, { backgroundColor: colors.card }]}>
            <Ionicons name="rocket-outline" size={32} color="#7c3aed" />
            <Text style={[styles.promptTitle, { color: colors.text }]}>
              {t("myLearning.emptyTitle")}
            </Text>
            <Text style={[styles.promptDesc, { color: colors.textSecondary }]}>
              {t("myLearning.emptyDesc")}
            </Text>
            <TouchableOpacity
              style={styles.promptBtn}
              onPress={() => router.push("/(tabs)/quiz")}
              activeOpacity={0.85}
            >
              <Text style={styles.promptBtnText}>{t("myLearning.browseQuizzes")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{summary.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t("myLearning.setsPracticed")}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalAttempts}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t("myLearning.totalAttempts")}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{avgScore}%</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t("myLearning.avgScore")}
                </Text>
              </View>
            </View>

            {/* Achievements — same card/data as Home */}
            {achievements.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("myLearning.yourAchievements")}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 8, gap: 14 }}
                >
                  {achievements.map((a, i) => (
                    <AchievementCard key={a.id} item={a} index={i} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Progress list */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("myLearning.yourProgress")}
              </Text>
              <View style={{ gap: 12 }}>
                {summary.map((s) => (
                  <View
                    key={s.question_set_id}
                    style={[
                      styles.setCard,
                      { backgroundColor: colors.card, borderColor: isDark ? colors.border : "#ede8ff" },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.setName, { color: colors.text }]}>{s.name}</Text>
                      {s.category_name && (
                        <Text style={[styles.setCategory, { color: colors.textSecondary }]}>
                          {s.category_name}
                        </Text>
                      )}
                      <View style={styles.setMetaRow}>
                        <Text style={[styles.setMeta, { color: colors.textSecondary }]}>
                          {t("myLearning.bestScore")}: {Math.round(s.best_score_percentage)}%
                        </Text>
                        <Text style={[styles.setMeta, { color: colors.textSecondary }]}>
                          {s.attempts_count} {t("myLearning.attempts")}
                        </Text>
                      </View>
                      <Text style={[styles.setDate, { color: colors.textSecondary }]}>
                        {t("myLearning.lastAttempt")}: {formatDate(s.last_attempted_at)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.practiceBtn}
                      onPress={() => router.push("/(tabs)/quiz")}
                    >
                      <Ionicons name="play" size={18} color="#7c3aed" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
      <AppBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingBottom: 28,
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
  iconWrap: { marginTop: 16, marginBottom: 12 },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },

  promptCard: {
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  promptTitle: { fontSize: 17, fontWeight: "800", marginTop: 14, marginBottom: 6, textAlign: "center" },
  promptDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 18 },
  promptBtn: { backgroundColor: "#7c3aed", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  promptBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  statsRow: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: -1,
    borderRadius: 20,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 6,
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 18 },
  statValue: { fontSize: 20, fontWeight: "900", color: "#7c3aed", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 2, textAlign: "center" },
  statDivider: { width: 1 },

  section: { marginTop: 22, paddingLeft: 18 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 14, paddingRight: 18 },

  setCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginRight: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  setName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  setCategory: { fontSize: 11, marginBottom: 6 },
  setMetaRow: { flexDirection: "row", gap: 14, marginBottom: 4 },
  setMeta: { fontSize: 12, fontWeight: "600" },
  setDate: { fontSize: 11 },
  practiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
