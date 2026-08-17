// app/(tabs)/quiz.tsx
import AppHeader from "@/components/AppHeader";
import { API_URL } from "@/config/constants";
import { quizStore } from "@/utils/quizStore";
import BookmarkToast from "@/components/BookmarkToast";
import { BookmarkItem, useBookmarks } from "@/hooks/useBookmarks";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Animatable from "react-native-animatable";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
  question_sets_count: number;
}

interface QuestionSet {
  id: number;
  name: string;
  description: string;
  questions_count: number;
}

const CAT_ICONS: Record<string, string> = {
  Design: "color-palette-outline",
  Development: "code-slash-outline",
  Business: "briefcase-outline",
  Marketing: "megaphone-outline",
  Photography: "camera-outline",
  Music: "musical-notes-outline",
};

function getCatIcon(name: string, fallback?: string | null): string {
  return CAT_ICONS[name] ?? fallback ?? "grid-outline";
}

export default function QuizScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const { isBookmarked, toggleBookmark, reload: reloadBookmarks } = useBookmarks();
  const [removeTarget, setRemoveTarget] = useState<BookmarkItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastId, setToastId] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastId((n) => n + 1);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 2000);
  };
  useFocusEffect(useCallback(() => { reloadBookmarks(); }, []));

  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState("10");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalQuestionsInCategory, setTotalQuestionsInCategory] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data); // ← use raw API data directly
      } else Alert.alert(t("common.error"), t("quiz.errorCategories"));
    } catch {
      Alert.alert(t("common.error"), t("quiz.errorSomethingWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestionSets = async (categoryId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/categories/${categoryId}/question-sets`,
      );
      const data = await response.json();
      if (data.success) {
        const sets = data.data.question_sets;
        setQuestionSets(sets);
        const total = sets.reduce(
          (sum: number, set: QuestionSet) => sum + set.questions_count,
          0,
        );
        setTotalQuestionsInCategory(total);
      } else {
        Alert.alert(t("common.error"), t("quiz.errorSets"));
      }
    } catch {
      Alert.alert(t("common.error"), t("quiz.errorSomethingWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedCategory) await fetchQuestionSets(selectedCategory.id);
    else await fetchCategories();
    setRefreshing(false);
  };

  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    await fetchQuestionSets(category.id);
  };

  const openFullCategoryModal = () => {
    const maxQ = totalQuestionsInCategory;
    setNumberOfQuestions(Math.min(10, maxQ).toString());
    setShowQuestionModal(true);
  };

  const startFullCategoryQuiz = async () => {
    if (!selectedCategory) return;
    const numQuestions = parseInt(numberOfQuestions) || 10;
    setShowQuestionModal(false);
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/categories/${selectedCategory.id}/random-questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: numQuestions }),
        },
      );
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        quizStore.setQuestions(data.data);
        router.push({
          pathname: "/quiz/play",
          params: { total: data.data.length },
        });
      } else {
        Alert.alert(t("common.error"), t("quiz.errorNoQuestions"));
      }
    } catch {
      Alert.alert(t("common.error"), t("quiz.errorLoadQuestions"));
    } finally {
      setIsLoading(false);
    }
  };

  const startQuestionSetQuiz = async (setId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/question-set/${setId}`);
      const data = await response.json();
      if (data.success && data.data.questions.length > 0) {
        quizStore.setQuestions(data.data.questions);
        router.push({
          pathname: "/quiz/play",
          params: {
            total: data.data.questions.length,
            timeLimit: data.data.set?.time_limit ?? 0,
          },
        });
      } else {
        Alert.alert(t("common.error"), t("quiz.errorNoQuestionsSet"));
      }
    } catch {
      Alert.alert(t("common.error"), t("quiz.errorLoadSet"));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Loading screen ───
  if (isLoading && categories.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>{t("quiz.loadingCategories")}</Text>
      </View>
    );
  }

  // ─── Category List ───
  if (!selectedCategory) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader
          title="MCQ"
          subtitle={t("quiz.subtitle")}
          searchValue={categorySearch}
          onSearchChange={setCategorySearch}
          searchPlaceholder={t("quiz.searchPlaceholder")}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7c3aed"]}
              tintColor="#7c3aed"
            />
          }
        >
          <View>
            {categories
              .filter((c) =>
                categorySearch.trim().length === 0 ||
                c.name.toLowerCase().includes(categorySearch.toLowerCase()),
              )
              .map((category) => {
              const icon = getCatIcon(category.name, category.icon);
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.8}
                  onPress={() => handleCategorySelect(category)}
                  style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: category.color, borderLeftWidth: 4 }]}
                >
                  <View style={styles.categoryCardRow}>
                    <View
                      style={[
                        styles.categoryIconBox,
                        { backgroundColor: category.color + "18", borderWidth: 2, borderColor: category.color + "40" },
                      ]}
                    >
                      <Ionicons
                        name={icon as any}
                        size={34}
                        color={category.color}
                      />
                    </View>

                    <View style={styles.flex1}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                      <View style={styles.categoryMeta}>
                        <Ionicons
                          name="folder-outline"
                          size={16}
                          color={isDark ? "#64748b" : "#6b7280"}
                        />
                        <Text style={[styles.categoryMetaText, { color: colors.textSecondary }]}>
                          {category.question_sets_count} {t("quiz.questionSets")}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCategorySelect(category);
                      }}
                      style={[
                        styles.categoryStartButton,
                        { backgroundColor: category.color + "15" },
                      ]}
                    >
                      <Ionicons
                        name="play-circle-outline"
                        size={18}
                        color={category.color}
                      />
                      <Text
                        style={[
                          styles.categoryStartText,
                          { color: category.color },
                        ]}
                      >
                        {t("quiz.start")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Question Sets View ───
  const categoryIcon = getCatIcon(selectedCategory.name, selectedCategory.icon);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[selectedCategory.color, selectedCategory.color + "dd"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory(null)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>{t("quiz.backToCategories")}</Text>
        </TouchableOpacity>

        <View style={styles.gradientCategoryRow}>
          <View style={styles.gradientCategoryIcon}>
            <Ionicons name={categoryIcon as any} size={24} color="white" />
          </View>
          <View style={styles.gradientCategoryTextWrap}>
            <Text style={styles.gradientLabel}>{t("quiz.categoryLabel")}</Text>
            <Text style={styles.gradientTitle}>{selectedCategory.name}</Text>
          </View>
        </View>
        <Text style={styles.gradientSubtitle}>
          {questionSets.length} {t("quiz.questionSets")} • {totalQuestionsInCategory} {t("quiz.totalQuestions")}
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7c3aed"]}
            tintColor="#7c3aed"
          />
        }
      >
        {/* Full Category Quiz Card */}
        <View style={styles.fullQuizSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openFullCategoryModal}
            style={[
              styles.fullQuizCard,
              { borderColor: selectedCategory.color, backgroundColor: colors.card },
            ]}
          >
            <View style={styles.fullQuizCardTop}>
              <View
                style={[
                  styles.fullQuizIcon,
                  { backgroundColor: selectedCategory.color + "15" },
                ]}
              >
                <Ionicons
                  name="flash"
                  size={28}
                  color={selectedCategory.color}
                />
              </View>
              <View style={styles.fullQuizText}>
                <Text style={[styles.fullQuizTitle, { color: colors.text }]}>{t("quiz.fullCategoryQuiz")}</Text>
                <Text style={[styles.fullQuizSubtitle, { color: colors.textSecondary }]}>
                  {t("quiz.randomQuestions")}
                </Text>
              </View>
            </View>

            <View style={styles.fullQuizMeta}>
              <Ionicons name="help-circle-outline" size={16} color={isDark ? "#64748b" : "#6b7280"} />
              <Text style={[styles.fullQuizMetaText, { color: colors.textSecondary }]}>
                {totalQuestionsInCategory} {t("quiz.questionsAvailable")}
              </Text>
            </View>

            <View
              style={[
                styles.fullQuizStartButton,
                { backgroundColor: selectedCategory.color },
              ]}
            >
              <Ionicons name="play-circle" size={20} color="white" />
              <Text style={styles.fullQuizStartText}>{t("quiz.startFullQuiz")}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Question Sets */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("quiz.questionSetsSection")}</Text>

        <View>
          {questionSets.map((set) => (
            <View key={set.id} style={[styles.setCard, { backgroundColor: colors.card, borderColor: colors.border, borderTopColor: selectedCategory.color, borderTopWidth: 3 }]}>
              <View style={styles.setCardInner}>
                <Text style={[styles.setName, { color: colors.text }]}>{set.name}</Text>
                {set.description && (
                  <Text style={[styles.setDesc, { color: colors.textSecondary }]}>{set.description}</Text>
                )}
                <View style={styles.setMeta}>
                  <Ionicons
                    name="help-circle-outline"
                    size={14}
                    color={isDark ? "#64748b" : "#6b7280"}
                  />
                  <Text style={[styles.setMetaText, { color: colors.textSecondary }]}>
                    {set.questions_count} questions
                  </Text>
                </View>

                <View style={styles.setCardActions}>
                  <TouchableOpacity
                    onPress={() => startQuestionSetQuiz(set.id)}
                    style={[
                      styles.setStartButton,
                      {
                        flex: 1,
                        marginRight: 8,
                        backgroundColor: selectedCategory.color + "15",
                      },
                    ]}
                  >
                    <Ionicons
                      name="play-circle-outline"
                      size={18}
                      color={selectedCategory.color}
                    />
                    <Text
                      style={[
                        styles.setStartText,
                        { color: selectedCategory.color },
                      ]}
                    >
                      {t("quiz.startThisSet")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const item: BookmarkItem = {
                        type: "quiz",
                        id: String(set.id),
                        title: set.name,
                        subtitle: selectedCategory.name,
                        meta: `${set.questions_count} questions`,
                        data: { ...set, categoryId: selectedCategory.id, categoryName: selectedCategory.name, categoryColor: selectedCategory.color },
                        savedAt: Date.now(),
                      };
                      if (isBookmarked("quiz", set.id)) {
                        setRemoveTarget(item);
                      } else {
                        toggleBookmark(item);
                        triggerToast();
                      }
                    }}
                    style={[
                      styles.setBookmarkBtn,
                      {
                        backgroundColor: isBookmarked("quiz", set.id)
                          ? "#ef4444"
                          : "#f3f4f6",
                      },
                    ]}
                  >
                    <Ionicons
                      name={isBookmarked("quiz", set.id) ? "bookmark" : "bookmark-outline"}
                      size={18}
                      color={isBookmarked("quiz", set.id) ? "#fff" : "#667eea"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ─── Question Count Modal ─── */}
      <Modal
        visible={showQuestionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIcon,
                  { backgroundColor: selectedCategory.color + "15" },
                ]}
              >
                <Ionicons
                  name="help-circle"
                  size={32}
                  color={selectedCategory.color}
                />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("quiz.howManyQuestions")}</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {t("quiz.max")} {totalQuestionsInCategory} {t("quiz.questionsAvailable")}
              </Text>
            </View>

            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => {
                  const num = parseInt(numberOfQuestions) || 0;
                  if (num > 1) setNumberOfQuestions((num - 1).toString());
                }}
                style={[
                  styles.stepperButton,
                  { backgroundColor: selectedCategory.color + "15" },
                ]}
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={selectedCategory.color}
                />
              </TouchableOpacity>

              <TextInput
                value={numberOfQuestions}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  if (num <= totalQuestionsInCategory)
                    setNumberOfQuestions(text);
                }}
                keyboardType="numeric"
                style={[
                  styles.stepperInput,
                  {
                    backgroundColor: selectedCategory.color + "10",
                    color: selectedCategory.color,
                  },
                ]}
                maxLength={3}
              />

              <TouchableOpacity
                onPress={() => {
                  const num = parseInt(numberOfQuestions) || 0;
                  if (num < totalQuestionsInCategory)
                    setNumberOfQuestions((num + 1).toString());
                }}
                style={[
                  styles.stepperButton,
                  { backgroundColor: selectedCategory.color + "15" },
                ]}
              >
                <Ionicons name="add" size={24} color={selectedCategory.color} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickSelect}>
              {[5, 10, 15, 20].map((num, index) => {
                const isDisabled = num > totalQuestionsInCategory;
                const isSelected = numberOfQuestions === num.toString();
                return (
                  <TouchableOpacity
                    key={num}
                    onPress={() =>
                      !isDisabled && setNumberOfQuestions(num.toString())
                    }
                    disabled={isDisabled}
                    style={[
                      styles.quickSelectItem,
                      index < 3 && styles.quickSelectItemMR,
                      {
                        backgroundColor: isSelected
                          ? selectedCategory.color
                          : isDisabled
                            ? (isDark ? "#1e1e30" : "#f3f4f6")
                            : selectedCategory.color + "15",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickSelectText,
                        {
                          color: isSelected
                            ? "#fff"
                            : isDisabled
                              ? (isDark ? "#4b5563" : "#9ca3af")
                              : selectedCategory.color,
                        },
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={startFullCategoryQuiz}
              disabled={isLoading}
              style={[
                styles.modalStartButton,
                {
                  backgroundColor: selectedCategory.color,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalStartText}>{t("quiz.startQuiz")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowQuestionModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>{t("quiz.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BookmarkToast key={toastId} visible={showToast} />

      {/* ─── Remove Bookmark Modal ─── */}
      <Modal
        visible={!!removeTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setRemoveTarget(null)}
      >
        <View style={styles.removeModalOverlay}>
          <TouchableOpacity
            style={styles.removeModalBackdrop}
            activeOpacity={1}
            onPress={() => setRemoveTarget(null)}
          />
          <Animatable.View
            animation="slideInUp"
            duration={280}
            style={[styles.removeModalSheet, { backgroundColor: colors.card }]}
          >
            <View style={styles.removeModalHandle} />
            <View style={styles.removeModalIconWrap}>
              <Ionicons name="bookmark" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.removeModalTitle, { color: colors.text }]}>
              Remove Bookmark
            </Text>
            <Text
              style={[styles.removeModalItemName, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              "{removeTarget?.title}"
            </Text>
            <Text style={[styles.removeModalDesc, { color: colors.textSecondary }]}>
              This item will be removed from your saved bookmarks. You can bookmark it again at any time.
            </Text>
            <TouchableOpacity
              onPress={async () => {
                if (removeTarget) {
                  await toggleBookmark(removeTarget);
                  setRemoveTarget(null);
                }
              }}
              style={styles.removeBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.removeBtnText}>Remove Bookmark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRemoveTarget(null)}
              style={[styles.keepBtn, { backgroundColor: isDark ? "#1e1e30" : "#f3f4f6" }]}
            >
              <Text style={[styles.keepBtnText, { color: colors.textSecondary }]}>Keep it</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  // ... (keep all existing styles) ...
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  flex1: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#4b5563",
    marginTop: 16,
    fontSize: 16,
  },
  gradientHeader: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  gradientLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1,
  },
  gradientTitle: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "900",
    marginBottom: 4,
    flexShrink: 1,
  },
  gradientSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  gradientCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  gradientCategoryIcon: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  gradientCategoryTextWrap: {
    flex: 1,
  },
  categoryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  categoryCardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  categoryIconBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryName: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  categoryMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryMetaText: {
    color: "#4b5563",
    fontSize: 14,
    marginLeft: 4,
  },
  fullQuizSection: {
    marginBottom: 24,
  },
  fullQuizCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 7,
  },
  fullQuizCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fullQuizIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fullQuizText: {
    flex: 1,
    marginLeft: 12,
  },
  fullQuizTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 4,
  },
  fullQuizSubtitle: {
    color: "#4b5563",
    fontSize: 14,
  },
  fullQuizMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fullQuizMetaText: {
    color: "#4b5563",
    fontSize: 14,
    marginLeft: 4,
  },
  fullQuizStartButton: {
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullQuizStartText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 16,
  },
  setCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  setCardInner: {
    padding: 16,
  },

  // ── NEW: Price Badges ──
  freeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  priceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },

  setName: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  setDesc: {
    color: "#4b5563",
    fontSize: 14,
    marginBottom: 8,
  },
  setMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  setMetaText: {
    color: "#4b5563",
    fontSize: 12,
    marginLeft: 4,
  },
  setCardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  setStartButton: {
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  setStartText: {
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 8,
  },
  setBookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Question Modal (existing) ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSubtitle: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 36,
    fontWeight: "900",
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 12,
  },
  quickSelect: {
    flexDirection: "row",
    marginBottom: 24,
  },
  quickSelectItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickSelectItemMR: {
    marginRight: 8,
  },
  quickSelectText: {
    fontWeight: "700",
    fontSize: 14,
  },
  modalStartButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalStartText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalCancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 16,
  },

  // ── Payment / Coming Soon Modal ──
  paymentModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  paymentModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  paymentModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  paymentHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  paymentHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  paymentCloseBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#f3f4f6",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentSetInfo: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  paymentSetName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  paymentPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentPriceLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  paymentPriceValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#7c3aed",
  },
  comingSoonBody: {
    padding: 28,
    alignItems: "center",
  },
  comingSoonIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  comingSoonSubtitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7c3aed",
    textAlign: "center",
    marginBottom: 12,
  },
  comingSoonMsg: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  comingSoonPlayBtn: {
    backgroundColor: "#7c3aed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    gap: 8,
    marginBottom: 12,
  },
  comingSoonPlayText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  comingSoonCancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  comingSoonCancelText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  categoryPriceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  categoryPriceText: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },

  categoryFreeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  categoryFreeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  categoryStartButton: {
    marginTop: 12,
    transform: [{ translateY: 18 }],
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryStartText: {
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 8,
  },

  categoryCountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  categoryFreeCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  categoryPaidCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#7c3aed",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  loginModalSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  loginModalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  loginModalMsg: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  loginModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    gap: 8,
    marginBottom: 10,
  },
  loginModalBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginModalCancel: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  loginModalCancelText: {
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "500",
  },

  // ── Remove Bookmark Modal ──
  removeModalOverlay: { flex: 1, justifyContent: "flex-end" },
  removeModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  removeModalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: "center",
  },
  removeModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    marginBottom: 24,
  },
  removeModalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  removeModalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6, textAlign: "center" },
  removeModalItemName: { fontSize: 14, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
  removeModalDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 28 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    gap: 8,
    marginBottom: 10,
  },
  removeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  keepBtn: { paddingVertical: 14, borderRadius: 14, width: "100%", alignItems: "center" },
  keepBtnText: { fontSize: 16, fontWeight: "600" },
});
