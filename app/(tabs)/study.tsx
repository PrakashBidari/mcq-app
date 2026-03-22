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
  StyleSheet,
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
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

      const booksResponse = await fetch(`${API_URL}/books`);
      const booksData = await booksResponse.json();
      if (booksData.success) setAllBooks(booksData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredBooks = allBooks.filter((book: any) => {
    const matchesCategory =
      selectedCategory === 0 || book.categoryId === selectedCategory;
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedBooks = [...filteredBooks].sort((a: any, b: any) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "popular") return b.students - a.students;
    return 0;
  });

  const selectedCategoryInfo = categories.find(
    (cat: any) => cat.id === selectedCategory,
  ) as any;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Library</Text>
        <Text style={styles.headerSubtitle}>
          {filteredBooks.length} books available
        </Text>
      </View>

      {/* ─── Search & Filter ─── */}
      <View style={styles.searchSection}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search books, authors, categories..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* FIX: gap → explicit marginRight on first child */}
        <View style={styles.filterRow}>
          {/* Category Dropdown */}
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            style={styles.categoryDropdown}
          >
            <View style={styles.categoryDropdownInner}>
              <View
                style={[
                  styles.categoryIconBox,
                  {
                    backgroundColor:
                      (selectedCategoryInfo?.color ?? "#667eea") + "20",
                  },
                ]}
              >
                <Ionicons
                  name={selectedCategoryInfo?.icon as any}
                  size={18}
                  color={selectedCategoryInfo?.color ?? "#667eea"}
                />
              </View>
              <Text style={styles.categoryDropdownText} numberOfLines={1}>
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
            style={styles.sortButton}
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

      {/* ─── Books List ─── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksScrollContent}
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
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filter criteria
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSelectedCategory(0);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // FIX: w-[48%] → calculated width using BOOK_CARD_WIDTH constant
          // FIX: flex-wrap gap → use justifyContent: "space-between" with marginBottom
          <View style={styles.booksGrid}>
            {sortedBooks.map((book: any, index: number) => (
              <View key={book.id || index} style={styles.bookCardWrapper}>
                <BookCard book={book} index={index} categories={categories} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ─── Category Modal ─── */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        {/* FIX: bg-black/50 → rgba via style prop */}
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          />

          {/* FIX: rounded-t-3xl on Animatable.View → style prop */}
          <Animatable.View
            animation="slideInUp"
            duration={300}
            style={styles.modalSheet}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Categories List */}
            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((category: any, index: number) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <Animatable.View
                    key={category.id}
                    animation="fadeInRight"
                    delay={index * 50}
                  >
                    {/* FIX: conditional className strings → conditional style arrays */}
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCategory(category.id);
                        setShowCategoryModal(false);
                      }}
                      style={[
                        styles.categoryItem,
                        isSelected
                          ? styles.categoryItemSelected
                          : styles.categoryItemDefault,
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryItemIcon,
                          { backgroundColor: category.color + "20" },
                        ]}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={24}
                          color={category.color}
                        />
                      </View>

                      <View style={styles.flex1}>
                        <Text
                          style={[
                            styles.categoryItemName,
                            isSelected && styles.categoryItemNameSelected,
                          ]}
                        >
                          {category.name}
                        </Text>
                        <Text style={styles.categoryItemCount}>
                          {category.id === 0
                            ? `${allBooks.length} books`
                            : `${allBooks.filter((b: any) => b.categoryId === category.id).length} books`}
                        </Text>
                      </View>

                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#667eea"
                        />
                      )}
                    </TouchableOpacity>
                  </Animatable.View>
                );
              })}
            </ScrollView>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
}

const GRID_GAP = 12;

const styles = StyleSheet.create({
  // ── Loading ──
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#4b5563",
    marginTop: 16,
    fontSize: 16,
  },

  // ── Page ──
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  flex1: {
    flex: 1,
  },

  // ── Header ──
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerTitle: {
    color: "#1f2937",
    fontSize: 30,
    // FIX: font-black → fontWeight string '900'
    fontWeight: "900",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },

  // ── Search & Filter ──
  searchSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchBar: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  // FIX: gap → marginRight on category button
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryDropdown: {
    flex: 1,
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e9d5ff",
    marginRight: GRID_GAP,
  },
  categoryDropdownInner: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  categoryDropdownText: {
    color: "#6d28d9",
    fontWeight: "700",
    fontSize: 14,
    flex: 1,
  },
  sortButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Books grid ──
  booksScrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  // FIX: flex-row + flex-wrap + justify-between instead of gap
  booksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  // FIX: w-[48%] className → explicit 48% width with marginBottom
  bookCardWrapper: {
    width: "48%",
    marginBottom: GRID_GAP,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    color: "#9ca3af",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  clearButton: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 24,
  },
  clearButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    // FIX: bg-black/50 → rgba via style
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  // FIX: rounded-t-3xl on Animatable.View → style prop
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: "#1f2937",
    fontSize: 20,
    fontWeight: "900",
  },
  modalCloseButton: {
    backgroundColor: "#f3f4f6",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalList: {
    maxHeight: 400,
  },
  modalListContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  // ── Category list items ──
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  // FIX: conditional className bg-purple-50 / bg-gray-50 → style objects
  categoryItemDefault: {
    backgroundColor: "#f9fafb",
  },
  categoryItemSelected: {
    backgroundColor: "#faf5ff",
    borderWidth: 2,
    borderColor: "#667eea",
  },
  categoryItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryItemName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1f2937",
  },
  // FIX: conditional text-purple-700 / text-gray-800 → style objects
  categoryItemNameSelected: {
    color: "#6d28d9",
  },
  categoryItemCount: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
});
