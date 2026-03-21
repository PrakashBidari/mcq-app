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

// Sample book content - Replace with your actual content
const bookContent = {
  1: {
    chapters: [
      {
        id: 1,
        title: "Introduction to Design Thinking",
        pages: 24,
        duration: "45 min",
      },
      { id: 2, title: "User-Centered Design", pages: 32, duration: "1h 10min" },
      {
        id: 3,
        title: "Affordances and Signifiers",
        pages: 28,
        duration: "55 min",
      },
      {
        id: 4,
        title: "The Psychology of Design",
        pages: 36,
        duration: "1h 20min",
      },
      { id: 5, title: "Design Principles", pages: 30, duration: "1h" },
    ],
    progress: 35,
    lastRead: "Chapter 2: User-Centered Design",
  },
  // Add more books as needed
};

export default function BookReader() {
  const { id, title, author, cover } = useLocalSearchParams();
  const bookId = parseInt(id as string);
  const book = bookContent[bookId] || {
    chapters: [],
    progress: 0,
    lastRead: "Start reading",
  };

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
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="flex-row items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={14}
                        color="#fbbf24"
                      />
                    ))}
                  </View>
                  <Text className="text-gray-600 text-xs font-semibold">
                    4.8 (2.4k)
                  </Text>
                </View>
              </View>

              {/* Quick Stats */}
              <View className="flex-row gap-2">
                <View className="bg-purple-50 px-3 py-1.5 rounded-lg">
                  <Text className="text-purple-600 text-xs font-bold">
                    24 Chapters
                  </Text>
                </View>
                <View className="bg-green-50 px-3 py-1.5 rounded-lg">
                  <Text className="text-green-600 text-xs font-bold">
                    12h 30m
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          {book.progress > 0 && (
            <View className="mt-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600 text-xs font-semibold">
                  Your Progress
                </Text>
                <Text className="text-purple-600 text-xs font-bold">
                  {book.progress}%
                </Text>
              </View>
              <View className="bg-gray-100 h-2 rounded-full overflow-hidden">
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-full rounded-full"
                  style={{ width: `${book.progress}%` }}
                />
              </View>
              <Text className="text-gray-500 text-xs mt-2">
                Last read: {book.lastRead}
              </Text>
            </View>
          )}
        </Animatable.View>

        {/* Continue/Start Reading Button */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            onPress={() => {
              // Navigate to actual reading page
              router.push({
                pathname: "/reader/[bookId]",
                params: { bookId: id, chapterId: 1 },
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
              <Ionicons
                name={book.progress > 0 ? "play" : "book-outline"}
                size={24}
                color="white"
              />
              <Text className="text-white font-black text-lg ml-2">
                {book.progress > 0 ? "Continue Reading" : "Start Reading"}
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

        {/* Chapters List */}
        {activeTab === "chapters" && (
          <View className="px-6">
            {book.chapters.map((chapter, index) => (
              <Animatable.View
                key={chapter.id}
                animation="fadeInUp"
                delay={index * 50}
              >
                <TouchableOpacity
                  onPress={() => {
                    router.push({
                      pathname: "/reader/[bookId]",
                      params: { bookId: id, chapterId: chapter.id },
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    {/* Chapter Number */}
                    <View className="bg-purple-100 w-12 h-12 rounded-xl items-center justify-center mr-4">
                      <Text className="text-purple-600 font-black text-lg">
                        {chapter.id}
                      </Text>
                    </View>

                    {/* Chapter Info */}
                    <View className="flex-1">
                      <Text
                        className="text-gray-800 font-bold text-base mb-1"
                        numberOfLines={2}
                      >
                        {chapter.title}
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="document-text-outline"
                            size={14}
                            color="#9CA3AF"
                          />
                          <Text className="text-gray-500 text-xs ml-1">
                            {chapter.pages} pages
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#9CA3AF"
                          />
                          <Text className="text-gray-500 text-xs ml-1">
                            {chapter.duration}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Play Icon */}
                    <View className="bg-purple-50 w-10 h-10 rounded-full items-center justify-center">
                      <Ionicons name="play" size={18} color="#667eea" />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))}
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
                This comprehensive guide covers the fundamental principles of
                design thinking and user-centered design. Learn how to create
                products that people love through practical examples and
                real-world case studies.
                {"\n\n"}
                Perfect for designers, developers, and anyone interested in
                creating better user experiences.
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
                  <Text className="text-gray-500 font-semibold">Publisher</Text>
                  <Text className="text-gray-800 font-bold">Design Press</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500 font-semibold">
                    Publication Date
                  </Text>
                  <Text className="text-gray-800 font-bold">Jan 2024</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500 font-semibold">Language</Text>
                  <Text className="text-gray-800 font-bold">English</Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-500 font-semibold">ISBN</Text>
                  <Text className="text-gray-800 font-bold">
                    978-1234567890
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
