// app/quiz/play.tsx
import FuriganaText from "@/components/FuriganaText";
import ParagraphContent from "@/components/ParagraphContent";
import QuizImage from "@/components/QuizImage";
import { quizStore, type QuizAccessSummary } from "@/utils/quizStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const OPTION_LABELS = ["A", "B", "C", "D"];

const getDifficultyColor = (d: string) => {
  if (d === "Easy") return "#10b981";
  if (d === "Medium") return "#f59e0b";
  if (d === "Hard") return "#ef4444";
  return "#6b7280";
};

// Moved outside QuizPlay — prevents new component type on every render
const TimerBadge = React.memo(
  ({ hasTimer, timeLeft, timeLimitSeconds }: { hasTimer: boolean; timeLeft: number; timeLimitSeconds: number }) => {
    if (!hasTimer) return null;
    const p = timeLeft / timeLimitSeconds;
    const tc = p > 0.5 ? "#10b981" : p > 0.25 ? "#f59e0b" : "#ef4444";
    const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const ss = (timeLeft % 60).toString().padStart(2, "0");
    return (
      <View style={[styles.timerBadge, { borderColor: tc, backgroundColor: tc + "25" }]}>
        <Ionicons name="time-outline" size={13} color={tc} />
        <Text style={[styles.timerTxt, { color: tc }]}>{`${mm}:${ss}`}</Text>
      </View>
    );
  },
);

// Builds the "how much access is left" pill content (attempts / days / hours /
// minutes). Returns null for free content, unlimited/legacy purchases - nothing
// worth showing.
function accessChipContent(
  a: QuizAccessSummary | null,
  t: (k: string, o?: any) => string,
): { icon: string; label: string } | null {
  if (!a) return null;
  switch (a.kind) {
    case "attempts":
    case "trial_attempts":
      if (typeof a.attempts_total === "number" && a.attempts_total > 0) {
        return {
          icon: "ticket-outline",
          label: t("quizPlay.attemptOf", {
            current: (a.attempts_used ?? 0) + 1,
            total: a.attempts_total,
          }),
        };
      }
      return {
        icon: "ticket-outline",
        label: t("quizPlay.attemptsLeft", { count: a.attempts_remaining ?? 0 }),
      };
    case "wallet":
      return {
        icon: "wallet-outline",
        label: t("quizPlay.attemptsLeft", { count: a.attempts_remaining ?? 0 }),
      };
    case "days":
    case "trial_days": {
      const d = a.days_remaining ?? 0;
      return {
        icon: "calendar-outline",
        label: d <= 0 ? t("quizPlay.expiresToday") : t("quizPlay.daysLeft", { count: d }),
      };
    }
    case "hours": {
      const h = a.hours_remaining ?? 0;
      return {
        icon: "time-outline",
        label: h <= 0 ? t("quizPlay.expiresSoon") : t("quizPlay.hoursLeft", { count: h }),
      };
    }
    case "minutes": {
      const m = a.minutes_remaining ?? 0;
      return {
        icon: "time-outline",
        label: m <= 0 ? t("quizPlay.expiresSoon") : t("quizPlay.minutesLeft", { count: m }),
      };
    }
    case "subscription":
      return { icon: "infinite-outline", label: t("quizPlay.accessSubscription") };
    default:
      return null;
  }
}

const AccessChip = React.memo(
  ({ info }: { info: { icon: string; label: string } | null }) => {
    if (!info) return null;
    return (
      <View style={styles.accessChip}>
        <Ionicons name={info.icon as any} size={12} color="#fff" />
        <Text style={styles.accessChipTxt}>{info.label}</Text>
      </View>
    );
  },
);
AccessChip.displayName = "AccessChip";

