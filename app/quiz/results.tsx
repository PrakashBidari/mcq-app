// app/quiz/results.tsx
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { quizStore } from "@/utils/quizStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";

// Memoized review row — only re-renders if its own data changes
const ReviewItem = React.memo(
  ({
    question,
    userAnswer,
    index,
    isLast,
    yourAnswerLabel,
    notAnsweredLabel,
    correctLabel,
  }: {
    question: any;
    userAnswer: number;
    index: number;
    isLast: boolean;
    yourAnswerLabel: string;
    notAnsweredLabel: string;
    correctLabel: string;
  }) => {
    const isUnanswered = userAnswer === -1 || userAnswer === undefined;
    const isCorrect = !isUnanswered && userAnswer === question.correctAnswer;
    return (
      <View
        style={[
          styles.reviewItem,
          isUnanswered
            ? styles.reviewItemUnanswered
            : isCorrect
              ? styles.reviewItemCorrect
              : styles.reviewItemWrong,
          !isLast && styles.reviewItemMB,
        ]}
      >
        <View style={styles.reviewItemHeader}>
          <View
            style={[
              styles.reviewDot,
              { backgroundColor: isUnanswered ? "#9ca3af" : isCorrect ? "#22c55e" : "#ef4444" },
            ]}
          >
            <Ionicons
              name={isUnanswered ? "remove" : isCorrect ? "checkmark" : "close"}
              size={16}
              color="white"
            />
          </View>
          <Text style={styles.reviewQuestion}>
            Q{index + 1}: {question.question}
          </Text>
        </View>
        <View style={styles.reviewAnswers}>
          <Text
            style={[
              styles.reviewYourAnswer,
              { color: isUnanswered ? "#6b7280" : isCorrect ? "#15803d" : "#dc2626" },
            ]}
          >
            {yourAnswerLabel}{" "}
            {isUnanswered ? notAnsweredLabel : question.options[userAnswer]}
          </Text>
          {(!isCorrect || isUnanswered) && (
            <Text style={styles.reviewCorrectAnswer}>
              {correctLabel} {question.options[question.correctAnswer]}
            </Text>
          )}
        </View>
      </View>
    );
  },
);

