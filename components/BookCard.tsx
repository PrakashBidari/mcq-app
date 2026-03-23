// components/BookCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import * as Animatable from "react-native-animatable";

// Define the prop types
interface Book {
  id: number;
  title: string;
  author: string;
  cover: string;
  description: string;
  rating: number;
  pages: number;
  duration: string;
  categoryId: number;
  category: string;
  difficulty: string;
  students: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface BookCardProps {
  book: Book;
  index: number;
  categories: Category[];
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Beginner":
      return "#10b981";
    case "Intermediate":
      return "#f59e0b";
    case "Advanced":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const BookCard = ({ book, index, categories = [] }: BookCardProps) => {
  return (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 50}
      style={{ marginBottom: 16 }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/book/[id]",
            params: {
              id: book.id.toString(),
              book: JSON.stringify(book), // ← Fixed: Pass full book object
            },
          })
        }
      >
        <View
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            shadowColor: "#bdbdbd",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {/* Book Cover */}
          <View className="relative">
            <Image source={{ uri: book.cover }} className="w-full h-48" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              className="absolute inset-0"
            />

            {/* Category Badge */}
            <View className="absolute top-3 left-3">
              <View
                className="px-2 py-1 rounded-full"
                style={{
                  backgroundColor:
                    categories.find((c) => c.id === book.categoryId)?.color +
                    "DD",
                }}
              >
                <Text className="text-white text-xs font-bold">
                  {book.category}
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex-row items-center">
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text className="text-gray-800 font-bold text-xs ml-1">
                {book.rating}
              </Text>
            </View>

            {/* Bookmark */}
            <TouchableOpacity className="absolute top-3 right-3 bg-white/90 backdrop-blur w-8 h-8 rounded-full items-center justify-center">
              <Ionicons name="bookmark-outline" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>

          {/* Book Info */}
          <View className="p-3">
            <Text
              className="text-gray-800 text-sm font-bold mb-1"
              numberOfLines={1}
            >
              {book.title}
            </Text>
            <Text className="text-gray-500 text-xs mb-2" numberOfLines={1}>
              {book.author}
            </Text>

            {/* Stats */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs ml-1">
                  {book.duration}
                </Text>
              </View>
              <View
                className="px-2 py-0.5 rounded"
                style={{
                  backgroundColor: getDifficultyColor(book.difficulty) + "20",
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: getDifficultyColor(book.difficulty),
                  }}
                >
                  {book.difficulty}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );
};

export default BookCard;
