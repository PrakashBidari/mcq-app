// app/my-learning/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import questions data
import questionsData from "@/assets/data/questions.json";

export default function MyLearningScreen() {
  const router = useRouter();

  // Question sets configuration
  const questionSets = [
    {
      id: 1,
      title: "UI/UX Fundamentals",
      category: "Design",
      difficulty: "Easy",
      estimatedTime: "10 min",
      icon: "color-palette",
      color: "#7c3aed",
      bgColor: "#f3e8ff",
    },
    {
      id: 2,
      title: "Advanced Design Patterns",
      category: "Design",
      difficulty: "Hard",
      estimatedTime: "15 min",
      icon: "color-palette",
      color: "#7c3aed",
      bgColor: "#f3e8ff",
    },
    {
      id: 3,
      title: "JavaScript Basics",
      category: "Development",
      difficulty: "Easy",
      estimatedTime: "12 min",
      icon: "code-slash",
      color: "#2563eb",
      bgColor: "#dbeafe",
    },
    {
      id: 4,
      title: "React Advanced Concepts",
      category: "Development",
      difficulty: "Hard",
      estimatedTime: "18 min",
      icon: "code-slash",
      color: "#2563eb",
      bgColor: "#dbeafe",
    },
    {
      id: 5,
      title: "Python for Beginners",
      category: "Development",
      difficulty: "Easy",
      estimatedTime: "14 min",
      icon: "code-slash",
      color: "#2563eb",
      bgColor: "#dbeafe",
    },
    {
      id: 6,
      title: "Business Strategy 101",
      category: "Business",
      difficulty: "Medium",
      estimatedTime: "15 min",
      icon: "briefcase",
      color: "#059669",
      bgColor: "#d1fae5",
    },
    {
      id: 7,
      title: "Financial Management",
      category: "Business",
      difficulty: "Hard",
      estimatedTime: "20 min",
      icon: "briefcase",
      color: "#059669",
      bgColor: "#d1fae5",
    },
    {
      id: 8,
      title: "Digital Marketing Basics",
      category: "Marketing",
      difficulty: "Easy",
      estimatedTime: "12 min",
      icon: "megaphone",
      color: "#dc2626",
      bgColor: "#fee2e2",
    },
    {
      id: 9,
      title: "SEO Mastery",
      category: "Marketing",
      difficulty: "Medium",
      estimatedTime: "16 min",
      icon: "megaphone",
      color: "#dc2626",
      bgColor: "#fee2e2",
    },
    {
      id: 10,
      title: "Photography Essentials",
      category: "Photography",
      difficulty: "Easy",
      estimatedTime: "10 min",
      icon: "camera",
      color: "#f59e0b",
      bgColor: "#fef3c7",
    },
  ];

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

  const getSetQuestionCount = (setId: number) => {
    return questionsData.filter((q) => q.questionSetIds?.includes(setId))
      .length;
  };

  const startQuestionSetQuiz = (setId: number) => {
    // Filter questions that belong to this question set
    const setQuestions = questionsData.filter((q) =>
      q.questionSetIds?.includes(setId),
    );

    if (setQuestions.length === 0) {
      alert("No questions available for this set");
      return;
    }

    const shuffled = [...setQuestions].sort(() => Math.random() - 0.5);

    router.push({
      pathname: "/quiz/play",
      params: {
        questions: JSON.stringify(shuffled),
        total: shuffled.length,
      },
    });
  };

  // Calculate total stats
  const totalQuestions = questionsData.length;
  const totalSets = questionSets.length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">My Learning</Text>
          <TouchableOpacity className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
            <Ionicons name="stats-chart-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Stats Banner */}
        <View className="bg-purple-50 rounded-2xl p-4 flex-row items-center justify-around">
          <View className="items-center">
            <Text className="text-purple-600 text-2xl font-bold">
              {totalSets}
            </Text>
            <Text className="text-purple-600 text-xs font-medium">
              Question Sets
            </Text>
          </View>
          <View className="w-px h-8 bg-purple-200" />
          <View className="items-center">
            <Text className="text-purple-600 text-2xl font-bold">
              {totalQuestions}
            </Text>
            <Text className="text-purple-600 text-xs font-medium">
              Questions
            </Text>
          </View>
          <View className="w-px h-8 bg-purple-200" />
          <View className="items-center">
            <Text className="text-purple-600 text-2xl font-bold">45</Text>
            <Text className="text-purple-600 text-xs font-medium">
              Completed
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-gray-900 font-bold text-lg mb-4">
          Practice Question Sets
        </Text>

        <View className="gap-3">
          {questionSets.map((set) => {
            const questionCount = getSetQuestionCount(set.id);

            return (
              <View
                key={set.id}
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
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <View
                          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: set.bgColor }}
                        >
                          <Ionicons
                            name={set.icon as any}
                            size={24}
                            color={set.color}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-bold text-base mb-1">
                            {set.title}
                          </Text>
                          <Text className="text-gray-500 text-xs">
                            {set.category}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-3 mb-3">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="help-circle-outline"
                            size={14}
                            color="#6b7280"
                          />
                          <Text className="text-gray-600 text-xs ml-1">
                            {questionCount} questions
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#6b7280"
                          />
                          <Text className="text-gray-600 text-xs ml-1">
                            {set.estimatedTime}
                          </Text>
                        </View>
                        <View
                          className="px-2 py-1 rounded-md"
                          style={{
                            backgroundColor:
                              getDifficultyColor(set.difficulty) + "15",
                          }}
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{
                              color: getDifficultyColor(set.difficulty),
                            }}
                          >
                            {set.difficulty}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    onPress={() => startQuestionSetQuiz(set.id)}
                    className="py-3 rounded-xl flex-row items-center justify-center"
                    style={{ backgroundColor: set.color }}
                    disabled={questionCount === 0}
                  >
                    <Ionicons name="play-circle" size={20} color="white" />
                    <Text className="text-white font-bold text-sm ml-2">
                      {questionCount === 0 ? "No Questions" : "Start Quiz"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Help Section */}
        <View className="mt-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <View className="flex-row items-start">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="information-circle" size={24} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-base mb-2">
                How it works
              </Text>
              <Text className="text-gray-600 text-sm leading-5">
                Practice with curated question sets organized by topic and
                difficulty. Track your progress and improve your knowledge with
                each attempt.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* <BottomTabBar /> */}
    </SafeAreaView>
  );
}