export default function QuizResults() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { token } = useAuth();

  const score = parseInt(params.score as string) || 0;
  const total = parseInt(params.total as string) || 0;

  // Read from store — no JSON.parse cost
  const userAnswers = quizStore.getAnswers() ?? [];
  const questions = quizStore.getQuestions() ?? [];

  // Redirect in effect — never during render
  useEffect(() => {
    if (questions.length === 0) {
      router.replace("/(tabs)/quiz");
    }
  }, []);

  // Persist the attempt once per results screen — guests are skipped silently
  // (save-attempt is auth-only), and any failure is silent too, matching the
  // rest of the app's convention for non-blocking background calls.
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current || questions.length === 0 || !token) return;
    savedRef.current = true;

    const questionSetId = params.questionSetId ? parseInt(params.questionSetId as string) : null;
    const timeTakenSeconds = params.timeTakenSeconds ? parseInt(params.timeTakenSeconds as string) : undefined;

    fetch(`${API_URL}/quiz/save-attempt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question_set_id: questionSetId,
        score,
        total_questions: total,
        answers: userAnswers,
        time_taken_seconds: timeTakenSeconds,
      }),
    }).catch(() => {});
  }, [questions.length, token]);

  if (questions.length === 0) return null;

  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 60;
  const unanswered = userAnswers.filter((a: number) => a === -1).length;

  const getGrade = () => {
    if (percentage >= 90) return { grade: "A+", color: "#10b981", message: t("quizResults.outstanding") };
    if (percentage >= 80) return { grade: "A", color: "#10b981", message: t("quizResults.excellent") };
    if (percentage >= 70) return { grade: "B", color: "#3b82f6", message: t("quizResults.goodJob") };
    if (percentage >= 60) return { grade: "C", color: "#f59e0b", message: t("quizResults.passed") };
    return { grade: "F", color: "#ef4444", message: t("quizResults.keepPracticing") };
  };

  const gradeInfo = getGrade();

  const yourAnswerLabel = t("quizResults.yourAnswer");
  const notAnsweredLabel = t("quizResults.notAnswered");
  const correctLabel = t("quizResults.correct");

  const ListHeader = (
    <View>
      {/* Score Cards */}
      <View style={styles.scoreCardsRow}>
        <Animatable.View animation="fadeInLeft" delay={400} style={styles.scoreCardWrap}>
          <View style={styles.scoreCard}>
            <View style={[styles.gradeCircle, { backgroundColor: gradeInfo.color + "20" }]}>
              <Text style={[styles.gradeText, { color: gradeInfo.color }]}>{gradeInfo.grade}</Text>
            </View>
            <Text style={styles.scoreCardLabel}>{t("quizResults.yourGrade")}</Text>
          </View>
        </Animatable.View>
        <Animatable.View animation="fadeInRight" delay={500} style={styles.scoreCardWrap}>
          <View style={styles.scoreCard}>
            <View style={styles.percentageBox}>
              <Text style={styles.percentageText}>{percentage}%</Text>
            </View>
            <Text style={styles.scoreCardLabel}>{t("quizResults.accuracy")}</Text>
          </View>
        </Animatable.View>
      </View>

      {/* Stats */}
      <Animatable.View animation="fadeInUp" delay={600} style={styles.statsCard}>
        <Text style={styles.cardTitle}>{t("quizResults.quizStats")}</Text>
        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <Text style={styles.statLabel}>{t("quizResults.correctAnswers")}</Text>
          </View>
          <Text style={[styles.statValue, { color: "#16a34a" }]}>{score}</Text>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <View style={[styles.statIcon, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </View>
            <Text style={styles.statLabel}>{t("quizResults.wrongAnswers")}</Text>
          </View>
          <Text style={[styles.statValue, { color: "#dc2626" }]}>{total - score - unanswered}</Text>
        </View>
        {unanswered > 0 && (
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <View style={[styles.statIcon, { backgroundColor: "#f3f4f6" }]}>
                <Ionicons name="remove-circle" size={20} color="#9ca3af" />
              </View>
              <Text style={styles.statLabel}>{t("quizResults.unansweredCount")}</Text>
            </View>
            <Text style={[styles.statValue, { color: "#6b7280" }]}>{unanswered}</Text>
          </View>
        )}
        <View style={styles.statRowLast}>
          <View style={styles.statLeft}>
            <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="help-circle" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.statLabel}>{t("quizResults.totalQuestions")}</Text>
          </View>
          <Text style={[styles.statValue, { color: "#2563eb" }]}>{total}</Text>
        </View>
      </Animatable.View>

      {/* Answer Review header */}
      <Text style={[styles.cardTitle, { marginBottom: 12 }]}>{t("quizResults.answerReview")}</Text>
    </View>
  );

  const ListFooter = (
    <View style={{ marginTop: 8 }}>
      <Animatable.View animation="bounceIn" delay={800} style={styles.actionButtonMB}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/quiz")}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.primaryButtonText}>{t("quizResults.tryAnother")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
      <Animatable.View animation="bounceIn" delay={900}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{t("quizResults.backToHome")}</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={passed ? ["#10b981", "#059669"] : ["#ef4444", "#dc2626"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <Animatable.View animation="fadeInDown" delay={100}>
          <View style={styles.headerCenter}>
            <Animatable.View animation="bounceIn" delay={300} style={styles.trophyCircle}>
              <Ionicons name={passed ? "trophy" : "sad-outline"} size={48} color="white" />
            </Animatable.View>
            <Text style={styles.completedLabel}>{t("quizResults.quizCompleted")}</Text>
            <Text style={styles.gradeMessage}>{gradeInfo.message}</Text>
            <Text style={styles.scoreLabel}>
              {t("quizResults.youScored")} {score} {t("quizResults.outOf")} {total}
              {unanswered > 0 && ` • ${unanswered} ${t("quizResults.unanswered")}`}
            </Text>
          </View>
        </Animatable.View>
      </LinearGradient>

      {/* Virtualized list — renders only visible review items */}
      <FlatList
        data={questions}
        keyExtractor={(item) => String(item.id ?? item)}
        renderItem={({ item, index }) => (
          <ReviewItem
            question={item}
            userAnswer={userAnswers[index]}
            index={index}
            isLast={index === questions.length - 1}
            yourAnswerLabel={yourAnswerLabel}
            notAnsweredLabel={notAnsweredLabel}
            correctLabel={correctLabel}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 8,
} as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { padding: 20, paddingBottom: 100 },

  gradientHeader: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerCenter: { alignItems: "center" },
  trophyCircle: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  completedLabel: { color: "rgba(255,255,255,0.9)", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  gradeMessage: { color: "#ffffff", fontSize: 36, fontWeight: "900", marginBottom: 8 },
  scoreLabel: { color: "rgba(255,255,255,0.8)", fontSize: 16, textAlign: "center" },

  scoreCardsRow: { flexDirection: "row", marginTop: 0, marginBottom: 24 },
  scoreCardWrap: { flex: 1 },
  scoreCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginRight: 12,
    ...CARD_SHADOW,
  },
  gradeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  gradeText: { fontSize: 28, fontWeight: "900" },
  percentageBox: { height: 64, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  percentageText: { fontSize: 28, fontWeight: "900", color: "#6d28d9" },
  scoreCardLabel: { color: "#6b7280", fontSize: 14, fontWeight: "600" },

  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...CARD_SHADOW,
  },
  cardTitle: { color: "#1f2937", fontSize: 18, fontWeight: "700", marginBottom: 16 },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  statRowLast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  statLeft: { flexDirection: "row", alignItems: "center" },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statLabel: { color: "#374151", fontWeight: "600", fontSize: 15 },
  statValue: { fontWeight: "900", fontSize: 18 },

  reviewItem: { padding: 16, borderRadius: 16, borderWidth: 1 },
  reviewItemMB: { marginBottom: 12 },
  reviewItemCorrect: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  reviewItemWrong: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  reviewItemUnanswered: { backgroundColor: "#f9fafb", borderColor: "#e5e7eb" },
  reviewItemHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  reviewDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  reviewQuestion: { flex: 1, color: "#1f2937", fontWeight: "600", fontSize: 14 },
  reviewAnswers: { marginLeft: 36 },
  reviewYourAnswer: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  reviewCorrectAnswer: { color: "#15803d", fontSize: 12, fontWeight: "700" },

  actionButtonMB: { marginBottom: 12 },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: { color: "#ffffff", fontWeight: "900", fontSize: 18, marginLeft: 8 },
  secondaryButton: { backgroundColor: "#f3f4f6", paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  secondaryButtonText: { color: "#374151", fontWeight: "700", fontSize: 16 },
});
