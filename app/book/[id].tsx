// app/book/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import RenderHtml from "react-native-render-html";

export default function BookReader() {
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();

  // Parse book from params
  let book = null;

  if (params.book) {
    try {
      book = JSON.parse(params.book as string);
    } catch (error) {
      console.error("Error parsing book:", error);
    }
  }

  const [activeTab, setActiveTab] = useState<"chapters" | "details">(
    "chapters",
  );

  if (!book) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>Book not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.emptyStateButton}
          >
            <Text style={styles.emptyStateButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share-outline" size={22} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.iconButtonML]}>
              <Ionicons name="bookmark-outline" size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Book Cover & Info */}
        <Animatable.View animation="fadeIn" style={styles.bookInfoSection}>
          <View style={styles.bookInfoRow}>
            {/* Book Cover */}
            <View style={styles.coverWrapper}>
              <Image source={{ uri: book.cover }} style={styles.coverImage} />
            </View>

            {/* Book Details */}
            <View style={styles.bookDetails}>
              <View>
                <Text style={styles.bookTitle} numberOfLines={3}>
                  {book.title}
                </Text>
                <Text style={styles.bookAuthor}>by {book.author}</Text>

                {/* Rating */}
                <View style={styles.ratingRow}>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={14}
                        color={
                          star <= Math.round(book.rating)
                            ? "#fbbf24"
                            : "#E5E7EB"
                        }
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>
                    {book.rating ? book.rating.toFixed(1) : "N/A"}
                  </Text>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={styles.statsRow}>
                <View style={[styles.statBadge, styles.statBadgePurple]}>
                  <Text style={styles.statBadgePurpleText}>
                    {book.pages} Pages
                  </Text>
                </View>
                <View style={[styles.statBadge, styles.statBadgeGreen]}>
                  <Text style={styles.statBadgeGreenText}>{book.duration}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Start Reading Button */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/reader/[bookId]",
                params: {
                  bookId: book.id,
                  book: JSON.stringify(book), // Pass full book
                },
              });
            }}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Ionicons name="book-outline" size={24} color="white" />
              <Text style={styles.ctaText}>Start Reading</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsSection}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setActiveTab("chapters")}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.tabInner,
                  activeTab === "chapters" && styles.tabInnerActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "chapters"
                      ? styles.tabTextActive
                      : styles.tabTextInactive,
                  ]}
                >
                  Chapters
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("details")}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.tabInner,
                  activeTab === "details" && styles.tabInnerActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "details"
                      ? styles.tabTextActive
                      : styles.tabTextInactive,
                  ]}
                >
                  Details
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chapters Tab */}
        {activeTab === "chapters" && (
          <View style={styles.emptyChapters}>
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyChaptersText}>No chapters available</Text>
          </View>
        )}

        {/* Details Tab */}
        {activeTab === "details" && (
          <View style={styles.detailsSection}>
            {/* About this book */}
            {book.description && (
              <Animatable.View animation="fadeIn" style={styles.detailsCard}>
                <Text style={styles.detailsCardTitle}>About this book</Text>
                <RenderHtml
                  contentWidth={width - 88}
                  source={{ html: book.description }}
                  baseStyle={{
                    fontSize: 14,
                    lineHeight: 24,
                    color: "#4b5563",
                  }}
                  tagsStyles={{
                    p: { marginBottom: 12 },
                    h1: {
                      fontSize: 18,
                      fontWeight: "bold",
                      marginTop: 12,
                      marginBottom: 8,
                    },
                    h2: {
                      fontSize: 16,
                      fontWeight: "bold",
                      marginTop: 10,
                      marginBottom: 6,
                    },
                    ul: { marginBottom: 12 },
                    ol: { marginBottom: 12 },
                  }}
                />
              </Animatable.View>
            )}

            {/* Book Information */}
            <Animatable.View
              animation="fadeIn"
              delay={100}
              style={styles.detailsCard}
            >
              <Text style={styles.detailsCardTitle}>Book Information</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{book.category}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Difficulty</Text>
                <Text style={styles.infoValue}>{book.difficulty}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pages</Text>
                <Text style={styles.infoValue}>{book.pages}</Text>
              </View>
              <View style={styles.infoRowLast}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{book.duration}</Text>
              </View>
            </Animatable.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { paddingBottom: 120 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9ca3af",
    marginTop: 16,
  },
  emptyStateButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#7c3aed",
    borderRadius: 16,
  },
  emptyStateButtonText: { color: "#ffffff", fontWeight: "700" },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerActions: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    backgroundColor: "#f3f4f6",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonML: { marginLeft: 8 },
  bookInfoSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  bookInfoRow: { flexDirection: "row" },
  coverWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  coverImage: { width: 128, height: 192 },
  bookDetails: { flex: 1, justifyContent: "space-between", paddingVertical: 8 },
  bookTitle: {
    color: "#1f2937",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
    marginBottom: 8,
  },
  bookAuthor: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  starsRow: { flexDirection: "row", alignItems: "center" },
  ratingText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  statsRow: { flexDirection: "row", marginTop: 12 },
  statBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statBadgePurple: { backgroundColor: "#f5f3ff", marginRight: 8 },
  statBadgePurpleText: { color: "#7c3aed", fontSize: 12, fontWeight: "700" },
  statBadgeGreen: { backgroundColor: "#f0fdf4" },
  statBadgeGreenText: { color: "#16a34a", fontSize: 12, fontWeight: "700" },
  ctaSection: { paddingHorizontal: 24, marginBottom: 24, marginTop: 16 },
  ctaGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: { color: "#ffffff", fontWeight: "900", fontSize: 18, marginLeft: 8 },
  tabsSection: { paddingHorizontal: 24, marginBottom: 16 },
  tabBar: {
    backgroundColor: "#f3f4f6",
    padding: 4,
    borderRadius: 16,
    flexDirection: "row",
  },
  tabItem: { flex: 1 },
  tabInner: { paddingVertical: 12, borderRadius: 12 },
  tabInnerActive: { backgroundColor: "#ffffff" },
  tabText: { textAlign: "center", fontWeight: "700", fontSize: 14 },
  tabTextActive: { color: "#7c3aed" },
  tabTextInactive: { color: "#6b7280" },
  emptyChapters: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyChaptersText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
  },
  detailsSection: { paddingHorizontal: 24 },
  detailsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  detailsCardTitle: {
    color: "#1f2937",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    marginBottom: 4,
  },
  infoRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoLabel: { color: "#6b7280", fontWeight: "600", fontSize: 14 },
  infoValue: { color: "#1f2937", fontWeight: "700", fontSize: 14 },
});
