// app/quiz/play.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const QUESTIONS_PER_PAGE = 10;

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy":
      return "#10b981";
    case "Medium":
      return "#f59e0b";
    case "Hard":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

export default function QuizPlay() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const allQuestions = JSON.parse(params.questions as string);
  const totalQuestions = parseInt(params.total as string);

  const [currentPage, setCurrentPage] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExplanations, setShowExplanations] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);

  const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, totalQuestions);
  const currentPageQuestions = allQuestions.slice(startIndex, endIndex);
  const isLastPage = currentPage === totalPages - 1;

  const handleSelectAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    const wasCorrect =
      newAnswers[questionIndex] === allQuestions[questionIndex].correctAnswer;
    const isCorrect = answerIndex === allQuestions[questionIndex].correctAnswer;
    if (!wasCorrect && isCorrect) setScore(score + 1);
    else if (wasCorrect && !isCorrect) setScore(score - 1);
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const toggleExplanation = (index: number) => {
    const next = [...showExplanations];
    next[index] = !next[index];
    setShowExplanations(next);
  };

  const handleNextPage = () => {
    if (isLastPage) {
      let finalScore = 0;
      allQuestions.forEach((question: any, index: number) => {
        if (userAnswers[index] === question.correctAnswer) finalScore++;
      });
      router.replace({
        pathname: "/quiz/results",
        params: {
          score: finalScore,
          total: totalQuestions,
          answers: JSON.stringify(userAnswers),
          questions: params.questions,
        },
      });
    } else {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const allPageQuestionsAnswered = currentPageQuestions.every(
    (_: any, idx: number) => userAnswers[startIndex + idx] !== undefined,
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─── */}
      {/* FIX: layout className on LinearGradient → style prop */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        {/* FIX: gap → marginLeft on badge group */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerBadges}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {startIndex + 1}-{endIndex}/{totalQuestions}
              </Text>
            </View>
            {/* FIX: gap → marginLeft on second badge */}
            <View style={[styles.headerBadge, styles.headerBadgeML]}>
              <Text style={styles.headerBadgeText}>Score: {score}</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        {/* FIX: overflow:hidden on wrapping View for progress bar clip */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentPage + 1) / totalPages) * 100}%` as any },
            ]}
          />
        </View>

        <Text style={styles.pageIndicator}>
          Page {currentPage + 1} of {totalPages}
        </Text>
      </LinearGradient>

      {/* ─── Questions ─── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentPageQuestions.map((question: any, pageIndex: number) => {
          const globalIndex = startIndex + pageIndex;
          const selectedAnswer = userAnswers[globalIndex];
          const showExplanation = showExplanations[globalIndex];

          return (
            // FIX: className on Animatable.View → style prop
            <Animatable.View
              key={globalIndex}
              animation="fadeInUp"
              delay={pageIndex * 50}
              style={styles.questionWrapper}
            >
              <View style={styles.questionCard}>
                {/* Question header row */}
                {/* FIX: gap → marginLeft on category badge */}
                <View style={styles.questionMeta}>
                  <View style={styles.questionMetaLeft}>
                    <View style={styles.questionNumber}>
                      <Text style={styles.questionNumberText}>
                        {globalIndex + 1}
                      </Text>
                    </View>
                    <View
                      style={[styles.categoryBadge, styles.categoryBadgeML]}
                    >
                      <Text style={styles.categoryBadgeText}>
                        {question.category}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          getDifficultyColor(question.difficulty) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(question.difficulty) },
                      ]}
                    >
                      {question.difficulty}
                    </Text>
                  </View>
                </View>

                {/* Question Text */}
                <Text style={styles.questionText}>{question.question}</Text>

                {/* Options */}
                {/* FIX: gap → marginBottom on each option */}
                <View>
                  {question.options.map(
                    (option: string, optionIndex: number) => {
                      const isSelected = selectedAnswer === optionIndex;
                      const isCorrect = optionIndex === question.correctAnswer;
                      const showCorrect = showExplanation && isCorrect;
                      const showWrong =
                        showExplanation && isSelected && !isCorrect;

                      // FIX: complex conditional className → style arrays
                      const optionRowStyle = [
                        styles.optionRow,
                        showCorrect
                          ? styles.optionCorrect
                          : showWrong
                            ? styles.optionWrong
                            : isSelected
                              ? styles.optionSelected
                              : styles.optionDefault,
                      ];

                      const radioBorderStyle = showCorrect
                        ? styles.radioCorrect
                        : showWrong
                          ? styles.radioWrong
                          : isSelected
                            ? styles.radioSelected
                            : styles.radioDefault;

                      const optionTextStyle = [
                        styles.optionText,
                        showCorrect
                          ? styles.optionTextCorrect
                          : showWrong
                            ? styles.optionTextWrong
                            : isSelected
                              ? styles.optionTextSelected
                              : styles.optionTextDefault,
                      ];

                      return (
                        <TouchableOpacity
                          key={optionIndex}
                          onPress={() =>
                            !showExplanation &&
                            handleSelectAnswer(globalIndex, optionIndex)
                          }
                          disabled={showExplanation}
                          activeOpacity={0.7}
                          style={styles.optionTouchable}
                        >
                          <View style={optionRowStyle}>
                            {/* Radio */}
                            <View style={[styles.radio, radioBorderStyle]}>
                              {(isSelected || showCorrect) && (
                                <Ionicons
                                  name={showWrong ? "close" : "checkmark"}
                                  size={14}
                                  color="white"
                                />
                              )}
                            </View>

                            {/* Text */}
                            <Text style={optionTextStyle}>{option}</Text>

                            {/* Result icon */}
                            {showCorrect && (
                              <View style={styles.resultIconGreen}>
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="white"
                                />
                              </View>
                            )}
                            {showWrong && (
                              <View style={styles.resultIconRed}>
                                <Ionicons
                                  name="close"
                                  size={16}
                                  color="white"
                                />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    },
                  )}
                </View>

                {/* Explanation */}
                {showExplanation && (
                  // FIX: className on Animatable.View → style prop
                  <Animatable.View
                    animation="fadeInUp"
                    duration={300}
                    style={styles.explanationBox}
                  >
                    <View style={styles.explanationRow}>
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color="#3b82f6"
                      />
                      <View style={styles.explanationText}>
                        <Text style={styles.explanationLabel}>Explanation</Text>
                        <Text style={styles.explanationBody}>
                          {question.explanation}
                        </Text>
                      </View>
                    </View>
                  </Animatable.View>
                )}

                {/* Show Explanation Button */}
                {selectedAnswer !== undefined && !showExplanation && (
                  <TouchableOpacity
                    onPress={() => toggleExplanation(globalIndex)}
                    style={styles.showExplanationButton}
                  >
                    <Text style={styles.showExplanationText}>
                      Show Explanation
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animatable.View>
          );
        })}
      </ScrollView>

      {/* ─── Navigation Bar ─── */}
      {/* FIX: gap → marginRight on Previous button */}
      <View style={[styles.navBar, { paddingBottom: insets.bottom + 16 }]}>
        {/* Previous */}
        <TouchableOpacity
          onPress={handlePreviousPage}
          disabled={currentPage === 0}
          style={[
            styles.prevButton,
            currentPage === 0
              ? styles.prevButtonDisabled
              : styles.prevButtonEnabled,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentPage === 0 ? "#9CA3AF" : "#667eea"}
          />
          <Text
            style={[
              styles.prevButtonText,
              currentPage === 0
                ? styles.prevButtonTextDisabled
                : styles.prevButtonTextEnabled,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {/* Next / Finish */}
        <TouchableOpacity
          onPress={handleNextPage}
          disabled={!allPageQuestionsAnswered}
          style={styles.nextButton}
        >
          {/* FIX: layout className on LinearGradient → style prop */}
          <LinearGradient
            colors={
              !allPageQuestionsAnswered
                ? ["#D1D5DB", "#9CA3AF"]
                : ["#667eea", "#764ba2"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.nextGradient,
              {
                shadowColor: !allPageQuestionsAnswered ? "#9CA3AF" : "#667eea",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              },
            ]}
          >
            <Text style={styles.nextButtonText}>
              {isLastPage ? "Finish Quiz" : "Next Page"}
            </Text>
            <Ionicons
              name={isLastPage ? "checkmark-circle" : "chevron-forward"}
              size={20}
              color="white"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  // FIX: layout from className → style
  gradientHeader: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  // FIX: gap → marginLeft on second badge
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  headerBadgeML: {
    marginLeft: 8,
  },
  headerBadgeText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Progress bar
  // FIX: overflow:hidden on wrapping View to clip fill
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.2)",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    backgroundColor: "#ffffff",
    height: "100%",
    borderRadius: 4,
  },
  pageIndicator: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "center",
  },

  // ── Question card ──
  // FIX: className on Animatable.View → style prop
  questionWrapper: {
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Question meta row
  // FIX: gap → marginLeft on category badge
  questionMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  questionMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  questionNumber: {
    backgroundColor: "#7c3aed",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  questionNumberText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  categoryBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  // FIX: gap → marginLeft
  categoryBadgeML: {
    marginLeft: 8,
  },
  categoryBadgeText: {
    color: "#6d28d9",
    fontWeight: "700",
    fontSize: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  difficultyText: {
    fontWeight: "700",
    fontSize: 12,
  },

  questionText: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: 16,
  },

  // ── Options ──
  // FIX: gap → marginBottom on each option touchable
  optionTouchable: {
    marginBottom: 8,
  },
  // FIX: complex conditional className → named style objects
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  optionDefault: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionSelected: {
    backgroundColor: "#faf5ff",
    borderWidth: 2,
    borderColor: "#7c3aed",
  },
  optionCorrect: {
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
    borderColor: "#22c55e",
  },
  optionWrong: {
    backgroundColor: "#fef2f2",
    borderWidth: 2,
    borderColor: "#ef4444",
  },

  // Radio button
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioDefault: {
    borderColor: "#d1d5db",
    backgroundColor: "transparent",
  },
  radioSelected: {
    borderColor: "#7c3aed",
    backgroundColor: "#7c3aed",
  },
  radioCorrect: {
    borderColor: "#22c55e",
    backgroundColor: "#22c55e",
  },
  radioWrong: {
    borderColor: "#ef4444",
    backgroundColor: "#ef4444",
  },

  // Option text
  optionText: {
    flex: 1,
    fontWeight: "500",
    fontSize: 14,
  },
  optionTextDefault: { color: "#374151" },
  optionTextSelected: { color: "#6d28d9" },
  optionTextCorrect: { color: "#15803d" },
  optionTextWrong: { color: "#dc2626" },

  // Result icons
  resultIconGreen: {
    backgroundColor: "#22c55e",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultIconRed: {
    backgroundColor: "#ef4444",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Explanation ──
  // FIX: className on Animatable.View → style prop
  explanationBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  explanationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  explanationText: {
    flex: 1,
    marginLeft: 8,
  },
  explanationLabel: {
    color: "#1e40af",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 4,
  },
  explanationBody: {
    color: "#1d4ed8",
    fontSize: 12,
    lineHeight: 16,
  },

  showExplanationButton: {
    marginTop: 12,
    backgroundColor: "#dbeafe",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  showExplanationText: {
    color: "#1d4ed8",
    fontWeight: "600",
    fontSize: 14,
  },

  // ── Nav bar ──
  navBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    flexDirection: "row",
    // FIX: gap → marginRight on prev button
  },
  prevButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  prevButtonDisabled: {
    backgroundColor: "#f3f4f6",
  },
  prevButtonEnabled: {
    backgroundColor: "#ede9fe",
  },
  prevButtonText: {
    fontWeight: "700",
    marginLeft: 8,
  },
  prevButtonTextDisabled: { color: "#9ca3af" },
  prevButtonTextEnabled: { color: "#7c3aed" },

  nextButton: {
    flex: 1,
  },
  // FIX: layout className on LinearGradient → style prop
  nextGradient: {
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    marginRight: 8,
  },
});
