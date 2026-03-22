// app/quiz/results.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";

export default function QuizResults() {
  const params = useLocalSearchParams();

  const score = parseInt(params.score as string);
  const total = parseInt(params.total as string);
  const userAnswers = JSON.parse(params.answers as string);
  const questions = JSON.parse(params.questions as string);

  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 60;

  const getGrade = () => {
    if (percentage >= 90)
      return { grade: "A+", color: "#10b981", message: "Outstanding!" };
    if (percentage >= 80)
      return { grade: "A", color: "#10b981", message: "Excellent!" };
    if (percentage >= 70)
      return { grade: "B", color: "#3b82f6", message: "Good Job!" };
    if (percentage >= 60)
      return { grade: "C", color: "#f59e0b", message: "Passed!" };
    return { grade: "F", color: "#ef4444", message: "Keep Practicing!" };
  };

  const gradeInfo = getGrade();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─── */}
      {/* FIX: layout className + rounded-b-[40px] on LinearGradient → style prop */}
      <LinearGradient
        colors={passed ? ["#10b981", "#059669"] : ["#ef4444", "#dc2626"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        {/* FIX: className on Animatable.View → style prop */}
        <Animatable.View animation="fadeInDown" delay={100}>
          <View style={styles.headerCenter}>
            {/* FIX: className on Animatable.View → style prop */}
            <Animatable.View
              animation="bounceIn"
              delay={300}
              style={styles.trophyCircle}
            >
              <Ionicons
                name={passed ? "trophy" : "sad-outline"}
                size={48}
                color="white"
              />
            </Animatable.View>

            <Text style={styles.completedLabel}>Quiz Completed!</Text>
            <Text style={styles.gradeMessage}>{gradeInfo.message}</Text>
            <Text style={styles.scoreLabel}>
              You scored {score} out of {total}
            </Text>
          </View>
        </Animatable.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Score Cards ─── */}
        {/* FIX: gap → marginRight on first card; flex-1 on Animatable.View → style prop */}
        <View style={styles.scoreCardsRow}>
          <Animatable.View
            animation="fadeInLeft"
            delay={400}
            style={styles.scoreCardAnimWrapper}
          >
            <View style={styles.scoreCard}>
              <View
                style={[
                  styles.gradeCircle,
                  { backgroundColor: gradeInfo.color + "20" },
                ]}
              >
                <Text style={[styles.gradeText, { color: gradeInfo.color }]}>
                  {gradeInfo.grade}
                </Text>
              </View>
              <Text style={styles.scoreCardLabel}>Your Grade</Text>
            </View>
          </Animatable.View>

          <Animatable.View
            animation="fadeInRight"
            delay={500}
            style={styles.scoreCardAnimWrapper}
          >
            <View style={styles.scoreCard}>
              <View style={styles.percentageBox}>
                <Text style={styles.percentageText}>{percentage}%</Text>
              </View>
              <Text style={styles.scoreCardLabel}>Accuracy</Text>
            </View>
          </Animatable.View>
        </View>

        {/* ─── Stats ─── */}
        {/* FIX: className on Animatable.View → style prop */}
        <Animatable.View
          animation="fadeInUp"
          delay={600}
          style={styles.statsCard}
        >
          <Text style={styles.cardTitle}>Quiz Statistics</Text>

          {/* FIX: gap → marginBottom on stat rows */}
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
              <Text style={styles.statLabel}>Correct Answers</Text>
            </View>
            <Text style={[styles.statValue, { color: "#16a34a" }]}>
              {score}
            </Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <View style={[styles.statIcon, { backgroundColor: "#fee2e2" }]}>
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </View>
              <Text style={styles.statLabel}>Wrong Answers</Text>
            </View>
            <Text style={[styles.statValue, { color: "#dc2626" }]}>
              {total - score}
            </Text>
          </View>

          <View style={styles.statRowLast}>
            <View style={styles.statLeft}>
              <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
                <Ionicons name="help-circle" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statLabel}>Total Questions</Text>
            </View>
            <Text style={[styles.statValue, { color: "#2563eb" }]}>
              {total}
            </Text>
          </View>
        </Animatable.View>

        {/* ─── Answer Review ─── */}
        {/* FIX: className on Animatable.View → style prop */}
        <Animatable.View
          animation="fadeInUp"
          delay={700}
          style={styles.reviewCard}
        >
          <Text style={styles.cardTitle}>Answer Review</Text>

          {/* FIX: gap → marginBottom on each review item */}
          <View>
            {questions.map((question: any, index: number) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <View
                  key={question.id}
                  // FIX: conditional className → conditional style array
                  style={[
                    styles.reviewItem,
                    isCorrect
                      ? styles.reviewItemCorrect
                      : styles.reviewItemWrong,
                    index < questions.length - 1 && styles.reviewItemMB,
                  ]}
                >
                  <View style={styles.reviewItemHeader}>
                    <View
                      style={[
                        styles.reviewDot,
                        { backgroundColor: isCorrect ? "#22c55e" : "#ef4444" },
                      ]}
                    >
                      <Ionicons
                        name={isCorrect ? "checkmark" : "close"}
                        size={16}
                        color="white"
                      />
                    </View>
                    <Text style={styles.reviewQuestion}>
                      Q{index + 1}: {question.question}
                    </Text>
                  </View>

                  {/* FIX: ml-9 → marginLeft: 36 */}
                  <View style={styles.reviewAnswers}>
                    <Text
                      style={[
                        styles.reviewYourAnswer,
                        { color: isCorrect ? "#15803d" : "#dc2626" },
                      ]}
                    >
                      Your answer: {question.options[userAnswer]}
                    </Text>
                    {!isCorrect && (
                      <Text style={styles.reviewCorrectAnswer}>
                        Correct: {question.options[question.correctAnswer]}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Animatable.View>

        {/* ─── Action Buttons ─── */}
        {/* FIX: gap → marginBottom on first button */}
        <View>
          {/* FIX: className on Animatable.View → style prop */}
          <Animatable.View
            animation="bounceIn"
            delay={800}
            style={styles.actionButtonMB}
          >
            <TouchableOpacity onPress={() => router.push("/(tabs)/quiz")}>
              {/* FIX: layout className on LinearGradient → style prop */}
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Ionicons name="refresh" size={24} color="white" />
                <Text style={styles.primaryButtonText}>Try Another Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          {/* FIX: className on Animatable.View + TouchableOpacity → style props */}
          <Animatable.View animation="bounceIn" delay={900}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)")}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // ── Gradient header ──
  // FIX: layout + rounded-b-[40px] from className → style
  gradientHeader: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerCenter: {
    alignItems: "center",
  },
  // FIX: className on Animatable.View → style prop
  trophyCircle: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  completedLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  gradeMessage: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 8,
  },
  scoreLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
  },

  // ── Score cards row ──
  // FIX: gap → marginRight on first card
  scoreCardsRow: {
    flexDirection: "row",
    marginTop: 0,
    marginBottom: 24,
  },
  // FIX: flex-1 on Animatable.View → style prop
  scoreCardAnimWrapper: {
    flex: 1,
    marginRight: 0,
  },
  scoreCard: {
    backgroundColor: "#ffffff",
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
  gradeText: {
    fontSize: 28,
    fontWeight: "900",
  },
  percentageBox: {
    height: 64,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  percentageText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#6d28d9",
  },
  scoreCardLabel: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Stats card ──
  // FIX: className on Animatable.View → style prop
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...CARD_SHADOW,
  },
  cardTitle: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  // FIX: gap → border-bottom separates rows; marginBottom on all but last
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    marginBottom: 4,
  },
  statRowLast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  statLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statLabel: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },
  statValue: {
    fontWeight: "900",
    fontSize: 18,
  },

  // ── Review card ──
  // FIX: className on Animatable.View → style prop
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...CARD_SHADOW,
  },

  // FIX: conditional className → conditional style arrays
  reviewItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  reviewItemMB: {
    marginBottom: 12,
  },
  reviewItemCorrect: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  reviewItemWrong: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  reviewItemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    // keeps it from shrinking
    flexShrink: 0,
  },
  reviewQuestion: {
    flex: 1,
    color: "#1f2937",
    fontWeight: "600",
    fontSize: 14,
  },
  // FIX: ml-9 className → marginLeft: 36
  reviewAnswers: {
    marginLeft: 36,
  },
  reviewYourAnswer: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  reviewCorrectAnswer: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Action buttons ──
  // FIX: gap → marginBottom on first button wrapper
  actionButtonMB: {
    marginBottom: 12,
  },
  // FIX: layout className on LinearGradient → style prop
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
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 18,
    marginLeft: 8,
  },
  // FIX: className on TouchableOpacity → style prop
  secondaryButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 16,
  },
});
