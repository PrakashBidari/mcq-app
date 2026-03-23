// app/reader/[bookId].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import * as Animatable from "react-native-animatable";
import RenderHtml from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Reader() {
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Parse book from params
  let book = null;

  if (params.book) {
    try {
      book = JSON.parse(params.book as string);
    } catch (error) {
      console.error("Error parsing book:", error);
    }
  }

  const [fontSize, setFontSize] = useState(16);

  if (!book) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-800 text-lg font-bold">Book not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 bg-purple-600 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Reader Header */}
      <View className="flex-row items-center justify-between px-6 pt-12 pb-4 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>

        <Text
          className="text-gray-800 text-sm font-bold flex-1 text-center mx-4"
          numberOfLines={1}
        >
          {book.title}
        </Text>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setFontSize(Math.max(12, fontSize - 2))}
          >
            <Ionicons name="remove-circle-outline" size={24} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFontSize(Math.min(24, fontSize + 2))}
          >
            <Ionicons name="add-circle-outline" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reading Content */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-6 bg-amber-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 24,
          paddingBottom: 60 + insets.bottom,
        }}
      >
        <Animatable.View animation="fadeIn" duration={500}>
          {/* Book Title */}
          <Text className="text-gray-800 text-2xl font-black mb-6">
            {book.title}
          </Text>

          {/* Description with HTML Rendering */}
          {book.description ? (
            <RenderHtml
              contentWidth={width - 48}
              source={{ html: book.description }}
              baseStyle={{
                fontSize: fontSize,
                lineHeight: fontSize * 1.75,
                color: "#374151",
              }}
              tagsStyles={{
                h1: {
                  fontSize: fontSize + 8,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginTop: 20,
                  marginBottom: 12,
                },
                h2: {
                  fontSize: fontSize + 4,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginTop: 16,
                  marginBottom: 10,
                },
                h3: {
                  fontSize: fontSize + 2,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginTop: 12,
                  marginBottom: 8,
                },
                p: {
                  marginBottom: 16,
                  lineHeight: fontSize * 1.75,
                },
                strong: {
                  fontWeight: "bold",
                  color: "#1f2937",
                },
                em: {
                  fontStyle: "italic",
                },
                b: {
                  fontWeight: "bold",
                  color: "#1f2937",
                },
                i: {
                  fontStyle: "italic",
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
          ) : (
            <Text className="text-gray-700 leading-8" style={{ fontSize }}>
              No description available for this book.
            </Text>
          )}
        </Animatable.View>
      </ScrollView>

      {/* Footer */}
      <View
        className="px-6 py-4 border-t border-gray-200 bg-white items-center"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-purple-600 px-10 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold text-base">Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