// Pulls questions of the same reading paragraph together (at the first one's spot) and
// splits the list into pages: one page per paragraph, one page per other question.
// Scoring is unchanged — every question is still scored on its own.
function groupByParagraph(sorted: any[]): { allQuestions: any[]; pages: number[][] } {
  const groups: any[][] = [];
  const byParagraph = new Map<number, any[]>();
  for (const q of sorted) {
    const pid = q.paragraph?.id;
    if (pid == null) {
      groups.push([q]);
    } else if (byParagraph.has(pid)) {
      byParagraph.get(pid)!.push(q);
    } else {
      const group = [q];
      byParagraph.set(pid, group);
      groups.push(group);
    }
  }
  const allQuestions: any[] = [];
  const pages: number[][] = [];
  for (const group of groups) {
    // Paragraph questions keep the order they were written in (creation order).
    if (group.length > 1) group.sort((a, b) => a.id - b.id);
    pages.push(group.map((_, i) => allQuestions.length + i));
    allQuestions.push(...group);
  }
  return { allQuestions, pages };
}

const ParagraphCard = React.memo(
  ({ paragraph, label, style }: { paragraph: any; label: string; style?: any }) => (
    <View style={[styles.paragraphCard, style]}>
      <View style={styles.paragraphLabelRow}>
        <Ionicons name="document-text-outline" size={14} color="#7c3aed" />
        <Text style={styles.paragraphLabel}>{label}</Text>
      </View>
      {!!paragraph.title && (
        <FuriganaText
          text={paragraph.title}
          style={styles.paragraphTitle}
          furiganaStyle={styles.furiganaMain}
        />
      )}
      <ParagraphContent
        content={paragraph.content}
        style={styles.paragraphText}
        furiganaStyle={styles.furiganaMain}
      />
      <QuizImage uri={paragraph.image} style={{ marginTop: 12 }} />
    </View>
  ),
);
ParagraphCard.displayName = "ParagraphCard";

// Answer option content: text, image, or both (either may be missing).
const OptionBody = ({
  text,
  image,
  textStyle,
  furiganaStyle,
}: {
  text: string;
  image?: string | null;
  textStyle: any;
  furiganaStyle: any;
}) => (
  <View style={styles.optBody}>
    {!!text && (
      <FuriganaText text={text} style={textStyle} furiganaStyle={furiganaStyle} />
    )}
    <QuizImage uri={image} maxHeight={160} />
  </View>
);

