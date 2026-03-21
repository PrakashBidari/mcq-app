// app/category/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as Animatable from "react-native-animatable";

// Sample books data - you can replace this with your actual data
const booksData = {
  1: [
    // Design category
    {
      id: 1,
      title: "The Design of Everyday Things",
      author: "Don Norman",
      cover:
        "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400",
      rating: 4.8,
      pages: 368,
      duration: "12h 30m",
      description: "A comprehensive guide to user-centered design principles",
      difficulty: "Intermediate",
      students: 12400,
    },
    {
      id: 2,
      title: "Refactoring UI",
      author: "Adam Wathan & Steve Schoger",
      cover: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400",
      rating: 4.9,
      pages: 250,
      duration: "8h 45m",
      description: "Learn how to design beautiful user interfaces",
      difficulty: "Beginner",
      students: 18200,
    },
    {
      id: 3,
      title: "Design Systems Handbook",
      author: "Marco Suarez",
      cover:
        "https://images.unsplash.com/photo-1610465299996-30f240ac2b1c?w=400",
      rating: 4.7,
      pages: 420,
      duration: "15h 20m",
      description: "Building scalable design systems for modern products",
      difficulty: "Advanced",
      students: 9800,
    },
  ],
  2: [
    // Development category
    {
      id: 4,
      title: "Clean Code",
      author: "Robert C. Martin",
      cover:
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400",
      rating: 4.9,
      pages: 464,
      duration: "16h 30m",
      description: "A handbook of agile software craftsmanship",
      difficulty: "Intermediate",
      students: 25600,
    },
    {
      id: 5,
      title: "JavaScript: The Good Parts",
      author: "Douglas Crockford",
      cover:
        "https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=400",
      rating: 4.6,
      pages: 172,
      duration: "6h 15m",
      description: "Unearthing the excellence in JavaScript",
      difficulty: "Intermediate",
      students: 15400,
    },
  ],
  3: [
    // Business category
    {
      id: 6,
      title: "Zero to One",
      author: "Peter Thiel",
      cover: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400",
      rating: 4.8,
      pages: 224,
      duration: "7h 30m",
      description: "Notes on startups and building the future",
      difficulty: "Beginner",
      students: 32100,
    },
  ],
  4: [
    // Marketing category
    {
      id: 7,
      title: "Influence",
      author: "Robert Cialdini",
      cover:
        "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400",
      rating: 4.9,
      pages: 336,
      duration: "11h 20m",
      description: "The psychology of persuasion",
      difficulty: "Intermediate",
      students: 19800,
    },
  ],
  5: [
    // Photography category
    {
      id: 8,
      title: "Understanding Exposure",
      author: "Bryan Peterson",
      cover:
        "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400",
      rating: 4.7,
      pages: 288,
      duration: "9h 45m",
      description: "Master the art of photography exposure",
      difficulty: "Beginner",
      students: 14200,
    },
  ],
  6: [
    // Music category
    {
      id: 9,
      title: "Music Theory for Beginners",
      author: "Sarah Jones",
      cover:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      rating: 4.6,
      pages: 192,
      duration: "6h 30m",
      description: "Learn the fundamentals of music theory",
      difficulty: "Beginner",
      students: 11500,
    },
  ],
};

const categoryInfo = {
  1: {
    name: "Design",
    gradient: ["#667eea", "#764ba2"],
    icon: "color-palette",
  },
  2: {
    name: "Development",
    gradient: ["#f093fb", "#f5576c"],
    icon: "code-slash",
  },
  3: { name: "Business", gradient: ["#4facfe", "#00f2fe"], icon: "briefcase" },
  4: { name: "Marketing", gradient: ["#43e97b", "#38f9d7"], icon: "megaphone" },
  5: { name: "Photography", gradient: ["#fa709a", "#fee140"], icon: "camera" },
  6: { name: "Music", gradient: ["#30cfd0", "#330867"], icon: "musical-notes" },
};

export default function CategoryBooks() {
  const { id, name } = useLocalSearchParams();
  const categoryId = parseInt(id as string);
  const books = booksData[categoryId] || [];
  const category = categoryInfo[categoryId];

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

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={category?.gradient || ["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-8 px-6"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <View className="bg-white/20 backdrop-blur w-10 h-10 rounded-full items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="white" />
          </View>
        </TouchableOpacity>

        {/* Category Info */}
        <View className="flex-row items-center mb-4">
          <View className="bg-white/20 backdrop-blur w-16 h-16 rounded-2xl items-center justify-center mr-4">
            <Ionicons name={category?.icon as any} size={32} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white/80 text-sm font-semibold mb-1">
              CATEGORY
            </Text>
            <Text className="text-white text-3xl font-black">
              {name || category?.name}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-4 mt-2">
          <View className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
            <Text className="text-white font-bold text-sm">
              {books.length} Books
            </Text>
          </View>
          <View className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
            <Text className="text-white font-bold text-sm">All Levels</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Books List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {books.map((book, index) => (
          <Animatable.View
            key={book.id}
            animation="fadeInUp"
            delay={index * 100}
            className="mb-4"
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/book/[id]",
                  params: {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    cover: book.cover,
                  },
                })
              }
            >
              <View
                className="bg-white rounded-3xl overflow-hidden flex-row"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {/* Book Cover */}
                <View className="relative">
                  <Image source={{ uri: book.cover }} className="w-32 h-48" />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                    className="absolute inset-0"
                  />

                  {/* Rating Badge */}
                  <View className="absolute top-3 left-3 bg-yellow-400 px-2 py-1 rounded-full flex-row items-center">
                    <Ionicons name="star" size={12} color="#fff" />
                    <Text className="text-white font-bold text-xs ml-1">
                      {book.rating}
                    </Text>
                  </View>
                </View>

                {/* Book Info */}
                <View className="flex-1 p-4 justify-between">
                  <View>
                    <Text
                      className="text-gray-800 text-lg font-black mb-1"
                      numberOfLines={2}
                    >
                      {book.title}
                    </Text>
                    <Text className="text-gray-500 text-sm font-semibold mb-3">
                      by {book.author}
                    </Text>
                    <Text
                      className="text-gray-600 text-xs leading-5"
                      numberOfLines={2}
                    >
                      {book.description}
                    </Text>
                  </View>

                  {/* Book Stats */}
                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row gap-3">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="document-text-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text className="text-gray-500 text-xs ml-1">
                          {book.pages}p
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text className="text-gray-500 text-xs ml-1">
                          {book.duration}
                        </Text>
                      </View>
                    </View>

                    {/* Difficulty Badge */}
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          getDifficultyColor(book.difficulty) + "20",
                      }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: getDifficultyColor(book.difficulty) }}
                      >
                        {book.difficulty}
                      </Text>
                    </View>
                  </View>

                  {/* Students Count */}
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="people-outline" size={14} color="#667eea" />
                    <Text className="text-purple-600 text-xs font-bold ml-1">
                      {book.students.toLocaleString()} students
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animatable.View>
        ))}

        {books.length === 0 && (
          <View className="items-center justify-center py-20">
            <Ionicons name="book-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-400 text-lg font-bold mt-4">
              No books available
            </Text>
            <Text className="text-gray-400 text-sm mt-2">
              Check back later for new content
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
