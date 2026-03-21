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

// const categoryIcons: { [key: string]: string } = {
//   Design: "color-palette",
//   Development: "code-slash",
//   Business: "briefcase",
//   Marketing: "megaphone",
//   Photography: "camera",
//   Music: "musical-notes",
// };

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
  const [refreshing, setRefreshing] = useState(false); // ← Add this
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
        setCategories(data.data);
      } else {
        Alert.alert("Error", "Failed to load categories");
      }
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

        // Calculate total questions in category
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

    if (selectedCategory) {
      // Refresh question sets if category is selected
      await fetchQuestionSets(selectedCategory.id);
    } else {
      // Refresh categories if on category list
      await fetchCategories();
    }

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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            count: numQuestions,
          }),
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

  if (isLoading && categories.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-600 mt-4">Loading categories...</Text>
      </View>
    );
  }

  // Category List View
  if (!selectedCategory) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" />

        <LinearGradient
          colors={["#7c3aed", "#a855f7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-14 pb-6 px-6"
        >
          <View>
            <Text className="text-white/90 text-sm font-semibold mb-1">
              QUIZ TIME
            </Text>
            <Text className="text-white text-3xl font-black mb-2">
              Choose Category
            </Text>
            <Text className="text-white/80 text-sm">
              Select a category to start your quiz
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7c3aed"]} // Android
              tintColor="#7c3aed" // iOS
            />
          }
        >
          <View className="gap-3">
            {categories.map((category) => {
              // const icon = categoryIcons[category.name] || "help-circle";
              const icon = category.icon || "help-circle";

              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.8}
                  onPress={() => handleCategorySelect(category)}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-center p-5">
                    <View
                      className="w-16 h-16 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: category.color + "15" }}
                    >
                      <Ionicons
                        name={icon as any}
                        size={32}
                        color={category.color}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-gray-900 text-lg font-bold mb-1">
                        {category.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="folder-outline"
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="text-gray-600 text-sm ml-1">
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

  // Question Sets View
  // const categoryIcon = categoryIcons[selectedCategory.name] || "help-circle";
  const categoryIcon = selectedCategory.icon || "help-circle";

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[selectedCategory.color, selectedCategory.color + "dd"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-14 pb-6 px-6"
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory(null)}
          className="flex-row items-center mb-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text className="text-white font-semibold text-base ml-2">
            Back to Categories
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center mb-2">
          <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-3">
            <Ionicons name={categoryIcon as any} size={24} color="white" />
          </View>
          <View>
            <Text className="text-white/90 text-sm font-semibold">
              CATEGORY
            </Text>
            <Text className="text-white text-2xl font-black">
              {selectedCategory.name}
            </Text>
          </View>
        </View>
        <Text className="text-white/80 text-sm">
          {questionSets.length} question sets • {totalQuestionsInCategory} total
          questions
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7c3aed"]} // Android
            tintColor="#7c3aed" // iOS
          />
        }
      >
        {/* Full Category Quiz Button */}
        <View className="mb-6">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openFullCategoryModal}
            className="bg-white rounded-2xl p-5 border-2"
            style={{
              borderColor: selectedCategory.color,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View className="flex-row items-center mb-3">
              <View
                className="w-14 h-14 rounded-xl items-center justify-center"
                style={{ backgroundColor: selectedCategory.color + "15" }}
              >
                <Ionicons
                  name="flash"
                  size={28}
                  color={selectedCategory.color}
                />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-bold text-lg mb-1">
                  Full Category Quiz
                </Text>
                <Text className="text-gray-600 text-sm">
                  Random questions from all sets
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons
                  name="help-circle-outline"
                  size={16}
                  color="#6b7280"
                />
                <Text className="text-gray-600 text-sm ml-1">
                  {totalQuestionsInCategory} questions available
                </Text>
              </View>
            </View>
            <View
              className="py-3 rounded-xl flex-row items-center justify-center"
              style={{ backgroundColor: selectedCategory.color }}
            >
              <Ionicons name="play-circle" size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Start Full Quiz
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Question Sets */}
        <Text className="text-gray-900 font-bold text-lg mb-4">
          Question Sets
        </Text>

        <View className="gap-3">
          {questionSets.map((set) => (
            <TouchableOpacity
              key={set.id}
              activeOpacity={0.8}
              onPress={() => startQuestionSetQuiz(set.id)}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="p-4">
                <View className="mb-3">
                  <Text className="text-gray-900 font-bold text-base mb-2">
                    {set.name}
                  </Text>
                  {set.description && (
                    <Text className="text-gray-600 text-sm mb-2">
                      {set.description}
                    </Text>
                  )}
                  <View className="flex-row items-center">
                    <Ionicons
                      name="help-circle-outline"
                      size={14}
                      color="#6b7280"
                    />
                    <Text className="text-gray-600 text-xs ml-1">
                      {set.questions_count} questions
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => startQuestionSetQuiz(set.id)}
                  className="py-2.5 rounded-lg flex-row items-center justify-center"
                  style={{ backgroundColor: selectedCategory.color + "15" }}
                >
                  <Ionicons
                    name="play-circle-outline"
                    size={18}
                    color={selectedCategory.color}
                  />
                  <Text
                    className="font-bold text-sm ml-2"
                    style={{ color: selectedCategory.color }}
                  >
                    Start This Set
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Question Count Modal - Full Category */}
      <Modal
        visible={showQuestionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <View className="items-center mb-6">
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: selectedCategory.color + "15" }}
              >
                <Ionicons
                  name="help-circle"
                  size={32}
                  color={selectedCategory.color}
                />
              </View>
              <Text className="text-gray-900 text-xl font-bold text-center">
                How many questions?
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Max: {totalQuestionsInCategory} questions available
              </Text>
            </View>

            {/* Number Input */}
            <View className="flex-row items-center gap-3 mb-6">
              <TouchableOpacity
                onPress={() => {
                  const num = parseInt(numberOfQuestions) || 0;
                  if (num > 1) setNumberOfQuestions((num - 1).toString());
                }}
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: selectedCategory.color + "15" }}
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
                  if (num <= totalQuestionsInCategory) {
                    setNumberOfQuestions(text);
                  }
                }}
                keyboardType="numeric"
                className="flex-1 text-center text-4xl font-black py-3 rounded-2xl"
                style={{
                  backgroundColor: selectedCategory.color + "10",
                  color: selectedCategory.color,
                }}
                maxLength={3}
              />

              <TouchableOpacity
                onPress={() => {
                  const num = parseInt(numberOfQuestions) || 0;
                  if (num < totalQuestionsInCategory)
                    setNumberOfQuestions((num + 1).toString());
                }}
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: selectedCategory.color + "15" }}
              >
                <Ionicons name="add" size={24} color={selectedCategory.color} />
              </TouchableOpacity>
            </View>

            {/* Quick Select */}
            <View className="flex-row gap-2 mb-6">
              {[5, 10, 15, 20].map((num) => {
                const isDisabled = num > totalQuestionsInCategory;
                const isSelected = numberOfQuestions === num.toString();

                return (
                  <TouchableOpacity
                    key={num}
                    onPress={() =>
                      !isDisabled && setNumberOfQuestions(num.toString())
                    }
                    disabled={isDisabled}
                    className="flex-1 py-2 rounded-xl"
                    style={{
                      backgroundColor: isSelected
                        ? selectedCategory.color
                        : isDisabled
                          ? "#f3f4f6"
                          : selectedCategory.color + "15",
                    }}
                  >
                    <Text
                      className="text-center font-bold text-sm"
                      style={{
                        color: isSelected
                          ? "#fff"
                          : isDisabled
                            ? "#9ca3af"
                            : selectedCategory.color,
                      }}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={startFullCategoryQuiz}
                disabled={isLoading}
                className="py-3.5 rounded-xl"
                style={{
                  backgroundColor: selectedCategory.color,
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base text-center">
                    Start Quiz
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowQuestionModal(false)}
                className="py-3.5 rounded-xl bg-gray-100"
              >
                <Text className="text-gray-700 font-bold text-base text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}
