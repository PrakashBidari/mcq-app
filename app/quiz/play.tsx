// app/quiz/play.tsx
import FuriganaText from "@/components/FuriganaText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// import ScreenshotPrevent from "react-native-screenshot-prevent";

import { useAuth } from "@/context/AuthContext";

let ScreenshotPrevent: any = null;
try {
  ScreenshotPrevent = require("react-native-screenshot-prevent").default;
} catch (e) {
  ScreenshotPrevent = {
    enabled: () => {},
    ScreenshotPreventView: ({ children, style }: any) =>
      require("react-native").createElement(
        require("react-native").View,
        { style },
        children,
      ),
  };
}

const OPTION_LABELS = ["A", "B", "C", "D"];

const getDifficultyColor = (d: string) => {
  if (d === "Easy") return "#10b981";
  if (d === "Medium") return "#f59e0b";
  if (d === "Hard") return "#ef4444";
  return "#6b7280";
};

export default function QuizPlay() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    router.replace("/(auth)/login");
    return null;
  }

  let rawQuestions: any[] = [];
  try {
    rawQuestions = JSON.parse(params.questions as string);
  } catch {
    router.back();
    return null;
  }
  const allQuestions = [...rawQuestions].sort((a: any, b: any) => {
    const posA = a.position ?? Number.MAX_SAFE_INTEGER;
    const posB = b.position ?? Number.MAX_SAFE_INTEGER;
    if (posA !== posB) return posA - posB;
    return b.id - a.id;
  });

  const totalQuestions = allQuestions.length;
  const timeLimitMinutes = parseInt(params.timeLimit as string) || 0;
  const timeLimitSeconds = timeLimitMinutes * 60;
  const hasTimer = timeLimitSeconds > 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | undefined)[]>(() =>
    new Array(totalQuestions).fill(undefined),
  );
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReview, setIsReview] = useState(false);

  const answersRef = useRef(userAnswers);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    answersRef.current = userAnswers;
  }, [userAnswers]);

  // ── Enable screenshot prevention on mount, disable on unmount ──
  useEffect(() => {
    ScreenshotPrevent.enabled(true);
    return () => {
      ScreenshotPrevent.enabled(false);
    };
  }, []);

  useEffect(() => {
    if (!hasTimer) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          goToResults(answersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasTimer]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const getTimerColor = () => {
    if (!hasTimer) return "#667eea";
    const p = timeLeft / timeLimitSeconds;
    return p > 0.5 ? "#10b981" : p > 0.25 ? "#f59e0b" : "#ef4444";
  };

  const goToResults = (answers: (number | undefined)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = allQuestions.reduce(
      (s: number, q: any, i: number) =>
        answers[i] === q.correctAnswer ? s + 1 : s,
      0,
    );
    router.replace({
      pathname: "/quiz/results",
      params: {
        score,
        total: totalQuestions,
        answers: JSON.stringify(answers.map((a) => (a === undefined ? -1 : a))),
        questions: JSON.stringify(allQuestions),
      },
    });
  };

  const handleSelect = (optIdx: number) => {
    const next = [...userAnswers];
    next[currentIndex] = optIdx;
    setUserAnswers(next);
    setShowExplanation(false);
  };

  const handleReviewChange = (qIdx: number, optIdx: number) => {
    const next = [...userAnswers];
    next[qIdx] = optIdx;
    setUserAnswers(next);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < totalQuestions - 1) setCurrentIndex(currentIndex + 1);
    else setIsFinished(true);
  };

  const handlePrev = () => {
    setShowExplanation(false);
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const currentQuestion = allQuestions[currentIndex];
  const selectedAnswer = userAnswers[currentIndex];
  const isAnswered = selectedAnswer !== undefined;
  const answeredCount = userAnswers.filter((a) => a !== undefined).length;
  const tc = getTimerColor();

  const TimerBadge = () =>
    hasTimer ? (
      <View
        style={[
          styles.timerBadge,
          { borderColor: tc, backgroundColor: tc + "25" },
        ]}
      >
        <Ionicons name="time-outline" size={13} color={tc} />
        <Text style={[styles.timerTxt, { color: tc }]}>
          {formatTime(timeLeft)}
        </Text>
      </View>
    ) : null;

  // ════════════════════════════════════════
  // FINISHED SCREEN
  // ════════════════════════════════════════
  if (isFinished && !isReview) {
    const skipped = totalQuestions - answeredCount;
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={[styles.finishHeader, { paddingTop: insets.top + 20 }]}
        >
          {hasTimer && (
            <View style={styles.finishTimerRow}>
              <TimerBadge />
            </View>
          )}
          <Text style={styles.finishEmoji}>🎉</Text>
          <Text style={styles.finishTitle}>{t("quizPlay.allDone")}</Text>
          <Text style={styles.finishSub}>
            {answeredCount} {t("quizPlay.of")} {totalQuestions} {t("quizPlay.answered")}
          </Text>
        </LinearGradient>
        <View style={styles.finishBody}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: "#667eea" }]}>
                {answeredCount}
              </Text>
              <Text style={styles.statLabel}>{t("quizPlay.answered")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: "#ef4444" }]}>
                {skipped}
              </Text>
              <Text style={styles.statLabel}>{t("quizPlay.skipped")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: "#f59e0b" }]}>
                {totalQuestions}
              </Text>
              <Text style={styles.statLabel}>{t("quizPlay.total")}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              setIsFinished(false);
              setIsReview(true);
            }}
            style={styles.reviewBtn}
          >
            <Ionicons name="list-outline" size={22} color="#667eea" />
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewBtnTitle}>{t("quizPlay.reviewAnswers")}</Text>
              <Text style={styles.reviewBtnSub}>{t("quizPlay.editBeforeSubmit")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goToResults(userAnswers)}
            style={{ borderRadius: 16, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.showResultGrad}
            >
              <Ionicons name="trophy-outline" size={22} color="#fff" />
              <Text style={styles.showResultText}>{t("quizPlay.showResult")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ════════════════════════════════════════
  // REVIEW SCREEN
  // ════════════════════════════════════════
  if (isReview) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={[styles.reviewBar, { paddingTop: insets.top + 12 }]}
        >
          <TouchableOpacity
            onPress={() => {
              setIsReview(false);
              setIsFinished(true);
            }}
            style={styles.closeBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.reviewBarTitle}>{t("quizPlay.reviewAnswers")}</Text>
            <Text style={styles.reviewBarSub}>{t("quizPlay.tapToChange")}</Text>
          </View>
          <TimerBadge />
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.reviewScroll}
        >
          {allQuestions.map((q: any, qi: number) => {
            const sel = userAnswers[qi];
            return (
              <View key={qi} style={styles.reviewCard}>
                <View style={styles.reviewCardTop}>
                  <View style={styles.qNumBadge}>
                    <Text style={styles.qNumText}>{qi + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{q.category}</Text>
                      </View>
                      <View
                        style={[
                          styles.diffBadge,
                          {
                            backgroundColor:
                              getDifficultyColor(q.difficulty) + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.diffText,
                            { color: getDifficultyColor(q.difficulty) },
                          ]}
                        >
                          {q.difficulty}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {sel === undefined && (
                    <View style={styles.skippedBadge}>
                      <Text style={styles.skippedText}>{t("quizPlay.skipped")}</Text>
                    </View>
                  )}
                </View>

                <FuriganaText
                  text={q.question}
                  style={styles.reviewQText}
                  furiganaStyle={styles.furiganaSmall}
                />

                {q.options.map((opt: string, oi: number) => {
                  const isSel = sel === oi;
                  return (
                    <TouchableOpacity
                      key={oi}
                      onPress={() => handleReviewChange(qi, oi)}
                      style={[
                        styles.optionRow,
                        { marginTop: 10 },
                        isSel ? styles.optionSelected : styles.optionDefault,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.optLabel,
                          isSel ? styles.optLabelSel : styles.optLabelDef,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optLabelTxt,
                            isSel && styles.optLabelTxtSel,
                          ]}
                        >
                          {OPTION_LABELS[oi]}
                        </Text>
                      </View>
                      <FuriganaText
                        text={opt}
                        style={[
                          styles.optText,
                          isSel ? styles.optTextSel : styles.optTextDef,
                        ]}
                        furiganaStyle={styles.furiganaSmall}
                        containerStyle={{ flex: 1 }}
                      />
                      {isSel && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#7c3aed"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}

          <TouchableOpacity
            onPress={() => goToResults(userAnswers)}
            style={{ borderRadius: 16, overflow: "hidden", marginTop: 8 }}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGrad}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.submitText}>{t("quizPlay.submitShowResult")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ════════════════════════════════════════
  // SINGLE QUESTION VIEW
  // ════════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.qCounter}>
              {t("quizPlay.question")} {currentIndex + 1} / {totalQuestions}
            </Text>
          </View>
          {hasTimer ? (
            <TimerBadge />
          ) : (
            <View style={styles.countBadge}>
              <Text style={styles.countTxt}>
                {answeredCount}/{totalQuestions}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / totalQuestions) * 100}%` as any,
              },
            ]}
          />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animatable.View
          key={`q${currentIndex}`}
          animation="fadeInRight"
          duration={260}
          style={styles.qCard}
        >
          <View style={styles.qMeta}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>
                {currentQuestion.category}
              </Text>
            </View>
            <View
              style={[
                styles.diffBadge,
                {
                  backgroundColor:
                    getDifficultyColor(currentQuestion.difficulty) + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.diffText,
                  { color: getDifficultyColor(currentQuestion.difficulty) },
                ]}
              >
                {currentQuestion.difficulty}
              </Text>
            </View>
            {currentQuestion.position != null && (
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>
                  #{currentQuestion.position}
                </Text>
              </View>
            )}
          </View>

          <FuriganaText
            text={currentQuestion.question}
            style={styles.qText}
            furiganaStyle={styles.furiganaMain}
            containerStyle={styles.qTextContainer}
          />

          <View style={{ gap: 10 }}>
            {currentQuestion.options.map((opt: string, oi: number) => {
              const isSel = selectedAnswer === oi;
              const isCorrect = oi === currentQuestion.correctAnswer;
              const showOk = showExplanation && isCorrect;
              const showBad = showExplanation && isSel && !isCorrect;

              const rowStyle = showExplanation
                ? showOk
                  ? styles.optionCorrect
                  : showBad
                    ? styles.optionWrong
                    : styles.optionDefault
                : isSel
                  ? styles.optionSelected
                  : styles.optionDefault;

              const lblStyle = showExplanation
                ? showOk
                  ? styles.optLabelOk
                  : showBad
                    ? styles.optLabelBad
                    : isSel
                      ? styles.optLabelSel
                      : styles.optLabelDef
                : isSel
                  ? styles.optLabelSel
                  : styles.optLabelDef;

              return (
                <TouchableOpacity
                  key={oi}
                  onPress={() => handleSelect(oi)}
                  activeOpacity={0.7}
                  style={[styles.optionRow, rowStyle]}
                >
                  <View style={[styles.optLabel, lblStyle]}>
                    <Text
                      style={[
                        styles.optLabelTxt,
                        (isSel || showOk) && styles.optLabelTxtSel,
                      ]}
                    >
                      {OPTION_LABELS[oi]}
                    </Text>
                  </View>
                  <FuriganaText
                    text={opt}
                    style={[
                      styles.optText,
                      showOk
                        ? styles.optTextOk
                        : showBad
                          ? styles.optTextBad
                          : isSel
                            ? styles.optTextSel
                            : styles.optTextDef,
                    ]}
                    furiganaStyle={
                      showOk
                        ? styles.furiganaOk
                        : showBad
                          ? styles.furiganaBad
                          : styles.furiganaMain
                    }
                    containerStyle={{ flex: 1 }}
                  />
                  {showOk && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#22c55e"
                    />
                  )}
                  {showBad && (
                    <Ionicons name="close-circle" size={18} color="#ef4444" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* EXPLANATION — disabled for now, enable in future
          {isAnswered && !showExplanation && !!currentQuestion.explanation && (
            <TouchableOpacity onPress={() => setShowExplanation(true)} style={styles.explBtn}>
              <Ionicons name="information-circle-outline" size={16} color="#1d4ed8" />
              <Text style={styles.explBtnTxt}>Show Explanation</Text>
            </TouchableOpacity>
          )}

          {showExplanation && (
            <Animatable.View animation="fadeInUp" duration={260} style={styles.explBox}>
              <Ionicons name="information-circle" size={18} color="#3b82f6" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.explLabel}>Explanation</Text>
                <FuriganaText
                  text={currentQuestion.explanation}
                  style={styles.explBody}
                  furiganaStyle={styles.furiganaExpl}
                />
              </View>
            </Animatable.View>
          )}
          */}
        </Animatable.View>
      </ScrollView>

      <View style={[styles.navBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={[
            styles.prevBtn,
            currentIndex === 0 ? styles.prevDisabled : styles.prevEnabled,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentIndex === 0 ? "#9CA3AF" : "#667eea"}
          />
          <Text
            style={[
              styles.prevTxt,
              currentIndex === 0 ? styles.prevTxtDis : styles.prevTxtEn,
            ]}
          >
            {t("quizPlay.previous")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} style={{ flex: 1 }}>
          <LinearGradient
            colors={
              !isAnswered
                ? ["#D1D5DB", "#9CA3AF"]
                : currentIndex === totalQuestions - 1
                  ? ["#10b981", "#059669"]
                  : ["#667eea", "#764ba2"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.nextGrad, { elevation: isAnswered ? 6 : 0 }]}
          >
            <Text style={styles.nextTxt}>
              {currentIndex === totalQuestions - 1
                ? t("quizPlay.finishQuiz")
                : t("quizPlay.nextQuestion")}
            </Text>
            <Ionicons
              name={
                currentIndex === totalQuestions - 1
                  ? "checkmark-circle"
                  : "chevron-forward"
              }
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
  container: { flex: 1, backgroundColor: "#f9fafb" },

  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  closeBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  qCounter: { color: "#fff", fontWeight: "700", fontSize: 15 },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timerTxt: { fontSize: 14, fontWeight: "800" },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.25)",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { backgroundColor: "#fff", height: "100%", borderRadius: 3 },

  scrollContent: { padding: 20, paddingBottom: 24 },
  qCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  qMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  catBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  catBadgeText: { color: "#6d28d9", fontWeight: "700", fontSize: 12 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  diffText: { fontWeight: "700", fontSize: 12 },
  positionBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  positionText: { color: "#6b7280", fontWeight: "700", fontSize: 11 },

  qTextContainer: { marginBottom: 20 },
  qText: { color: "#1f2937", fontSize: 17, fontWeight: "700", lineHeight: 28 },

  furiganaMain: { fontSize: 9, color: "#6b7280", lineHeight: 11 },
  furiganaSmall: { fontSize: 8, color: "#9ca3af", lineHeight: 10 },
  furiganaOk: { fontSize: 9, color: "#15803d", lineHeight: 11 },
  furiganaBad: { fontSize: 9, color: "#dc2626", lineHeight: 11 },
  furiganaExpl: { fontSize: 8, color: "#1d4ed8", lineHeight: 10 },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionDefault: { backgroundColor: "#f9fafb", borderColor: "#e5e7eb" },
  optionSelected: { backgroundColor: "#faf5ff", borderColor: "#7c3aed" },
  optionCorrect: { backgroundColor: "#f0fdf4", borderColor: "#22c55e" },
  optionWrong: { backgroundColor: "#fef2f2", borderColor: "#ef4444" },

  optLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  optLabelDef: { borderColor: "#d1d5db", backgroundColor: "#fff" },
  optLabelSel: { borderColor: "#7c3aed", backgroundColor: "#7c3aed" },
  optLabelOk: { borderColor: "#22c55e", backgroundColor: "#22c55e" },
  optLabelBad: { borderColor: "#ef4444", backgroundColor: "#ef4444" },
  optLabelTxt: { fontSize: 13, fontWeight: "800", color: "#6b7280" },
  optLabelTxtSel: { color: "#fff" },

  optText: { fontSize: 14, fontWeight: "500", lineHeight: 22 },
  optTextDef: { color: "#374151" },
  optTextSel: { color: "#6d28d9" },
  optTextOk: { color: "#15803d" },
  optTextBad: { color: "#dc2626" },

  explBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    backgroundColor: "#dbeafe",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  explBtnTxt: { color: "#1d4ed8", fontWeight: "600", fontSize: 13 },
  explBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  explLabel: {
    color: "#1e40af",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 4,
  },
  explBody: { color: "#1d4ed8", fontSize: 13, lineHeight: 18 },

  navBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    flexDirection: "row",
    gap: 12,
  },
  prevBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  prevDisabled: { backgroundColor: "#f3f4f6" },
  prevEnabled: { backgroundColor: "#ede9fe" },
  prevTxt: { fontWeight: "700", fontSize: 14 },
  prevTxtDis: { color: "#9ca3af" },
  prevTxtEn: { color: "#7c3aed" },
  nextGrad: {
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },

  finishHeader: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  finishTimerRow: { alignSelf: "flex-end", marginBottom: 8 },
  finishEmoji: { fontSize: 52, marginBottom: 12 },
  finishTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 6,
  },
  finishSub: { color: "rgba(255,255,255,0.8)", fontSize: 16 },
  finishBody: { flex: 1, padding: 24, justifyContent: "flex-start", gap: 16 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statBox: { alignItems: "center" },
  statNum: { fontSize: 28, fontWeight: "900", marginBottom: 4 },
  statLabel: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  statDivider: { width: 1, height: 40, backgroundColor: "#f3f4f6" },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: "#ede9fe",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  reviewBtnTitle: { color: "#667eea", fontSize: 16, fontWeight: "700" },
  reviewBtnSub: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  showResultGrad: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  showResultText: { color: "#fff", fontSize: 17, fontWeight: "800" },

  reviewBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  reviewBarTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  reviewBarSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  reviewScroll: { padding: 16, paddingBottom: 32 },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  reviewCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  qNumBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  qNumText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  skippedBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  skippedText: { color: "#dc2626", fontSize: 11, fontWeight: "700" },
  reviewQText: {
    color: "#1f2937",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 24,
    marginBottom: 12,
  },
  submitGrad: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
