// app/blog/[slug].tsx
import AppBottomTabBar from "@/components/AppBottomTabBar";
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useEditorFonts } from "@/utils/editorFonts";
import { normalizeEditorLineHeights } from "@/utils/editorHtml";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BlogDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { token } = useAuth();

  // Parse blog from params
  const blog = useMemo(() => {
    if (!params.blog) return null;
    try {
      return JSON.parse(params.blog as string);
    } catch {
      return null; // error state rendered below
    }
  }, [params.blog]);

  const [stats, setStats] = useState({
    likes: Number(blog?.likes ?? 0),
    views: Number(blog?.views ?? 0),
    liked: false,
  });
  const [liking, setLiking] = useState(false);
  const contentHtml = useMemo(
    () =>
      normalizeEditorLineHeights(blog?.content ?? "", {
        fontSize: 16,
        lineHeight: 28,
        tagFontSizes: { h1: 24, h2: 20, h3: 18 },
      }),
    [blog?.content],
  );
  const { html: contentHtmlWithFonts, systemFonts } = useEditorFonts(contentHtml);
  const viewCounted = useRef<number | null>(null);

  // Count one view per opening of the blog; also tells us if this user already liked it.
  useEffect(() => {
    if (!blog?.id || viewCounted.current === blog.id) return;
    viewCounted.current = blog.id;
    fetch(`${API_URL}/blogs/${blog.id}/view`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((json) => { if (json?.success) setStats(json.data); })
      .catch(() => {});
  }, [blog?.id, token]);

  const toggleLike = async () => {
    if (!blog?.id || liking) return;
    if (!token) {
      Alert.alert(t("blog.loginToLike"), t("blog.loginToLikeMessage"), [
        { text: t("quiz.cancel"), style: "cancel" },
        { text: t("auth.login.signIn"), onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }
    // Optimistic update, rolled back if the request fails.
    const prev = stats;
    setStats({ ...prev, liked: !prev.liked, likes: Math.max(0, prev.likes + (prev.liked ? -1 : 1)) });
    setLiking(true);
    try {
      const res = await fetch(`${API_URL}/blogs/${blog.id}/like`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error();
      setStats(json.data);
    } catch {
      setStats(prev);
    } finally {
      setLiking(false);
    }
  };

  if (!blog) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="document-text-outline" size={40} color="#9ca3af" />
        </View>
        <Text className="text-gray-900 font-bold text-lg mb-2">
          {t("blog.blogNotFound")}
        </Text>
        <Text className="text-gray-500 text-sm mb-4">
          {t("blog.unableToLoad")}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 py-3 bg-purple-600 rounded-xl"
        >
          <Text className="text-white font-bold">{t("blog.goBack")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>

          <View className="flex-row gap-2">
            <TouchableOpacity
              className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
              onPress={() =>
                Share.share({ message: blog.title ?? "" })
              }
            >
              <Ionicons name="share-outline" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Cover Image */}
        {!!blog.image && (
          <Image
            source={{ uri: blog.image }}
            className="w-full h-64 bg-gray-100"
            resizeMode="contain"
          />
        )}

        {/* Content */}
        <View className="px-6 py-6">
          {/* Category & Read Time */}
          <View className="flex-row items-center gap-3 mb-4">
            <View className="bg-purple-100 px-3 py-1.5 rounded-lg">
              <Text className="text-purple-700 text-xs font-bold">
                {blog.category}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text className="text-gray-500 text-xs ml-1">
                {blog.readTime}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-gray-900 text-2xl font-black mb-3 leading-tight">
            {blog.title}
          </Text>

          {/* Author & Date */}
          <View className="flex-row items-center justify-between mb-6 pb-6 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                <Text className="text-purple-700 font-bold">
                  {blog.author.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="text-gray-900 font-bold text-sm">
                  {blog.author}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {blog.publishedAt || "Recently"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={toggleLike}
                disabled={liking}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="flex-row items-center"
              >
                {liking ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons
                    name={stats.liked ? "heart" : "heart-outline"}
                    size={18}
                    color={stats.liked ? "#ef4444" : "#9ca3af"}
                  />
                )}
                <Text className={`text-sm ml-1 ${stats.liked ? "text-red-500 font-bold" : "text-gray-500"}`}>
                  {stats.likes}
                </Text>
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={18} color="#9ca3af" />
                <Text className="text-gray-500 text-sm ml-1">{stats.views}</Text>
              </View>
            </View>
          </View>

          {/* Excerpt */}
          <Text className="text-gray-700 text-base leading-7 mb-6 italic">
            {blog.excerpt}
          </Text>

          {/* HTML Content */}
          <RenderHtml
            contentWidth={width - 48}
            // React 19 ignores render-html's defaultProps, so these must be set here or
            // the editor's inline styles (align, size, color, font...) are dropped.
            enableCSSInlineProcessing
            enableUserAgentStyles
            source={{ html: contentHtmlWithFonts }}
            systemFonts={systemFonts}
            baseStyle={{
              fontSize: 16,
              lineHeight: 28,
              color: "#374151",
            }}
            tagsStyles={{
              h1: {
                fontSize: 24,
                fontWeight: "bold",
                color: "#1f2937",
                marginTop: 20,
                marginBottom: 12,
              },
              h2: {
                fontSize: 20,
                fontWeight: "bold",
                color: "#1f2937",
                marginTop: 18,
                marginBottom: 10,
              },
              h3: {
                fontSize: 18,
                fontWeight: "bold",
                color: "#1f2937",
                marginTop: 16,
                marginBottom: 8,
              },
              p: {
                marginBottom: 16,
                lineHeight: 28,
              },
              a: {
                color: "#7c3aed",
                textDecorationLine: "underline",
              },
              ul: {
                marginBottom: 16,
              },
              ol: {
                marginBottom: 16,
              },
              li: {
                marginBottom: 8,
              },
              blockquote: {
                borderLeftWidth: 4,
                borderLeftColor: "#7c3aed",
                paddingLeft: 16,
                marginLeft: 0,
                marginBottom: 16,
                fontStyle: "italic",
                color: "#6b7280",
              },
            }}
          />
        </View>

        {/* Related Articles Section (Optional) */}
        <View className="px-6 py-6 bg-gray-50 mt-6">
          <Text className="text-gray-900 font-bold text-lg mb-4">
            {t("blog.moreFrom")} {blog.category}
          </Text>
          <Text className="text-gray-500 text-sm">
            {t("blog.relatedArticles")}
          </Text>
        </View>
      </ScrollView>
      <AppBottomTabBar />
    </SafeAreaView>
  );
}
