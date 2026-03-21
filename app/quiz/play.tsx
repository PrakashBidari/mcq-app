// app/quiz/play.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const QUESTIONS_PER_PAGE = 10;

export default function QuizPlay() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const allQuestions = JSON.parse(params.questions as string);
  const totalQuestions = parseInt(params.total as string);

  const [currentPage, setCurrentPage] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExplanations, setShowExplanations] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);

  // Calculate pagination
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

    // Update score
    if (!wasCorrect && isCorrect) {
      setScore(score + 1);
    } else if (wasCorrect && !isCorrect) {
      setScore(score - 1);
    }

    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const toggleExplanation = (index: number) => {
    const newShowExplanations = [...showExplanations];
    newShowExplanations[index] = !newShowExplanations[index];
    setShowExplanations(newShowExplanations);
  };

  const handleNextPage = () => {
    if (isLastPage) {
      // Calculate final score
      let finalScore = 0;
      allQuestions.forEach((question: any, index: number) => {
        if (userAnswers[index] === question.correctAnswer) {
          finalScore++;
        }
      });

      // Navigate to results
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
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

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

  // Check if all questions on current page are answered
  const allPageQuestionsAnswered = currentPageQuestions.every(
    (_: any, idx: number) => userAnswers[startIndex + idx] !== undefined,
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" />

      {/* Header with Progress */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-6"
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white/20 w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <View className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white font-bold text-sm">
                {startIndex + 1}-{endIndex}/{totalQuestions}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white font-bold text-sm">
                Score: {score}
              </Text>
            </View>
          </View>
        </View>

        {/* Overall Progress Bar */}
        <View className="bg-white/20 h-2 rounded-full overflow-hidden mb-2">
          <View
            className="bg-white h-full rounded-full"
            style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
          />
        </View>

        {/* Page Indicator */}
        <Text className="text-white/80 text-xs text-center">
          Page {currentPage + 1} of {totalPages}
        </Text>
      </LinearGradient>

      {/* Questions List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {currentPageQuestions.map((question: any, pageIndex: number) => {
          const globalIndex = startIndex + pageIndex;
          const selectedAnswer = userAnswers[globalIndex];
          const showExplanation = showExplanations[globalIndex];

          return (
            <Animatable.View
              key={globalIndex}
              animation="fadeInUp"
              delay={pageIndex * 50}
              className="mb-6"
            >
              <View
                className="bg-white rounded-3xl p-5"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                {/* Question Number and Tags */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-purple-600 w-8 h-8 rounded-full items-center justify-center">
                      <Text className="text-white font-bold text-sm">
                        {globalIndex + 1}
                      </Text>
                    </View>
                    <View className="bg-purple-100 px-3 py-1 rounded-full">
                      <Text className="text-purple-700 font-bold text-xs">
                        {question.category}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        getDifficultyColor(question.difficulty) + "20",
                    }}
                  >
                    <Text
                      className="font-bold text-xs"
                      style={{
                        color: getDifficultyColor(question.difficulty),
                      }}
                    >
                      {question.difficulty}
                    </Text>
                  </View>
                </View>

                {/* Question Text */}
                <Text className="text-gray-800 text-base font-bold leading-6 mb-4">
                  {question.question}
                </Text>

                {/* Options */}
                <View className="gap-2">
                  {question.options.map(
                    (option: string, optionIndex: number) => {
                      const isSelected = selectedAnswer === optionIndex;
                      const isCorrect = optionIndex === question.correctAnswer;
                      const showCorrect = showExplanation && isCorrect;
                      const showWrong =
                        showExplanation && isSelected && !isCorrect;

                      return (
                        <TouchableOpacity
                          key={optionIndex}
                          onPress={() =>
                            !showExplanation &&
                            handleSelectAnswer(globalIndex, optionIndex)
                          }
                          disabled={showExplanation}
                          activeOpacity={0.7}
                        >
                          <View
                            className={`flex-row items-center p-3 rounded-xl ${
                              showCorrect
                                ? "bg-green-50 border-2 border-green-500"
                                : showWrong
                                  ? "bg-red-50 border-2 border-red-500"
                                  : isSelected
                                    ? "bg-purple-50 border-2 border-purple-500"
                                    : "bg-gray-50 border border-gray-200"
                            }`}
                          >
                            {/* Radio/Check Icon */}
                            <View
                              className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                                showCorrect
                                  ? "border-green-500 bg-green-500"
                                  : showWrong
                                    ? "border-red-500 bg-red-500"
                                    : isSelected
                                      ? "border-purple-500 bg-purple-500"
                                      : "border-gray-300"
                              }`}
                            >
                              {(isSelected || showCorrect) && (
                                <Ionicons
                                  name={
                                    showCorrect
                                      ? "checkmark"
                                      : showWrong
                                        ? "close"
                                        : "checkmark"
                                  }
                                  size={14}
                                  color="white"
                                />
                              )}
                            </View>

                            {/* Option Text */}
                            <Text
                              className={`flex-1 font-medium text-sm ${
                                showCorrect
                                  ? "text-green-700"
                                  : showWrong
                                    ? "text-red-700"
                                    : isSelected
                                      ? "text-purple-700"
                                      : "text-gray-700"
                              }`}
                            >
                              {option}
                            </Text>

                            {/* Result Icon */}
                            {showCorrect && (
                              <View className="bg-green-500 w-6 h-6 rounded-full items-center justify-center">
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="white"
                                />
                              </View>
                            )}
                            {showWrong && (
                              <View className="bg-red-500 w-6 h-6 rounded-full items-center justify-center">
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

                {/* Explanation Section */}
                {showExplanation && (
                  <Animatable.View
                    animation="fadeInUp"
                    duration={300}
                    className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200"
                  >
                    <View className="flex-row items-start">
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color="#3b82f6"
                      />
                      <View className="flex-1 ml-2">
                        <Text className="text-blue-800 font-bold text-xs mb-1">
                          Explanation
                        </Text>
                        <Text className="text-blue-700 text-xs leading-4">
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
                    className="mt-3 bg-blue-100 py-2 rounded-xl"
                  >
                    <Text className="text-blue-700 text-center font-semibold text-sm">
                      Show Explanation
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animatable.View>
          );
        })}
      </ScrollView>

      {/* Navigation Buttons */}
      <View
        className="px-6 py-4 bg-white border-t border-gray-100 flex-row gap-3"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <TouchableOpacity
          onPress={handlePreviousPage}
          disabled={currentPage === 0}
          className={`px-6 py-3 rounded-2xl flex-row items-center ${
            currentPage === 0 ? "bg-gray-100" : "bg-purple-100"
          }`}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentPage === 0 ? "#9CA3AF" : "#667eea"}
          />
          <Text
            className={`font-bold ml-2 ${
              currentPage === 0 ? "text-gray-400" : "text-purple-600"
            }`}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNextPage}
          disabled={!allPageQuestionsAnswered}
          className="flex-1"
        >
          <LinearGradient
            colors={
              !allPageQuestionsAnswered
                ? ["#D1D5DB", "#9CA3AF"]
                : ["#667eea", "#764ba2"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-3 rounded-2xl flex-row items-center justify-center"
            style={{
              shadowColor: !allPageQuestionsAnswered ? "#9CA3AF" : "#667eea",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text className="text-white font-bold text-base mr-2">
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
