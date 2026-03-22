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
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Reader() {
  const params = useLocalSearchParams();
  const title = params.title as string;
  const description = params.description as string;

  const [fontSize, setFontSize] = useState(16);
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);

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
          {title}
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
            {title}
          </Text>

          {/* Description */}
          <Text className="text-gray-700 leading-8" style={{ fontSize }}>
            {description || "No description available for this book."}
          </Text>
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
