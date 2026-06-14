// app/faqs/index.tsx
import { API_URL } from "@/config/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FAQsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqData, setFaqData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch FAQs and Categories
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
            id: "all",
            name: "All",
            icon: "apps-outline",
          },
          ...categoriesData.data.map((cat: any) => ({
            id: cat.id.toString(),
            name: cat.name,
            icon: cat.icon || "help-circle-outline",
          })),
        ];
        setCategories(formattedCategories);
      }

      // Fetch FAQs
      const faqsResponse = await fetch(`${API_URL}/faqs`);
      const faqsData = await faqsResponse.json();

      if (faqsData.success) {
        setFaqData(faqsData.data);
      }
    } catch {
      // silent — empty list shown
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

  // Filter FAQs based on search and category
  const filteredFaqs = faqData.filter((faq: any) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      faq.categoryId.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-600 mt-4 text-base">Loading FAQs...</Text>
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
          <Text className="text-2xl font-bold text-gray-900">FAQs</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View className="bg-gray-50 rounded-xl flex-row items-center px-4 py-3">
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search questions..."
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

      {/* Categories */}
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
        {categories.map((category: any) => {
          const count =
            category.id === "all"
              ? faqData.length
              : faqData.filter(
                  (faq: any) => faq.categoryId.toString() === category.id,
                ).length;

          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              className={`flex-row items-center px-4 py-1.5 rounded-xl ${
                selectedCategory === category.id
                  ? "bg-purple-600"
                  : "bg-gray-50"
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={category.icon as any}
                size={18}
                color={selectedCategory === category.id ? "#fff" : "#6b7280"}
              />
              <Text
                className={`ml-2 text-sm font-semibold ${
                  selectedCategory === category.id
                    ? "text-white"
                    : "text-gray-600"
                }`}
              >
                {category.name}
              </Text>
              <View
                className={`ml-2 px-2 py-0.5 rounded-full min-w-[20px] items-center ${
                  selectedCategory === category.id
                    ? "bg-purple-500"
                    : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedCategory === category.id
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FAQ List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
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
          {filteredFaqs.length} question{filteredFaqs.length !== 1 ? "s" : ""}{" "}
          found
        </Text>

        {filteredFaqs.length > 0 ? (
          <View className="gap-3">
            {filteredFaqs.map((faq: any) => {
              const isExpanded = expandedFaq === faq.id;

              return (
                <TouchableOpacity
                  key={faq.id}
                  activeOpacity={0.8}
                  onPress={() => toggleFaq(faq.id)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="p-4">
                    {/* Category Badge */}
                    <View className="mb-2">
                      <View className="bg-purple-50 px-2 py-1 rounded-md self-start">
                        <Text className="text-purple-600 text-xs font-semibold">
                          {faq.category}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-gray-900 font-bold text-base leading-5">
                          {faq.question}
                        </Text>
                      </View>
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          isExpanded ? "bg-purple-50" : "bg-gray-50"
                        }`}
                      >
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color={isExpanded ? "#7c3aed" : "#9ca3af"}
                        />
                      </View>
                    </View>

                    {isExpanded && (
                      <View className="mt-3 pt-3 border-t border-gray-100">
                        <Text className="text-gray-700 text-sm leading-6">
                          {faq.answer}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="help-circle-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-gray-900 font-bold text-lg mb-2">
              No questions found
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              Try adjusting your search or filters
            </Text>
          </View>
        )}

        {/* Still have questions section */}
        <View className="mt-8 bg-purple-50 rounded-2xl p-6 border border-purple-100">
          <View className="items-center">
            <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubble-ellipses" size={32} color="#7c3aed" />
            </View>
            <Text className="text-gray-900 font-bold text-lg mb-2 text-center">
              Still have questions?
            </Text>
            <Text className="text-gray-600 text-sm text-center mb-4">
              Can not find the answer you are looking for? Our support team is
              here to help.
            </Text>
            <TouchableOpacity
              className="bg-purple-600 px-6 py-3 rounded-xl flex-row items-center"
              onPress={() => router.push("/contact-us")}
            >
              <Ionicons name="mail" size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Contact Support
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
