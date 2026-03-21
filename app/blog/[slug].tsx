// app/blog/[slug].tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import blog data
import blogsData from "@/assets/data/blogs.json";

const { width } = Dimensions.get("window");

export default function BlogDetailScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Find the blog post
  const blog = blogsData.find((b) => b.slug === slug);

  if (!blog) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-900 text-lg font-bold">Blog not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-purple-600 font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Get related blogs (same category, excluding current)
  const relatedBlogs = blogsData
    .filter((b) => b.category === blog.category && b.id !== blog.id)
    .slice(0, 4);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${blog.title}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Parse content into sections
  const contentSections = blog.content.split("\n\n");

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Image */}
        <View className="relative">
          <Image
            source={{ uri: blog.image }}
            style={{ width, height: 300 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent"]}
            className="absolute inset-0"
          />

          {/* Header Buttons */}
          <SafeAreaView className="absolute top-0 left-0 right-0">
            <View className="flex-row items-center justify-between px-6">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 bg-white/90 rounded-full items-center justify-center"
              >
                <Ionicons name="arrow-back" size={22} color="#374151" />
              </TouchableOpacity>

              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setIsBookmarked(!isBookmarked)}
                  className="w-10 h-10 bg-white/90 rounded-full items-center justify-center"
                >
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={20}
                    color="#7c3aed"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShare}
                  className="w-10 h-10 bg-white/90 rounded-full items-center justify-center"
                >
                  <Ionicons name="share-outline" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View className="px-6 py-6">
          {/* Category Badge */}
          <View className="flex-row items-center mb-4">
            <View className="bg-purple-50 px-3 py-1.5 rounded-lg">
              <Text className="text-purple-600 text-sm font-semibold">
                {blog.category}
              </Text>
            </View>
            <View className="flex-row items-center ml-3">
              <Ionicons name="time-outline" size={16} color="#9ca3af" />
              <Text className="text-gray-400 text-sm ml-1">
                {blog.readTime}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-gray-900 text-3xl font-bold mb-4 leading-tight">
            {blog.title}
          </Text>

          {/* Author Info */}
          <View className="flex-row items-center justify-between mb-6 pb-6 border-b border-gray-100">
            <View className="flex-row items-center flex-1">
              <Image
                source={{ uri: blog.author.avatar }}
                className="w-12 h-12 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="text-gray-900 text-base font-bold">
                  {blog.author.name}
                </Text>
                <Text className="text-gray-500 text-sm">{blog.author.bio}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row items-center gap-6 mb-8 pb-6 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={20} color="#6b7280" />
              <Text className="text-gray-600 text-sm font-medium ml-2">
                {blog.views.toLocaleString()} views
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsLiked(!isLiked)}
              className="flex-row items-center"
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? "#ef4444" : "#6b7280"}
              />
              <Text className="text-gray-600 text-sm font-medium ml-2">
                {blog.likes + (isLiked ? 1 : 0)} likes
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text className="text-gray-600 text-sm font-medium ml-2">
                {new Date(blog.publishedDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

          {/* Article Content */}
          <View className="mb-8">
            {contentSections.map((section, index) => {
              // Check if it's a heading
              if (section.startsWith("## ")) {
                return (
                  <Text
                    key={index}
                    className="text-gray-900 text-xl font-bold mt-6 mb-3"
                  >
                    {section.replace("## ", "")}
                  </Text>
                );
              }
              // Check if it's a subheading
              if (section.startsWith("### ")) {
                return (
                  <Text
                    key={index}
                    className="text-gray-900 text-lg font-bold mt-4 mb-2"
                  >
                    {section.replace("### ", "")}
                  </Text>
                );
              }
              // Regular paragraph
              return (
                <Text
                  key={index}
                  className="text-gray-700 text-base leading-7 mb-4"
                >
                  {section}
                </Text>
              );
            })}
          </View>

          {/* Tags */}
          <View className="mb-8 pb-8 border-b border-gray-100">
            <Text className="text-gray-900 font-bold text-lg mb-3">Tags</Text>
            <View className="flex-row flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
                <View key={index} className="bg-gray-100 px-3 py-2 rounded-lg">
                  <Text className="text-gray-700 text-sm font-medium">
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Related Blogs */}
          {relatedBlogs.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 font-bold text-xl">
                  Related Articles
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/blog")}
                  className="flex-row items-center"
                >
                  <Text className="text-purple-600 font-semibold text-sm mr-1">
                    View All
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {relatedBlogs.map((relatedBlog) => (
                  <TouchableOpacity
                    key={relatedBlog.id}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/blog/${relatedBlog.slug}`)}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                    style={{
                      width: 280,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <Image
                      source={{ uri: relatedBlog.image }}
                      className="w-full h-36"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <View className="bg-purple-50 px-2 py-1 rounded-md self-start mb-2">
                        <Text className="text-purple-600 text-xs font-semibold">
                          {relatedBlog.category}
                        </Text>
                      </View>
                      <Text
                        className="text-gray-900 font-bold text-base mb-2"
                        numberOfLines={2}
                      >
                        {relatedBlog.title}
                      </Text>
                      <Text
                        className="text-gray-600 text-sm mb-3"
                        numberOfLines={2}
                      >
                        {relatedBlog.excerpt}
                      </Text>
                      <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                        <Text className="text-gray-400 text-xs">
                          {relatedBlog.readTime}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons
                            name="heart-outline"
                            size={14}
                            color="#9ca3af"
                          />
                          <Text className="text-gray-400 text-xs ml-1">
                            {relatedBlog.likes}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
