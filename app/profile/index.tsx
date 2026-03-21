// app/profile/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "stats" | "achievements" | "activity"
  >("stats");

  // User data
  const user = {
    name: "Alex Martinez",
    email: "alex.martinez@email.com",
    avatar: "https://i.pravatar.cc/150?img=12",
    joinDate: "January 2024",
    bio: "Passionate learner exploring technology, design, and business. Always eager to grow and share knowledge.",
    level: 12,
    xp: 2840,
    nextLevelXp: 3000,
  };

  // Stats data
  const stats = [
    {
      id: 1,
      label: "Courses Completed",
      value: "12",
      icon: "checkmark-circle",
      color: "#059669",
      bgColor: "#d1fae5",
    },
    {
      id: 2,
      label: "Hours Learned",
      value: "148",
      icon: "time",
      color: "#2563eb",
      bgColor: "#dbeafe",
    },
    {
      id: 3,
      label: "Quizzes Passed",
      value: "45",
      icon: "trophy",
      color: "#f59e0b",
      bgColor: "#fef3c7",
    },
    {
      id: 4,
      label: "Day Streak",
      value: "24",
      icon: "flame",
      color: "#dc2626",
      bgColor: "#fee2e2",
    },
  ];

  // Achievements data
  const achievements = [
    {
      id: 1,
      title: "Quick Starter",
      description: "Complete your first course",
      icon: "rocket",
      color: "#7c3aed",
      earned: true,
      earnedDate: "Jan 15, 2024",
      progress: 100,
    },
    {
      id: 2,
      title: "Knowledge Seeker",
      description: "Complete 10 courses",
      icon: "book",
      color: "#2563eb",
      earned: true,
      earnedDate: "Feb 8, 2024",
      progress: 100,
    },
    {
      id: 3,
      title: "Quiz Master",
      description: "Score 90% or higher in 20 quizzes",
      icon: "trophy",
      color: "#f59e0b",
      earned: true,
      earnedDate: "Feb 10, 2024",
      progress: 100,
    },
    {
      id: 4,
      title: "Dedicated Learner",
      description: "Maintain a 30-day learning streak",
      icon: "flame",
      color: "#dc2626",
      earned: false,
      progress: 80,
    },
    {
      id: 5,
      title: "Social Butterfly",
      description: "Share 10 achievements",
      icon: "share-social",
      color: "#059669",
      earned: false,
      progress: 40,
    },
    {
      id: 6,
      title: "Night Owl",
      description: "Complete 5 courses after 10 PM",
      icon: "moon",
      color: "#8b5cf6",
      earned: false,
      progress: 60,
    },
  ];

  // Recent activity
  const recentActivity = [
    {
      id: 1,
      type: "course",
      title: "Completed React Native Complete Guide",
      date: "2 hours ago",
      icon: "checkmark-circle",
      color: "#059669",
    },
    {
      id: 2,
      type: "quiz",
      title: "Scored 95% in JavaScript Fundamentals",
      date: "5 hours ago",
      icon: "trophy",
      color: "#f59e0b",
    },
    {
      id: 3,
      type: "achievement",
      title: "Earned 'Quiz Master' badge",
      date: "1 day ago",
      icon: "medal",
      color: "#7c3aed",
    },
    {
      id: 4,
      type: "course",
      title: "Started UI/UX Design Masterclass",
      date: "2 days ago",
      icon: "play-circle",
      color: "#2563eb",
    },
  ];

  const levelProgress = (user.xp / user.nextLevelXp) * 100;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">My Profile</Text>
          <TouchableOpacity className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Card */}
        <View className="px-6 pt-6 pb-4">
          <View
            className="bg-white rounded-3xl p-6 border border-gray-100"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Avatar and Basic Info */}
            <View className="items-center mb-6">
              <View className="relative mb-4">
                <Image
                  source={{ uri: user.avatar }}
                  className="w-24 h-24 rounded-full"
                />
                <View className="absolute -bottom-1 -right-1 bg-green-500 w-7 h-7 rounded-full border-4 border-white" />
              </View>
              <Text className="text-gray-900 text-2xl font-bold mb-1">
                {user.name}
              </Text>
              <Text className="text-gray-500 text-sm mb-3">{user.email}</Text>
              <View className="bg-purple-50 px-4 py-1.5 rounded-full">
                <Text className="text-purple-600 text-sm font-semibold">
                  Member since {user.joinDate}
                </Text>
              </View>
            </View>

            {/* Bio */}
            <View className="mb-6 pb-6 border-b border-gray-100">
              <Text className="text-gray-700 text-sm text-center leading-5">
                {user.bio}
              </Text>
            </View>

            {/* Level Progress */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <LinearGradient
                    colors={["#7c3aed", "#a855f7"]}
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  >
                    <Text className="text-white text-lg font-bold">
                      {user.level}
                    </Text>
                  </LinearGradient>
                  <View>
                    <Text className="text-gray-900 font-bold text-base">
                      Level {user.level}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {user.xp} / {user.nextLevelXp} XP
                    </Text>
                  </View>
                </View>
                <Text className="text-purple-600 font-bold text-sm">
                  {Math.round(levelProgress)}%
                </Text>
              </View>

              <View className="bg-gray-100 h-3 rounded-full overflow-hidden">
                <View
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                  style={{ width: `${levelProgress}%` }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="px-6 mb-4">
          <View className="flex-row bg-gray-100 rounded-2xl p-1">
            <TouchableOpacity
              onPress={() => setActiveTab("stats")}
              className={`flex-1 py-3 rounded-xl ${
                activeTab === "stats" ? "bg-white" : ""
              }`}
              style={
                activeTab === "stats"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }
                  : {}
              }
            >
              <Text
                className={`text-center font-bold text-sm ${
                  activeTab === "stats" ? "text-purple-600" : "text-gray-500"
                }`}
              >
                Stats
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("achievements")}
              className={`flex-1 py-3 rounded-xl ${
                activeTab === "achievements" ? "bg-white" : ""
              }`}
              style={
                activeTab === "achievements"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }
                  : {}
              }
            >
              <Text
                className={`text-center font-bold text-sm ${
                  activeTab === "achievements"
                    ? "text-purple-600"
                    : "text-gray-500"
                }`}
              >
                Achievements
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("activity")}
              className={`flex-1 py-3 rounded-xl ${
                activeTab === "activity" ? "bg-white" : ""
              }`}
              style={
                activeTab === "activity"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }
                  : {}
              }
            >
              <Text
                className={`text-center font-bold text-sm ${
                  activeTab === "activity" ? "text-purple-600" : "text-gray-500"
                }`}
              >
                Activity
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        <View className="px-6">
          {/* Stats Tab */}
          {activeTab === "stats" && (
            <View className="flex-row flex-wrap gap-3">
              {stats.map((stat) => (
                <View
                  key={stat.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100"
                  style={{
                    width: "48%",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    <Ionicons
                      name={stat.icon as any}
                      size={24}
                      color={stat.color}
                    />
                  </View>
                  <Text className="text-gray-900 text-3xl font-bold mb-1">
                    {stat.value}
                  </Text>
                  <Text className="text-gray-500 text-xs">{stat.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Achievements Tab */}
          {activeTab === "achievements" && (
            <View className="gap-3">
              {achievements.map((achievement) => (
                <View
                  key={achievement.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-start">
                    <View
                      className="w-14 h-14 rounded-xl items-center justify-center mr-4"
                      style={{
                        backgroundColor: achievement.earned
                          ? achievement.color + "15"
                          : "#f3f4f6",
                      }}
                    >
                      <Ionicons
                        name={achievement.icon as any}
                        size={28}
                        color={
                          achievement.earned ? achievement.color : "#9ca3af"
                        }
                      />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text
                          className={`text-base font-bold mr-2 ${
                            achievement.earned
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {achievement.title}
                        </Text>
                        {achievement.earned && (
                          <View className="bg-green-100 px-2 py-0.5 rounded-full">
                            <Text className="text-green-600 text-xs font-bold">
                              Earned
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        className={`text-sm mb-3 ${
                          achievement.earned ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        {achievement.description}
                      </Text>

                      {achievement.earned ? (
                        <Text className="text-gray-400 text-xs">
                          Earned on {achievement.earnedDate}
                        </Text>
                      ) : (
                        <View>
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-gray-500 text-xs">
                              Progress
                            </Text>
                            <Text className="text-gray-600 text-xs font-bold">
                              {achievement.progress}%
                            </Text>
                          </View>
                          <View className="bg-gray-100 h-2 rounded-full overflow-hidden">
                            <View
                              className="h-full rounded-full"
                              style={{
                                width: `${achievement.progress}%`,
                                backgroundColor: achievement.color,
                              }}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <View className="gap-3">
              {recentActivity.map((activity) => (
                <View
                  key={activity.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: activity.color + "15" }}
                  >
                    <Ionicons
                      name={activity.icon as any}
                      size={24}
                      color={activity.color}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-sm mb-1">
                      {activity.title}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {activity.date}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