export default function QuizPlay() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const access = useMemo(() => quizStore.getAccess(), []);
  const accessInfo = useMemo(() => accessChipContent(access, t), [access, t]);

  // Read from store — no JSON.parse cost.
  // Questions that share a reading paragraph are pulled together (at the first one's
  // spot) and shown on one page; every other question is a page of its own.
  const { allQuestions, pages } = useMemo<{ allQuestions: any[] | null; pages: number[][] }>(() => {
    const raw = quizStore.getQuestions();
    if (!raw || raw.length === 0) return { allQuestions: null, pages: [] };
    const sorted = [...raw].sort((a: any, b: any) => {
      const posA = a.position ?? Number.MAX_SAFE_INTEGER;
      const posB = b.position ?? Number.MAX_SAFE_INTEGER;
      if (posA !== posB) return posA - posB;
      return b.id - a.id;
    });
    return groupByParagraph(sorted);
  }, []);

  const totalQuestions = allQuestions?.length ?? 0;
  const totalPages = pages.length;
  const timeLimitMinutes = parseInt(params.timeLimit as string) || 0;
  const timeLimitSeconds = timeLimitMinutes * 60;
  const hasTimer = timeLimitSeconds > 0;

  // ── All state / refs before any early return ──
  const [currentPage, setCurrentPage] = useState(0);
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

  useEffect(() => {
    if (allQuestions === null) router.back();
  }, []);

  // ── Stable callbacks — before early return (hooks rule) ──
  const goToResults = useCallback((answers: (number | undefined)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const qs = allQuestions!;
    const score = qs.reduce(
      (s: number, q: any, i: number) => (answers[i] === q.correctAnswer ? s + 1 : s),
      0,
    );
    // Results screen reads answers by index — store questions in the same (grouped) order.
    quizStore.setQuestions(qs);
    quizStore.setAnswers(answers.map((a) => (a === undefined ? -1 : (a as number))));

    const startedAt = quizStore.getStartedAt();
    const timeTakenSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined;
    const questionSetId = quizStore.getQuestionSetId();
    const categoryId = quizStore.getCategoryId();

    router.replace({
      pathname: "/quiz/results",
      params: {
        score,
        total: qs.length,
        ...(timeTakenSeconds !== undefined ? { timeTakenSeconds } : {}),
        ...(questionSetId !== null ? { questionSetId } : {}),
        ...(categoryId !== null ? { categoryId } : {}),
      },
    });
  }, [allQuestions]);

  const handleSelect = useCallback((qIdx: number, optIdx: number) => {
    setUserAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
    setShowExplanation(false);
  }, []);

  const handleReviewChange = useCallback((qIdx: number, optIdx: number) => {
    setUserAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    setShowExplanation(false);
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
    else setIsFinished(true);
  }, [currentPage, totalPages]);

  const handlePrev = useCallback(() => {
    setShowExplanation(false);
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  }, [currentPage]);

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hasTimer, goToResults]);

  // ── Guard after all hooks ──
  if (allQuestions === null) return null;

  const pageIndexes = pages[currentPage];
  const firstIndex = pageIndexes[0];
  const lastIndex = pageIndexes[pageIndexes.length - 1];
  const pageParagraph = allQuestions[firstIndex].paragraph;
  const isLastPage = currentPage === totalPages - 1;
  const isAnswered = pageIndexes.every((qi) => userAnswers[qi] !== undefined);
  const answeredCount = userAnswers.filter((a) => a !== undefined).length;

  const p = hasTimer ? timeLeft / timeLimitSeconds : 1;
  const tc = p > 0.5 ? "#10b981" : p > 0.25 ? "#f59e0b" : "#ef4444";

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
          {(hasTimer || accessInfo) && (
            <View style={styles.finishTimerRow}>
              {accessInfo && <AccessChip info={accessInfo} />}
              <TimerBadge hasTimer={hasTimer} timeLeft={timeLeft} timeLimitSeconds={timeLimitSeconds} />
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
              <Text style={[styles.statNum, { color: "#667eea" }]}>{answeredCount}</Text>
              <Text style={styles.statLabel}>{t("quizPlay.answered")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: "#ef4444" }]}>{skipped}</Text>
              <Text style={styles.statLabel}>{t("quizPlay.skipped")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: "#f59e0b" }]}>{totalQuestions}</Text>
              <Text style={styles.statLabel}>{t("quizPlay.total")}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => { setIsFinished(false); setIsReview(true); }}
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
            onPress={() => { setIsReview(false); setIsFinished(true); }}
            style={styles.closeBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.reviewBarTitle}>{t("quizPlay.reviewAnswers")}</Text>
            <Text style={styles.reviewBarSub}>{t("quizPlay.tapToChange")}</Text>
          </View>
          <TimerBadge hasTimer={hasTimer} timeLeft={timeLeft} timeLimitSeconds={timeLimitSeconds} />
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.reviewScroll}
          removeClippedSubviews
        >
          {allQuestions.map((q: any, qi: number) => {
            const sel = userAnswers[qi];
            const startsParagraph =
              !!q.paragraph && allQuestions[qi - 1]?.paragraph?.id !== q.paragraph.id;
            return (
              <React.Fragment key={qi}>
              {startsParagraph && (
                <ParagraphCard paragraph={q.paragraph} label={t("quizPlay.paragraph")} style={{ marginBottom: 16 }} />
              )}
              <View style={styles.reviewCard}>
                <View style={styles.reviewCardTop}>
                  <View style={styles.qNumBadge}>
                    <Text style={styles.qNumText}>{qi + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{q.category}</Text>
                      </View>
                      <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(q.difficulty) + "20" }]}>
                        <Text style={[styles.diffText, { color: getDifficultyColor(q.difficulty) }]}>
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
                <QuizImage uri={q.image} maxHeight={200} style={{ marginBottom: 4 }} />

                {q.options.map((opt: string, oi: number) => {
                  const isSel = sel === oi;
                  return (
                    <TouchableOpacity
                      key={oi}
                      onPress={() => handleReviewChange(qi, oi)}
                      style={[styles.optionRow, { marginTop: 10 }, isSel ? styles.optionSelected : styles.optionDefault]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.optLabel, isSel ? styles.optLabelSel : styles.optLabelDef]}>
                        <Text style={[styles.optLabelTxt, isSel && styles.optLabelTxtSel]}>
                          {OPTION_LABELS[oi]}
                        </Text>
                      </View>
                      <OptionBody
                        text={opt}
                        image={q.optionImages?.[oi]}
                        textStyle={[styles.optText, isSel ? styles.optTextSel : styles.optTextDef]}
                        furiganaStyle={styles.furiganaSmall}
                      />
                      {isSel && <Ionicons name="checkmark-circle" size={18} color="#7c3aed" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              </React.Fragment>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.qCounter}>
              {firstIndex === lastIndex
                ? `${t("quizPlay.question")} ${firstIndex + 1} / ${totalQuestions}`
                : `${t("quizPlay.questions")} ${firstIndex + 1}–${lastIndex + 1} / ${totalQuestions}`}
            </Text>
          </View>
          {hasTimer ? (
            <TimerBadge hasTimer={hasTimer} timeLeft={timeLeft} timeLimitSeconds={timeLimitSeconds} />
          ) : (
            <View style={styles.countBadge}>
              <Text style={styles.countTxt}>{answeredCount}/{totalQuestions}</Text>
            </View>
          )}
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((lastIndex + 1) / totalQuestions) * 100}%` as any },
            ]}
          />
        </View>
        {accessInfo && (
          <View style={styles.accessRow}>
            <AccessChip info={accessInfo} />
          </View>
        )}
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animatable.View
          key={`p${currentPage}`}
          animation="fadeInRight"
          duration={220}
          useNativeDriver
          style={{ gap: 16 }}
        >
          {pageParagraph && <ParagraphCard paragraph={pageParagraph} label={t("quizPlay.paragraph")} />}

          {pageIndexes.map((qi) => {
            const q = allQuestions[qi];
            const selectedAnswer = userAnswers[qi];
            return (
              <View key={qi} style={styles.qCard}>
                <View style={styles.qMeta}>
                  {pageParagraph && (
                    <View style={styles.qNumBadge}>
                      <Text style={styles.qNumText}>{qi + 1}</Text>
                    </View>
                  )}
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeText}>{q.category}</Text>
                  </View>
                  <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(q.difficulty) + "20" }]}>
                    <Text style={[styles.diffText, { color: getDifficultyColor(q.difficulty) }]}>
                      {q.difficulty}
                    </Text>
                  </View>
                  {q.position != null && (
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionText}>#{q.position}</Text>
                    </View>
                  )}
                </View>

                <FuriganaText
                  text={q.question}
                  style={styles.qText}
                  furiganaStyle={styles.furiganaMain}
                  containerStyle={q.image ? styles.qTextContainerImg : styles.qTextContainer}
                />
                <QuizImage uri={q.image} style={styles.qTextContainer} />

                <View style={{ gap: 10 }}>
                  {q.options.map((opt: string, oi: number) => {
                    const isSel = selectedAnswer === oi;
                    const isCorrect = oi === q.correctAnswer;
                    const showOk = showExplanation && isCorrect;
                    const showBad = showExplanation && isSel && !isCorrect;

                    const rowStyle = showExplanation
                      ? showOk ? styles.optionCorrect : showBad ? styles.optionWrong : styles.optionDefault
                      : isSel ? styles.optionSelected : styles.optionDefault;

                    const lblStyle = showExplanation
                      ? showOk ? styles.optLabelOk : showBad ? styles.optLabelBad : isSel ? styles.optLabelSel : styles.optLabelDef
                      : isSel ? styles.optLabelSel : styles.optLabelDef;

                    return (
                      <TouchableOpacity
                        key={oi}
                        onPress={() => handleSelect(qi, oi)}
                        activeOpacity={0.7}
                        style={[styles.optionRow, rowStyle]}
                      >
                        <View style={[styles.optLabel, lblStyle]}>
                          <Text style={[styles.optLabelTxt, (isSel || showOk) && styles.optLabelTxtSel]}>
                            {OPTION_LABELS[oi]}
                          </Text>
                        </View>
                        <OptionBody
                          text={opt}
                          image={q.optionImages?.[oi]}
                          textStyle={[
                            styles.optText,
                            showOk ? styles.optTextOk : showBad ? styles.optTextBad : isSel ? styles.optTextSel : styles.optTextDef,
                          ]}
                          furiganaStyle={showOk ? styles.furiganaOk : showBad ? styles.furiganaBad : styles.furiganaMain}
                        />
                        {showOk && <Ionicons name="checkmark-circle" size={18} color="#22c55e" />}
                        {showBad && <Ionicons name="close-circle" size={18} color="#ef4444" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* EXPLANATION — disabled for now, enable in future
                {selectedAnswer !== undefined && !showExplanation && !!q.explanation && (
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
                        text={q.explanation}
                        style={styles.explBody}
                        furiganaStyle={styles.furiganaExpl}
                      />
                    </View>
                  </Animatable.View>
                )}
                */}
              </View>
            );
          })}
        </Animatable.View>
      </ScrollView>

      <View style={[styles.navBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentPage === 0}
          style={[styles.prevBtn, currentPage === 0 ? styles.prevDisabled : styles.prevEnabled]}
        >
          <Ionicons name="chevron-back" size={20} color={currentPage === 0 ? "#9CA3AF" : "#667eea"} />
          <Text style={[styles.prevTxt, currentPage === 0 ? styles.prevTxtDis : styles.prevTxtEn]}>
            {t("quizPlay.previous")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} style={{ flex: 1 }}>
          <LinearGradient
            colors={
              !isAnswered
                ? ["#D1D5DB", "#9CA3AF"]
                : isLastPage
                  ? ["#10b981", "#059669"]
                  : ["#667eea", "#764ba2"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.nextGrad, { elevation: isAnswered ? 6 : 0 }]}
          >
            <Text style={styles.nextTxt}>
              {isLastPage ? t("quizPlay.finishQuiz") : t("quizPlay.nextQuestion")}
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
  qTextContainerImg: { marginBottom: 12 },

  paragraphCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#7c3aed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  paragraphLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  paragraphLabel: { color: "#7c3aed", fontWeight: "800", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  paragraphTitle: { color: "#1f2937", fontSize: 16, fontWeight: "800", lineHeight: 24, marginBottom: 8 },
  paragraphText: { color: "#374151", fontSize: 15, lineHeight: 26 },

  optBody: { flex: 1, gap: 8 },
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
  explLabel: { color: "#1e40af", fontWeight: "700", fontSize: 12, marginBottom: 4 },
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
  finishTimerRow: {
    alignSelf: "flex-end",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  accessRow: { alignItems: "center", marginTop: 10 },
  accessChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  accessChipTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  finishEmoji: { fontSize: 52, marginBottom: 12 },
  finishTitle: { color: "#fff", fontSize: 26, fontWeight: "900", marginBottom: 6 },
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
  reviewCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
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
