// app/book/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";

export default function BookReader() {
  const {
    id,
    title,
    author,
    cover,
    description,
    category,
    difficulty,
    pages,
    duration,
    rating,
  } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<"chapters" | "details">(
    "chapters",
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View className="flex-row gap-2">
            <TouchableOpacity className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
              <Ionicons name="share-outline" size={22} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
              <Ionicons name="bookmark-outline" size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Book Cover & Info */}
        <Animatable.View animation="fadeIn" className="bg-white px-6 pb-6">
          <View className="flex-row gap-4">
            {/* Book Cover */}
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Image source={{ uri: cover as string }} className="w-32 h-48" />
            </View>

            {/* Book Details */}
            <View className="flex-1 justify-between py-2">
              <View>
                <Text
                  className="text-gray-800 text-xl font-black leading-6 mb-2"
                  numberOfLines={3}
                >
                  {title}
                </Text>
                <Text className="text-gray-500 text-sm font-semibold mb-3">
                  by {author}
                </Text>

                {/* Rating & Reviews */}
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="flex-row items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={14}
                        color={
                          star <= Math.round(parseFloat(rating as string))
                            ? "#fbbf24"
                            : "#E5E7EB"
                        }
                      />
                    ))}
                  </View>
                  <Text className="text-gray-700 text-xs font-bold">
                    {rating ? parseFloat(rating as string).toFixed(1) : "N/A"}
                  </Text>
                </View>

                {/* 2-line Description */}
                {description ? (
                  <Text
                    className="text-gray-500 text-xs leading-5"
                    numberOfLines={2}
                  >
                    {description}
                  </Text>
                ) : null}
              </View>

              {/* Quick Stats */}
              <View className="flex-row gap-2 mt-3">
                <View className="bg-purple-50 px-3 py-1.5 rounded-lg">
                  <Text className="text-purple-600 text-xs font-bold">
                    {pages ? `${pages} Pages` : "No Pages Info"}
                  </Text>
                </View>
                <View className="bg-green-50 px-3 py-1.5 rounded-lg">
                  <Text className="text-green-600 text-xs font-bold">
                    {duration ? duration : "No Duration"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Continue/Start Reading Button */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/reader/[bookId]",
                params: {
                  bookId: id,
                  chapterId: 1,
                  rating: rating,
                  title: title,
                  duration: duration,
                  difficulty: difficulty,
                  description: description,
                },
              });
            }}
          >
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
              <Ionicons name="book-outline" size={24} color="white" />
              <Text className="text-white font-black text-lg ml-2">
                Start Reading
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="px-6 mb-4">
          <View className="bg-gray-100 p-1 rounded-2xl flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab("chapters")}
              className="flex-1"
            >
              <View
                className={`py-3 rounded-xl ${activeTab === "chapters" ? "bg-white" : ""}`}
              >
                <Text
                  className={`text-center font-bold text-sm ${activeTab === "chapters" ? "text-purple-600" : "text-gray-500"}`}
                >
                  Chapters
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("details")}
              className="flex-1"
            >
              <View
                className={`py-3 rounded-xl ${activeTab === "details" ? "bg-white" : ""}`}
              >
                <Text
                  className={`text-center font-bold text-sm ${activeTab === "details" ? "text-purple-600" : "text-gray-500"}`}
                >
                  Details
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chapters Tab — empty state since chapters come from API */}
        {activeTab === "chapters" && (
          <View className="px-6 py-10 items-center">
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-base font-bold mt-4">
              No chapters available
            </Text>
          </View>
        )}

        {/* Details Tab */}
        {activeTab === "details" && (
          <View className="px-6">
            <Animatable.View
              animation="fadeIn"
              className="bg-white rounded-2xl p-5 mb-4"
            >
              <Text className="text-gray-800 font-bold text-lg mb-4">
                About this book
              </Text>
              <Text className="text-gray-600 text-sm leading-6">
                {description || "No description available for this book."}
              </Text>
            </Animatable.View>

            {/* Additional Info */}
            <Animatable.View
              animation="fadeIn"
              delay={100}
              className="bg-white rounded-2xl p-5"
            >
              <Text className="text-gray-800 font-bold text-lg mb-4">
                Book Information
              </Text>

              <View className="space-y-3">
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500 font-semibold">Category</Text>
                  <Text className="text-gray-800 font-bold">
                    {category || "N/A"}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500 font-semibold">
                    Difficulty
                  </Text>
                  <Text className="text-gray-800 font-bold">
                    {difficulty || "N/A"}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500 font-semibold">Pages</Text>
                  <Text className="text-gray-800 font-bold">
                    {pages || "N/A"}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-500 font-semibold">Duration</Text>
                  <Text className="text-gray-800 font-bold">
                    {duration || "N/A"}
                  </Text>
                </View>
              </View>
            </Animatable.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
