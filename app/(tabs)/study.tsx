// app/(tabs)/study.tsx
import AppHeader from "@/components/AppHeader";
import BookCard from "@/components/BookCard";
import BookmarkToast from "@/components/BookmarkToast";
import { API_URL } from "@/config/constants";
import { BookmarkItem, useBookmarks } from "@/hooks/useBookmarks";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";

const CAT_ICONS: Record<string, string> = {
  Design: "color-palette-outline",
  Development: "code-slash-outline",
  Business: "briefcase-outline",
  Marketing: "megaphone-outline",
  Photography: "camera-outline",
  Music: "musical-notes-outline",
};

function getCatIcon(cat: any): string {
  return CAT_ICONS[cat.name] ?? cat.icon ?? "folder-outline";
}

export default function Study() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { isBookmarked, toggleBookmark, reload: reloadBookmarks } = useBookmarks();
  const [removeTarget, setRemoveTarget] = useState<BookmarkItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastId, setToastId] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastId((n) => n + 1);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 2000);
  };

  useFocusEffect(useCallback(() => { reloadBookmarks(); }, []));
  // ── Read optional incoming params (from Home category tap) ──
  const params = useLocalSearchParams<{
    categoryId?: string;
    categoryName?: string;
  }>();

  const [allBooks, setAllBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Pre-select if navigated from Home category card
  const [selectedCategory, setSelectedCategory] = useState<number>(
    params.categoryId ? parseInt(params.categoryId) : 0,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest">(
    "popular",
  );

  // If params change (user taps a different category on Home and comes back)
  useEffect(() => {
    if (params.categoryId) {
      setSelectedCategory(parseInt(params.categoryId));
    }
  }, [params.categoryId]);

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
            name: t("study.allCategories"),
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
    } catch {
      // silent — empty list shown
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
    const bookCategoryId = book.categoryId ?? book.category_id;
    const matchesCategory =
      selectedCategory === 0 || bookCategoryId === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (book.title ?? "").toLowerCase().includes(q) ||
      (book.author ?? "").toLowerCase().includes(q) ||
      (book.category ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const sortedBooks = [...filteredBooks].sort((a: any, b: any) => {
    if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    if (sortBy === "popular") return (b.students ?? 0) - (a.students ?? 0);
    return 0;
  });

  const selectedCategoryInfo = categories.find(
    (cat: any) => cat.id === selectedCategory,
  ) as any;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t("study.loadingBooks")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={t("study.title")}
        subtitle={`${filteredBooks.length} ${t("study.booksAvailable")}`}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("study.searchPlaceholder")}
      />

      {/* ─── Filter Row ─── */}
      <View style={[styles.searchSection, { backgroundColor: colors.headerBg }]}>
        <View style={styles.filterRow}>
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
                  name={getCatIcon(selectedCategoryInfo ?? {}) as any}
                  size={18}
                  color={selectedCategoryInfo?.color ?? "#667eea"}
                />
              </View>
              <Text style={styles.categoryDropdownText} numberOfLines={1}>
                {selectedCategoryInfo?.name ?? t("study.allCategories")}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#7c3aed" />
          </TouchableOpacity>

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

      {/* ─── Books Grid ─── */}
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
            <Text style={styles.emptyTitle}>{t("study.noBooks")}</Text>
            <Text style={styles.emptySubtitle}>{t("study.tryAdjusting")}</Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSelectedCategory(0);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>{t("study.clearFilters")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.booksGrid}>
            {sortedBooks.map((book: any, index: number) => (
              <View key={book.id || index} style={styles.bookCardWrapper}>
                <BookCard
                  book={book}
                  index={index}
                  categories={categories}
                  isBookmarked={isBookmarked("book", book.id)}
                  onBookmarkToggle={() => {
                    const item: BookmarkItem = {
                      type: "book",
                      id: String(book.id),
                      title: book.title,
                      subtitle: book.author,
                      meta: book.duration,
                      data: book,
                      savedAt: Date.now(),
                    };
                    if (isBookmarked("book", book.id)) {
                      setRemoveTarget(item);
                    } else {
                      toggleBookmark(item);
                      triggerToast();
                    }
                  }}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BookmarkToast key={toastId} visible={showToast} />

      {/* ─── Remove Bookmark Modal ─── */}
      <Modal
        visible={!!removeTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setRemoveTarget(null)}
      >
        <View style={styles.removeModalOverlay}>
          <TouchableOpacity
            style={styles.removeModalBackdrop}
            activeOpacity={1}
            onPress={() => setRemoveTarget(null)}
          />
          <Animatable.View
            animation="slideInUp"
            duration={280}
            style={[styles.removeModalSheet, { backgroundColor: colors.background }]}
          >
            <View style={styles.removeModalHandle} />
            <View style={styles.removeModalIconWrap}>
              <Ionicons name="bookmark" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.removeModalTitle, { color: colors.text }]}>
              Remove Bookmark
            </Text>
            <Text
              style={[styles.removeModalItemName, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              "{removeTarget?.title}"
            </Text>
            <Text style={[styles.removeModalDesc, { color: colors.textSecondary }]}>
              This item will be removed from your saved bookmarks. You can bookmark it again at any time.
            </Text>
            <TouchableOpacity
              onPress={async () => {
                if (removeTarget) {
                  await toggleBookmark(removeTarget);
                  setRemoveTarget(null);
                }
              }}
              style={styles.removeBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.removeBtnText}>Remove Bookmark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRemoveTarget(null)}
              style={[styles.keepBtn, { backgroundColor: isDark ? "#1e1e30" : "#f3f4f6" }]}
            >
              <Text style={[styles.keepBtnText, { color: colors.textSecondary }]}>Keep it</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>

      {/* ─── Category Modal ─── */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          />
          <Animatable.View
            animation="slideInUp"
            duration={300}
            style={styles.modalSheet}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("study.selectCategory")}</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

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
                          name={getCatIcon(category) as any}
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
                            ? `${allBooks.length} ${t("study.books")}`
                            : `${allBooks.filter((b: any) => (b.categoryId ?? b.category_id) === category.id).length} ${t("study.books")}`}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#4b5563", marginTop: 16, fontSize: 16 },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  flex1: { flex: 1 },

  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerTitle: {
    color: "#1f2937",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 4,
  },
  headerSubtitle: { color: "#6b7280", fontSize: 14, fontWeight: "500" },

  searchSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 12,
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
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: "#1f2937" },
  filterRow: { flexDirection: "row", alignItems: "center" },
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

  booksScrollContent: { padding: 20, paddingBottom: 100 },
  booksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  bookCardWrapper: { width: "48%", marginBottom: GRID_GAP },

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
  clearButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },

  removeModalOverlay: { flex: 1, justifyContent: "flex-end" },
  removeModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  removeModalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: "center",
  },
  removeModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    marginBottom: 24,
  },
  removeModalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  removeModalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6, textAlign: "center" },
  removeModalItemName: { fontSize: 14, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
  removeModalDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 28 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    gap: 8,
    marginBottom: 10,
  },
  removeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  keepBtn: { paddingVertical: 14, borderRadius: 14, width: "100%", alignItems: "center" },
  keepBtnText: { fontSize: 16, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: { flex: 1 },
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
  modalTitle: { color: "#1f2937", fontSize: 20, fontWeight: "900" },
  modalCloseButton: {
    backgroundColor: "#f3f4f6",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalList: { maxHeight: 400 },
  modalListContent: { paddingHorizontal: 24, paddingVertical: 16 },

  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryItemDefault: { backgroundColor: "#f9fafb" },
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
  categoryItemName: { fontWeight: "700", fontSize: 16, color: "#1f2937" },
  categoryItemNameSelected: { color: "#6d28d9" },
  categoryItemCount: { color: "#6b7280", fontSize: 12, marginTop: 2 },
});
