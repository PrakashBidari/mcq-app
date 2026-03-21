// app/quiz/results.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
    ScrollView,
    StatusBar,
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
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={passed ? ["#10b981", "#059669"] : ["#ef4444", "#dc2626"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-9 pb-10 px-6 rounded-b-[40px]"
      >
        <Animatable.View animation="fadeInDown" delay={100}>
          <View className="items-center">
            <Animatable.View
              animation="bounceIn"
              delay={300}
              className="bg-white/20 w-24 h-24 rounded-full items-center justify-center mb-4"
            >
              <Ionicons
                name={passed ? "trophy" : "sad-outline"}
                size={48}
                color="white"
              />
            </Animatable.View>

            <Text className="text-white/90 text-base font-semibold mb-2">
              Quiz Completed!
            </Text>
            <Text className="text-white text-4xl font-black mb-2">
              {gradeInfo.message}
            </Text>
            <Text className="text-white/80 text-lg">
              You scored {score} out of {total}
            </Text>
          </View>
        </Animatable.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {/* Score Cards */}
        <View className="flex-row gap-3 mt-0 mb-6">
          <Animatable.View
            animation="fadeInLeft"
            delay={400}
            className="flex-1"
          >
            <View
              className="bg-white rounded-3xl p-5 items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: gradeInfo.color + "20" }}
              >
                <Text
                  className="text-3xl font-black"
                  style={{ color: gradeInfo.color }}
                >
                  {gradeInfo.grade}
                </Text>
              </View>
              <Text className="text-gray-500 text-sm font-semibold">
                Your Grade
              </Text>
            </View>
          </Animatable.View>

          <Animatable.View
            animation="fadeInRight"
            delay={500}
            className="flex-1"
          >
            <View
              className="bg-white rounded-3xl p-5 items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <View className="h-16 px-1 rounded-full items-center justify-center mb-3">
                <Text className="text-3xl font-black text-purple-700">
                  {percentage}%
                </Text>
              </View>
              <Text className="text-gray-500 text-sm font-semibold">
                Accuracy
              </Text>
            </View>
          </Animatable.View>
        </View>

        {/* Stats */}
        <Animatable.View animation="fadeInUp" delay={600}>
          <View
            className="bg-white rounded-3xl p-6 mb-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text className="text-gray-800 text-lg font-bold mb-4">
              Quiz Statistics
            </Text>

            <View className="gap-3">
              <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <View className="bg-green-100 w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#10b981"
                    />
                  </View>
                  <Text className="text-gray-700 font-semibold">
                    Correct Answers
                  </Text>
                </View>
                <Text className="text-green-600 font-black text-lg">
                  {score}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <View className="bg-red-100 w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </View>
                  <Text className="text-gray-700 font-semibold">
                    Wrong Answers
                  </Text>
                </View>
                <Text className="text-red-600 font-black text-lg">
                  {total - score}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="help-circle" size={20} color="#3b82f6" />
                  </View>
                  <Text className="text-gray-700 font-semibold">
                    Total Questions
                  </Text>
                </View>
                <Text className="text-blue-600 font-black text-lg">
                  {total}
                </Text>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Review Answers */}
        <Animatable.View animation="fadeInUp" delay={700}>
          <View
            className="bg-white rounded-3xl p-6 mb-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text className="text-gray-800 text-lg font-bold mb-4">
              Answer Review
            </Text>

            <View className="gap-3">
              {questions.map((question: any, index: number) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === question.correctAnswer;

                return (
                  <View
                    key={question.id}
                    className={`p-4 rounded-2xl ${
                      isCorrect
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <View className="flex-row items-start mb-2">
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                          isCorrect ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        <Ionicons
                          name={isCorrect ? "checkmark" : "close"}
                          size={16}
                          color="white"
                        />
                      </View>
                      <Text className="flex-1 text-gray-800 font-semibold text-sm">
                        Q{index + 1}: {question.question}
                      </Text>
                    </View>

                    <View className="ml-9">
                      <Text
                        className={`text-xs font-bold mb-1 ${
                          isCorrect ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        Your answer: {question.options[userAnswer]}
                      </Text>
                      {!isCorrect && (
                        <Text className="text-green-700 text-xs font-bold">
                          Correct: {question.options[question.correctAnswer]}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </Animatable.View>

        {/* Action Buttons */}
        <View className="gap-3">
          <Animatable.View animation="bounceIn" delay={800}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/quiz")}>
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-4 rounded-2xl flex-row items-center justify-center"
                style={{
                  shadowColor: "#667eea",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Ionicons name="refresh" size={24} color="white" />
                <Text className="text-white font-black text-lg ml-2">
                  Try Another Quiz
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View animation="bounceIn" delay={900}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)")}
              className="bg-gray-100 py-4 rounded-2xl"
            >
              <Text className="text-gray-700 text-center font-bold text-base">
                Back to Home
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </ScrollView>
    </View>
  );
}
