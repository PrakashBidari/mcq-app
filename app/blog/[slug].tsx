// app/blog/[slug].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BlogDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();

  // Parse blog from params
  let blog = null;

  if (params.blog) {
    try {
      blog = JSON.parse(params.blog as string);
    } catch (error) {
      console.error("Error parsing blog:", error);
    }
  }

  console.log("Blog params:", params);
  console.log("Parsed blog:", blog);

  if (!blog) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="document-text-outline" size={40} color="#9ca3af" />
        </View>
        <Text className="text-gray-900 font-bold text-lg mb-2">
          Blog not found
        </Text>
        <Text className="text-gray-500 text-sm mb-4">
          Unable to load blog content
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 py-3 bg-purple-600 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
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
            <TouchableOpacity className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
              <Ionicons name="bookmark-outline" size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
              <Ionicons name="share-outline" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Cover Image */}
        <Image
          source={{ uri: blog.image }}
          className="w-full h-64"
          resizeMode="cover"
        />

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
              <View className="flex-row items-center">
                <Ionicons name="heart-outline" size={18} color="#9ca3af" />
                <Text className="text-gray-500 text-sm ml-1">{blog.likes}</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={18} color="#9ca3af" />
                <Text className="text-gray-500 text-sm ml-1">{blog.views}</Text>
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
            source={{ html: blog.content }}
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
            More from {blog.category}
          </Text>
          <Text className="text-gray-500 text-sm">
            Related articles will appear here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
