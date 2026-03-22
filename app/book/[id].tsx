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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          {/* FIX: gap → marginLeft on second button */}
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
        {/* ─── Book Cover & Info ─── */}
        {/* FIX: className on Animatable.View → style prop */}
        <Animatable.View animation="fadeIn" style={styles.bookInfoSection}>
          {/* FIX: gap → marginRight on cover wrapper */}
          <View style={styles.bookInfoRow}>
            {/* Book Cover */}
            {/* FIX: Image rounded corners need overflow:hidden on wrapping View */}
            {/* FIX: Image dimensions via style, not className (w-32 h-48) */}
            <View style={styles.coverWrapper}>
              <Image
                source={{ uri: cover as string }}
                style={styles.coverImage}
              />
            </View>

            {/* Book Details */}
            <View style={styles.bookDetails}>
              <View>
                <Text style={styles.bookTitle} numberOfLines={3}>
                  {title}
                </Text>
                <Text style={styles.bookAuthor}>by {author}</Text>

                {/* Rating */}
                {/* FIX: gap → marginLeft on rating text */}
                <View style={styles.ratingRow}>
                  <View style={styles.starsRow}>
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
                  <Text style={styles.ratingText}>
                    {rating ? parseFloat(rating as string).toFixed(1) : "N/A"}
                  </Text>
                </View>

                {description ? (
                  <Text style={styles.bookDescription} numberOfLines={2}>
                    {description}
                  </Text>
                ) : null}
              </View>

              {/* Quick Stats */}
              {/* FIX: gap → marginRight on first badge */}
              <View style={styles.statsRow}>
                <View style={[styles.statBadge, styles.statBadgePurple]}>
                  <Text style={styles.statBadgePurpleText}>
                    {pages ? `${pages} Pages` : "No Pages Info"}
                  </Text>
                </View>
                <View style={[styles.statBadge, styles.statBadgeGreen]}>
                  <Text style={styles.statBadgeGreenText}>
                    {duration ? duration : "No Duration"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* ─── Start Reading Button ─── */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/reader/[bookId]",
                params: {
                  bookId: id,
                  chapterId: 1,
                  rating,
                  title,
                  duration,
                  difficulty,
                  description,
                },
              });
            }}
          >
            {/* FIX: layout className on LinearGradient → style prop */}
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

        {/* ─── Tabs ─── */}
        <View style={styles.tabsSection}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setActiveTab("chapters")}
              style={styles.tabItem}
            >
              {/* FIX: conditional className → conditional style array */}
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

        {/* ─── Chapters Tab ─── */}
        {activeTab === "chapters" && (
          <View style={styles.emptyChapters}>
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyChaptersText}>No chapters available</Text>
          </View>
        )}

        {/* ─── Details Tab ─── */}
        {activeTab === "details" && (
          <View style={styles.detailsSection}>
            {/* FIX: className on Animatable.View → style prop */}
            <Animatable.View animation="fadeIn" style={styles.detailsCard}>
              <Text style={styles.detailsCardTitle}>About this book</Text>
              <Text style={styles.detailsCardBody}>
                {description || "No description available for this book."}
              </Text>
            </Animatable.View>

            <Animatable.View
              animation="fadeIn"
              delay={100}
              style={styles.detailsCard}
            >
              <Text style={styles.detailsCardTitle}>Book Information</Text>

              {/* FIX: space-y-3 (unsupported) → marginBottom on each row */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{category || "N/A"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Difficulty</Text>
                <Text style={styles.infoValue}>{difficulty || "N/A"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pages</Text>
                <Text style={styles.infoValue}>{pages || "N/A"}</Text>
              </View>
              {/* Last row — no border */}
              <View style={styles.infoRowLast}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{duration || "N/A"}</Text>
              </View>
            </Animatable.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // ── Header ──
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "#f3f4f6",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  // FIX: gap → explicit marginLeft
  iconButtonML: {
    marginLeft: 8,
  },

  // ── Book info ──
  bookInfoSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  // FIX: gap → marginRight on cover
  bookInfoRow: {
    flexDirection: "row",
  },
  // FIX: borderRadius + overflow:hidden on wrapping View for Image
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
  // FIX: Image size via style (w-32 h-48 → 128×192)
  coverImage: {
    width: 128,
    height: 192,
  },
  bookDetails: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  bookTitle: {
    color: "#1f2937",
    fontSize: 20,
    // FIX: font-black → "900"
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
  // FIX: gap → marginLeft on rating value text
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  bookDescription: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 20,
  },
  // FIX: gap → marginRight on first badge
  statsRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statBadgePurple: {
    backgroundColor: "#f5f3ff",
    marginRight: 8,
  },
  statBadgePurpleText: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "700",
  },
  statBadgeGreen: {
    backgroundColor: "#f0fdf4",
  },
  statBadgeGreenText: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── CTA ──
  ctaSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
    marginTop: 16,
  },
  // FIX: layout className on LinearGradient → style prop
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
  ctaText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 18,
    marginLeft: 8,
  },

  // ── Tabs ──
  tabsSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tabBar: {
    backgroundColor: "#f3f4f6",
    padding: 4,
    borderRadius: 16,
    flexDirection: "row",
  },
  tabItem: {
    flex: 1,
  },
  tabInner: {
    paddingVertical: 12,
    borderRadius: 12,
  },
  // FIX: conditional bg-white via style object
  tabInnerActive: {
    backgroundColor: "#ffffff",
  },
  tabText: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
  },
  // FIX: conditional text-purple-600 / text-gray-500 via style objects
  tabTextActive: {
    color: "#7c3aed",
  },
  tabTextInactive: {
    color: "#6b7280",
  },

  // ── Empty Chapters ──
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

  // ── Details Tab ──
  detailsSection: {
    paddingHorizontal: 24,
  },
  // FIX: className on Animatable.View → style prop
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
  detailsCardBody: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 24,
  },

  // FIX: space-y-3 is not supported in RN — use marginBottom on rows
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
  infoLabel: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 14,
  },
  infoValue: {
    color: "#1f2937",
    fontWeight: "700",
    fontSize: 14,
  },
});
