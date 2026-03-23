// app/blog/index.tsx
import { API_URL } from "@/config/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BlogListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blogsData, setBlogsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch blogs from API
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching from:", `${API_URL}/blogs`); // ← Add this
      const response = await fetch(`${API_URL}/blogs`);
      const data = await response.json();

      if (data.success) {
        setBlogsData(data.data);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBlogs();
    setRefreshing(false);
  };

  // Get unique categories
  const categories = [
    "All",
    ...Array.from(new Set(blogsData.map((blog: any) => blog.category))),
  ];

  // Filter blogs
  const filteredBlogs = blogsData.filter((blog: any) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-600 mt-4 text-base">Loading blogs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Blog</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View className="bg-gray-50 rounded-xl flex-row items-center px-4 py-3">
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search articles..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-base text-gray-900"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Compact Categories - Scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 8,
          gap: 8,
        }}
        style={{ maxHeight: 50 }}
      >
        {categories.map((category) => {
          const count =
            category === "All"
              ? blogsData.length
              : blogsData.filter((b: any) => b.category === category).length;

          return (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg ${
                selectedCategory === category ? "bg-purple-600" : "bg-gray-50"
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text
                  className={`text-xs font-semibold ${
                    selectedCategory === category
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  {category}
                </Text>
                <View
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full min-w-[18px] items-center ${
                    selectedCategory === category
                      ? "bg-purple-500"
                      : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      selectedCategory === category
                        ? "text-white"
                        : "text-gray-600"
                    }`}
                  >
                    {count}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Blog List - 2 Columns */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7c3aed"]}
            tintColor="#7c3aed"
          />
        }
      >
        <Text className="text-gray-500 text-sm mb-4">
          {filteredBlogs.length} article{filteredBlogs.length !== 1 ? "s" : ""}{" "}
          found
        </Text>

        {filteredBlogs.length > 0 ? (
          <View className="flex-row flex-wrap gap-3">
            {filteredBlogs.map((blog: any) => (
              <View key={blog.id} style={{ width: "48.5%" }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: "/blog/[slug]",
                      params: {
                        slug: blog.slug,
                        blog: JSON.stringify(blog),
                      },
                    })
                  }
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Image
                    source={{ uri: blog.image }}
                    className="w-full h-32"
                    resizeMode="cover"
                  />
                  <View className="p-3">
                    <View className="flex-row items-center mb-2">
                      <View className="bg-purple-50 px-2 py-1 rounded-md">
                        <Text className="text-purple-600 text-xs font-semibold">
                          {blog.category}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-gray-900 font-bold text-sm mb-2"
                      numberOfLines={2}
                    >
                      {blog.title}
                    </Text>
                    <Text
                      className="text-gray-600 text-xs mb-3"
                      numberOfLines={2}
                    >
                      {blog.excerpt}
                    </Text>
                    <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color="#9ca3af"
                        />
                        <Text className="text-gray-400 text-xs ml-1">
                          {blog.readTime}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="heart-outline"
                          size={12}
                          color="#9ca3af"
                        />
                        <Text className="text-gray-400 text-xs ml-1">
                          {blog.likes}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons
                name="document-text-outline"
                size={40}
                color="#9ca3af"
              />
            </View>
            <Text className="text-gray-900 font-bold text-lg mb-2">
              No articles found
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
