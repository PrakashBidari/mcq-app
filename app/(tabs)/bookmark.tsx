// app/(tabs)/bookmark.tsx
import AppHeader from "@/components/AppHeader";
import { API_URL } from "@/config/constants";
import { BookmarkItem, useBookmarks } from "@/hooks/useBookmarks";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";

type TabId = "all" | "books" | "quizzes";

const CAT_ICONS: Record<string, string> = {
  Design: "color-palette-outline",
  Development: "code-slash-outline",
  Business: "briefcase-outline",
  Marketing: "megaphone-outline",
  Photography: "camera-outline",
  Music: "musical-notes-outline",
};

function getCatIcon(name?: string, fallback = "folder-outline"): string {
  return (name && CAT_ICONS[name]) ? CAT_ICONS[name] : fallback;
}

export default function BookmarkScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { bookmarks, removeBookmark, reload: reloadBookmarks } = useBookmarks();

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<BookmarkItem | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  useFocusEffect(useCallback(() => { reloadBookmarks(); }, []));

  const books = bookmarks.filter((b) => b.type === "book");
  const quizzes = bookmarks.filter((b) => b.type === "quiz");

  const q = searchQuery.toLowerCase().trim();
  const filteredBooks = q
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.subtitle ?? "").toLowerCase().includes(q),
      )
    : books;
  const filteredQuizzes = q
    ? quizzes.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.subtitle ?? "").toLowerCase().includes(q),
      )
    : quizzes;
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: t("bookmark.all"), count: bookmarks.length },
    { id: "books", label: t("bookmark.books"), count: books.length },
    { id: "quizzes", label: t("bookmark.quizzes"), count: quizzes.length },
  ];

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    await removeBookmark(removeTarget.type, removeTarget.id);
    setRemoveTarget(null);
  };

  const startQuiz = async (setId: number) => {
    setQuizLoading(true);
    try {
      const res = await fetch(`${API_URL}/question-set/${setId}`);
      const data = await res.json();
      if (data.success && data.data.questions.length > 0) {
        router.push({
          pathname: "/quiz/play",
          params: {
            questions: JSON.stringify(data.data.questions),
            total: data.data.questions.length,
            timeLimit: data.data.set?.time_limit ?? 0,
          },
        });
      } else {
        Alert.alert("Error", "No questions found for this set.");
      }
    } catch {
      Alert.alert("Error", "Failed to load questions.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSetAction = (item: BookmarkItem) => {
    const set = item.data;
    if (!set) return;
    startQuiz(set.id);
  };

  const renderBookItem = (item: BookmarkItem) => (
    <Animatable.View
      key={`book-${item.id}`}
      animation="fadeInUp"
      duration={300}
      style={styles.card}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/book/[id]",
            params: { id: item.id, book: JSON.stringify(item.data) },
          })
        }
        style={[styles.bookCard, { backgroundColor: colors.card }]}
      >
        <View
          style={[
            styles.bookCover,
            { backgroundColor: item.data?.categoryColor ?? "#667eea" },
          ]}
        >
          <Ionicons
            name={getCatIcon(item.data?.category, "book-outline") as any}
            size={24}
            color="#fff"
          />
        </View>

        <View style={styles.bookInfo}>
          <Text
            style={[styles.bookTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text
              style={[styles.bookSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          ) : null}
          <View style={styles.bookMeta}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.bookMetaText, { color: colors.textMuted }]}>
              {timeAgo(item.savedAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setRemoveTarget(item)}
          style={styles.bookmarkIconBtn}
        >
          <Ionicons name="bookmark" size={22} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderQuizItem = (item: BookmarkItem) => {
    const catColor = item.data?.categoryColor ?? "#667eea";
    return (
      <Animatable.View
        key={`quiz-${item.id}`}
        animation="fadeInUp"
        duration={300}
        style={styles.card}
      >
        <View style={[styles.quizCard, { backgroundColor: colors.card }]}>
          <View
            style={[styles.quizCardTop, { backgroundColor: catColor + "15" }]}
          >
            <View style={[styles.quizIcon, { backgroundColor: catColor }]}>
              <Ionicons
                name={getCatIcon(item.data?.categoryName, "help-circle-outline") as any}
                size={24}
                color="#fff"
              />
            </View>
            <View style={styles.quizInfo}>
              <Text
                style={[styles.quizTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text
                  style={[
                    styles.quizSubtitle,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              ) : null}
              {item.meta ? (
                <View style={styles.quizMetaRow}>
                  <Ionicons
                    name="help-circle-outline"
                    size={12}
                    color={colors.textMuted}
                  />
                  <Text
                    style={[styles.quizMetaText, { color: colors.textMuted }]}
                  >
                    {item.meta}
                  </Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => setRemoveTarget(item)}
              style={styles.bookmarkIconBtn}
            >
              <Ionicons name="bookmark" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <View style={[styles.quizCardBottom, { borderTopColor: colors.border }]}>
            <Text style={[styles.quizSavedAt, { color: colors.textMuted }]}>
              {timeAgo(item.savedAt)}
            </Text>
            <View style={styles.quizCardActions}>
              <TouchableOpacity
                onPress={() => handleSetAction(item)}
                disabled={quizLoading}
                style={[styles.quizStartBtn, { backgroundColor: catColor }]}
              >
                {quizLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="play-circle-outline" size={14} color="#fff" />
                    <Text style={styles.quizStartText}>Play</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animatable.View>
    );
  };

  const totalBookmarks = bookmarks.length;

  const hasAnyResults =
    activeTab === "all"
      ? filteredBooks.length > 0 || filteredQuizzes.length > 0
      : activeTab === "books"
        ? filteredBooks.length > 0
        : filteredQuizzes.length > 0;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={[]}
    >
      <StatusBar barStyle="light-content" />
      <AppHeader
        title={t("bookmark.title")}
        subtitle={`${totalBookmarks} ${t("bookmark.saved")} ${
          totalBookmarks === 1 ? t("bookmark.item") : t("bookmark.items")
        }`}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("bookmark.searchPlaceholder")}
      />

      {/* Tabs */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === tab.id && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === tab.id && styles.tabBadgeTextActive,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {totalBookmarks === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="bookmarks-outline" size={48} color="#c084fc" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("bookmark.noBookmarks")}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              {t("bookmark.noBookmarksDesc")}
            </Text>
          </View>
        ) : !hasAnyResults ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#d1d5db" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No results
            </Text>
          </View>
        ) : activeTab === "all" ? (
          <View>
            {/* ── Books section ── */}
            {filteredBooks.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: "#667eea20" }]}>
                    <Ionicons name="book-outline" size={14} color="#667eea" />
                  </View>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Books</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: isDark ? "#2d1f4e" : "#ede9fe" }]}>
                    <Text style={[styles.sectionBadgeText, { color: "#7c3aed" }]}>{filteredBooks.length}</Text>
                  </View>
                </View>
                {filteredBooks.map((item) => renderBookItem(item))}
              </>
            )}

            {/* ── Divider ── */}
            {filteredBooks.length > 0 && filteredQuizzes.length > 0 && (
              <View style={styles.sectionDivider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <View style={[styles.dividerPill, { backgroundColor: isDark ? "#1e1e30" : "#f3f4f6" }]}>
                  <Ionicons name="help-circle-outline" size={13} color={isDark ? "#a855f7" : "#7c3aed"} />
                  <Text style={[styles.dividerText, { color: isDark ? "#a855f7" : "#7c3aed" }]}>Question Set</Text>
                </View>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>
            )}

            {/* ── Question Sets section (when only quizzes) ── */}
            {filteredQuizzes.length > 0 && filteredBooks.length === 0 && (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: "#7c3aed20" }]}>
                  <Ionicons name="help-circle-outline" size={14} color="#7c3aed" />
                </View>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Question Set</Text>
                <View style={[styles.sectionBadge, { backgroundColor: isDark ? "#2d1f4e" : "#ede9fe" }]}>
                  <Text style={[styles.sectionBadgeText, { color: "#7c3aed" }]}>{filteredQuizzes.length}</Text>
                </View>
              </View>
            )}
            {filteredQuizzes.map((item) => renderQuizItem(item))}
          </View>
        ) : activeTab === "books" ? (
          <View>{filteredBooks.map((item) => renderBookItem(item))}</View>
        ) : (
          <View>{filteredQuizzes.map((item) => renderQuizItem(item))}</View>
        )}
      </ScrollView>


      {/* Remove Confirmation Modal */}
      <Modal
        visible={!!removeTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setRemoveTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setRemoveTarget(null)}
          />
          <Animatable.View
            animation="slideInUp"
            duration={280}
            style={[styles.modalSheet, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalIconWrap}>
              <Ionicons name="bookmark" size={32} color="#ef4444" />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Remove Bookmark
            </Text>
            <Text
              style={[styles.modalItemName, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              "{removeTarget?.title}"
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
              This item will be removed from your saved bookmarks. You can
              bookmark it again at any time.
            </Text>

            <TouchableOpacity
              onPress={handleRemoveConfirm}
              style={styles.removeBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.removeBtnText}>Remove Bookmark</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRemoveTarget(null)}
              style={[
                styles.cancelBtn,
                { backgroundColor: isDark ? "#1e1e30" : "#f3f4f6" },
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Keep it
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: "#7c3aed" },
  tabLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  tabLabelActive: { color: "#fff" },
  tabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    minWidth: 18,
    alignItems: "center",
  },
  tabBadgeActive: { backgroundColor: "#6d28d9" },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: "#6b7280" },
  tabBadgeTextActive: { color: "#fff" },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },

  card: { marginBottom: 12 },

  // Section headers & divider
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionBadgeText: { fontSize: 11, fontWeight: "700" },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginHorizontal: 10,
    gap: 4,
  },
  dividerText: { fontSize: 12, fontWeight: "700" },

  // Book card
  bookCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bookCover: {
    width: 56,
    height: 70,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bookInfo: { flex: 1, marginLeft: 12 },
  bookTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  bookSubtitle: { fontSize: 12, marginBottom: 6 },
  bookMeta: { flexDirection: "row", alignItems: "center" },
  bookMetaText: { fontSize: 11, marginLeft: 4 },
  bookmarkIconBtn: { padding: 8 },

  // Quiz card
  quizCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quizCardTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  quizIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quizInfo: { flex: 1, marginLeft: 12 },
  quizTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  quizSubtitle: { fontSize: 12, marginBottom: 4 },
  quizMetaRow: { flexDirection: "row", alignItems: "center" },
  quizMetaText: { fontSize: 11, marginLeft: 4 },
  quizCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  quizSavedAt: { fontSize: 11 },
  quizCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quizStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    justifyContent: "center",
  },
  quizStartText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // Empty
  emptyState: { alignItems: "center", paddingTop: 80, paddingBottom: 40 },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#faf5ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },

  // Payment Modal
  payModalOverlay: { flex: 1, justifyContent: "flex-end" },
  payModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  payModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  payModalHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  payModalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  payModalTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 10 },
  payModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  payModalInfo: {
    padding: 10,
    borderRadius: 10,
  },
  payModalSetName: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  payModalPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  payModalPriceLabel: { fontSize: 13 },
  payModalPriceValue: { fontSize: 18, fontWeight: "900", color: "#7c3aed" },
  payModalBody: { alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  payModalIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  payModalComingTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4, textAlign: "center" },
  payModalComingSub: { fontSize: 15, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  payModalComingMsg: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  payModalPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
    paddingVertical: 13,
    borderRadius: 12,
    width: "100%",
    gap: 8,
    marginBottom: 10,
  },
  payModalPlayText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  payModalCancelBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  payModalCancelText: { fontSize: 15, fontWeight: "600" },

  // Remove Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: "center",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    marginBottom: 24,
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  modalItemName: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
    fontStyle: "italic",
  },
  modalDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
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
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 16, fontWeight: "600" },
});
