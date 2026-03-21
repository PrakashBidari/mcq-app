// app/(tabs)/study.tsx
import BookCard from "@/components/BookCard";
import { API_URL } from "@/config/constants";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";

export default function Study() {
  const [allBooks, setAllBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest">(
    "popular",
  );

  // Fetch categories and books
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch categories
      const categoriesResponse = await fetch(`${API_URL}/categories`);
      const categoriesData = await categoriesResponse.json();

      if (categoriesData.success) {
        const formattedCategories = [
          {
            id: 0,
            name: "All Categories",
            icon: "grid-outline",
            color: "#667eea",
          },
          ...categoriesData.data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          })),
        ];
        setCategories(formattedCategories);
      }

      // Fetch books
      const booksResponse = await fetch(`${API_URL}/books`);
      const booksData = await booksResponse.json();

      if (booksData.success) {
        setAllBooks(booksData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Filter books by category and search
  const filteredBooks = allBooks.filter((book: any) => {
    const matchesCategory =
      selectedCategory === 0 || book.categoryId === selectedCategory;
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a: any, b: any) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "popular") return b.students - a.students;
    return 0; // newest - would need date field
  });

  const selectedCategoryInfo = categories.find(
    (cat: any) => cat.id === selectedCategory,
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#667eea" />
        <Text className="text-gray-600 mt-4 text-base">Loading books...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-6">
        <Text className="text-gray-800 text-3xl font-black mb-2">
          Study Library
        </Text>
        <Text className="text-gray-500 text-sm font-medium">
          {filteredBooks.length} books available
        </Text>
      </View>

      {/* Search and Filter Section */}
      <View className="bg-white px-6 pb-4">
        {/* Search Bar */}
        <View
          className="bg-gray-50 rounded-2xl flex-row items-center px-4 py-3 mb-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search books, authors, categories..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-base text-gray-800"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Selector and Sort */}
        <View className="flex-row gap-3">
          {/* Category Dropdown */}
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            className="flex-1 bg-purple-50 rounded-2xl px-4 py-3 flex-row items-center justify-between"
            style={{
              borderWidth: 1,
              borderColor: "#E9D5FF",
            }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                style={{ backgroundColor: selectedCategoryInfo?.color + "20" }}
              >
                <Ionicons
                  name={selectedCategoryInfo?.icon as any}
                  size={18}
                  color={selectedCategoryInfo?.color}
                />
              </View>
              <Text
                className="text-purple-700 font-bold text-sm flex-1"
                numberOfLines={1}
              >
                {selectedCategoryInfo?.name}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#7c3aed" />
          </TouchableOpacity>

          {/* Sort Button */}
          <TouchableOpacity
            onPress={() => {
              if (sortBy === "popular") setSortBy("rating");
              else if (sortBy === "rating") setSortBy("newest");
              else setSortBy("popular");
            }}
            className="bg-gray-100 rounded-2xl px-4 py-3 items-center justify-center"
          >
            <Ionicons
              name={
                sortBy === "rating"
                  ? "star"
                  : sortBy === "newest"
                    ? "time"
                    : "flame"
              }
              size={20}
              color="#667eea"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Books List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7c3aed"]}
            tintColor="#7c3aed"
          />
        }
      >
        {sortedBooks.length === 0 ? (
          // Empty State
          <View className="items-center justify-center py-20">
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-400 text-lg font-bold mt-4">
              No books found
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              Try adjusting your search or filter criteria
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSelectedCategory(0);
              }}
              className="bg-purple-600 px-6 py-3 rounded-2xl mt-6"
            >
              <Text className="text-white font-bold">Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Books Grid
          <View className="flex-row flex-wrap justify-between">
            {sortedBooks.map((book: any, index: number) => (
              <View key={book.id || index} className="w-[48%] mb-4">
                <BookCard book={book} index={index} categories={categories} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          />

          <Animatable.View
            animation="slideInUp"
            duration={300}
            className="bg-white rounded-t-3xl"
          >
            {/* Modal Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-800 text-xl font-black">
                  Select Category
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryModal(false)}
                  className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#1F2937" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Categories List */}
            <ScrollView
              className="px-6 py-4"
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((category: any, index: number) => (
                <Animatable.View
                  key={category.id}
                  animation="fadeInRight"
                  delay={index * 50}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategory(category.id);
                      setShowCategoryModal(false);
                    }}
                    className={`flex-row items-center p-4 rounded-2xl mb-3 ${
                      selectedCategory === category.id
                        ? "bg-purple-50"
                        : "bg-gray-50"
                    }`}
                    style={
                      selectedCategory === category.id
                        ? {
                            borderWidth: 2,
                            borderColor: "#667eea",
                          }
                        : {}
                    }
                  >
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                      style={{ backgroundColor: category.color + "20" }}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={24}
                        color={category.color}
                      />
                    </View>

                    <View className="flex-1">
                      <Text
                        className={`font-bold text-base ${
                          selectedCategory === category.id
                            ? "text-purple-700"
                            : "text-gray-800"
                        }`}
                      >
                        {category.name}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {category.id === 0
                          ? `${allBooks.length} books`
                          : `${allBooks.filter((b: any) => b.categoryId === category.id).length} books`}
                      </Text>
                    </View>

                    {selectedCategory === category.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#667eea"
                      />
                    )}
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </ScrollView>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
}
