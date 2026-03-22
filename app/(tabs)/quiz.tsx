// app/(tabs)/quiz.tsx
import { API_URL } from "@/config/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function QuizScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
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
      if (data.success) setCategories(data.data);
      else Alert.alert("Error", "Failed to load categories");
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Something went wrong");
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
        setQuestionSets(data.data.question_sets);
        const total = data.data.question_sets.reduce(
          (sum: number, set: QuestionSet) => sum + set.questions_count,
          0,
        );
        setTotalQuestionsInCategory(total);
      } else {
        Alert.alert("Error", "Failed to load question sets");
      }
    } catch (error) {
      console.error("Error fetching question sets:", error);
      Alert.alert("Error", "Something went wrong");
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
        router.push({
          pathname: "/quiz/play",
          params: {
            questions: JSON.stringify(data.data),
            total: data.data.length,
          },
        });
      } else {
        Alert.alert("Error", "No questions available");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      Alert.alert("Error", "Failed to load questions");
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
        router.push({
          pathname: "/quiz/play",
          params: {
            questions: JSON.stringify(data.data.questions),
            total: data.data.questions.length,
          },
        });
      } else {
        Alert.alert("Error", "No questions available in this set");
      }
    } catch (error) {
      console.error("Error fetching question set:", error);
      Alert.alert("Error", "Failed to load question set");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Loading screen ───
  if (isLoading && categories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  // ─── Category List ───
  if (!selectedCategory) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* FIX: layout className on LinearGradient → style prop */}
        <LinearGradient
          colors={["#7c3aed", "#a855f7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Text style={styles.gradientLabel}>QUIZ TIME</Text>
          <Text style={styles.gradientTitle}>Choose Category</Text>
          <Text style={styles.gradientSubtitle}>
            Select a category to start your quiz
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
          {/* FIX: gap → marginBottom on each card */}
          <View>
            {categories.map((category) => {
              const icon = category.icon || "help-circle";
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.8}
                  onPress={() => handleCategorySelect(category)}
                  style={styles.categoryCard}
                >
                  {/* FIX: overflow:hidden on TouchableOpacity clips shadow on iOS
                       → move overflow to inner View only around content that needs clipping */}
                  <View style={styles.categoryCardRow}>
                    <View
                      style={[
                        styles.categoryIconBox,
                        { backgroundColor: category.color + "15" },
                      ]}
                    >
                      <Ionicons
                        name={icon as any}
                        size={32}
                        color={category.color}
                      />
                    </View>

                    <View style={styles.flex1}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <View style={styles.categoryMeta}>
                        <Ionicons
                          name="folder-outline"
                          size={16}
                          color="#6b7280"
                        />
                        <Text style={styles.categoryMetaText}>
                          {category.question_sets_count} question sets
                        </Text>
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color="#9ca3af"
                    />
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
  const categoryIcon = selectedCategory.icon || "help-circle";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* FIX: layout className on LinearGradient → style prop */}
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
          <Text style={styles.backButtonText}>Back to Categories</Text>
        </TouchableOpacity>

        {/* FIX: gap → marginRight on icon box */}
        <View style={styles.gradientCategoryRow}>
          <View style={styles.gradientCategoryIcon}>
            <Ionicons name={categoryIcon as any} size={24} color="white" />
          </View>
          <View>
            <Text style={styles.gradientLabel}>CATEGORY</Text>
            <Text style={styles.gradientTitle}>{selectedCategory.name}</Text>
          </View>
        </View>
        <Text style={styles.gradientSubtitle}>
          {questionSets.length} question sets • {totalQuestionsInCategory} total
          questions
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
              { borderColor: selectedCategory.color },
            ]}
          >
            {/* FIX: gap → marginLeft on text block */}
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
                <Text style={styles.fullQuizTitle}>Full Category Quiz</Text>
                <Text style={styles.fullQuizSubtitle}>
                  Random questions from all sets
                </Text>
              </View>
            </View>

            <View style={styles.fullQuizMeta}>
              <Ionicons name="help-circle-outline" size={16} color="#6b7280" />
              <Text style={styles.fullQuizMetaText}>
                {totalQuestionsInCategory} questions available
              </Text>
            </View>

            <View
              style={[
                styles.fullQuizStartButton,
                { backgroundColor: selectedCategory.color },
              ]}
            >
              <Ionicons name="play-circle" size={20} color="white" />
              <Text style={styles.fullQuizStartText}>Start Full Quiz</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Question Sets */}
        <Text style={styles.sectionTitle}>Question Sets</Text>

        {/* FIX: gap → marginBottom on each set card */}
        <View>
          {questionSets.map((set) => (
            <TouchableOpacity
              key={set.id}
              activeOpacity={0.8}
              onPress={() => startQuestionSetQuiz(set.id)}
              style={styles.setCard}
            >
              <View style={styles.setCardInner}>
                <Text style={styles.setName}>{set.name}</Text>
                {set.description && (
                  <Text style={styles.setDesc}>{set.description}</Text>
                )}
                <View style={styles.setMeta}>
                  <Ionicons
                    name="help-circle-outline"
                    size={14}
                    color="#6b7280"
                  />
                  <Text style={styles.setMetaText}>
                    {set.questions_count} questions
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => startQuestionSetQuiz(set.id)}
                  style={[
                    styles.setStartButton,
                    { backgroundColor: selectedCategory.color + "15" },
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
                    Start This Set
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
        {/* FIX: bg-black/50 → rgba; items-center/justify-center → style */}
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Icon + Title */}
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
              <Text style={styles.modalTitle}>How many questions?</Text>
              <Text style={styles.modalSubtitle}>
                Max: {totalQuestionsInCategory} questions available
              </Text>
            </View>

            {/* Stepper */}
            {/* FIX: gap → marginHorizontal on input */}
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

            {/* Quick Select */}
            {/* FIX: gap → marginRight on all but last */}
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
                            ? "#f3f4f6"
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
                              ? "#9ca3af"
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

            {/* Action buttons */}
            {/* FIX: gap → marginBottom on start button */}
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
                <Text style={styles.modalStartText}>Start Quiz</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowQuestionModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  // ── Shared ──
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  flex1: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // ── Loading ──
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

  // ── Gradient header (FIX: was className on LinearGradient) ──
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
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 4,
  },
  gradientSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },

  // ── Back button ──
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

  // ── Category header row (FIX: gap → marginRight) ──
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

  // ── Category list cards (FIX: overflow:hidden clips shadow on iOS) ──
  categoryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  categoryIconBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryName: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
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

  // ── Full quiz card ──
  fullQuizSection: {
    marginBottom: 24,
  },
  fullQuizCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
  // FIX: gap → marginLeft
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

  // ── Section title ──
  sectionTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 16,
  },

  // ── Question set cards ──
  setCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  setCardInner: {
    padding: 16,
  },
  setName: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
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

  // ── Modal ──
  // FIX: bg-black/50 + centering → style prop
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  // FIX: rounded-3xl, w-full, max-w-sm → style prop (max-w not supported, use width)
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

  // ── Stepper (FIX: gap → marginHorizontal on input) ──
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

  // ── Quick select (FIX: gap → marginRight on items) ──
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

  // ── Modal buttons (FIX: gap → marginBottom on start button) ──
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

  // ── Loading overlay ──
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
});
