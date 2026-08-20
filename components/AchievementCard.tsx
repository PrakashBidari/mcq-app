// components/AchievementCard.tsx
// Shared between the Home tab's Achievements section and My Learning —
// same card, same data source (see hooks/useAchievements.ts).
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import * as Animatable from "react-native-animatable";

export type AchievementItem = {
  id: string;
  title: string;
  description: string;
  progress: number;
  icon: string;
  color: string;
};

const AchievementCard = React.memo(function AchievementCard({
  item,
  index,
}: {
  item: AchievementItem;
  index: number;
}) {
  const { colors: themeColors, isDark: achIsDark } = useTheme();
  return (
    <Animatable.View animation="fadeInRight" delay={index * 60} duration={400}>
      <View
        style={[
          styles.achieveCard,
          {
            shadowColor: item.color,
            backgroundColor: themeColors.card,
            borderColor: achIsDark ? themeColors.border : "#ede8ff",
          },
        ]}
      >
        <View
          style={[
            styles.achieveIconBox,
            { backgroundColor: item.color + (achIsDark ? "30" : "18") },
          ]}
        >
          <Ionicons name={item.icon as any} size={22} color={item.color} />
        </View>
        <Text style={[styles.achieveTitle, { color: themeColors.text }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.achieveDesc, { color: themeColors.textSecondary }]}
        >
          {item.description}
        </Text>
        <View
          style={[
            styles.achieveBarBg,
            { backgroundColor: achIsDark ? "#2d2d44" : "#ede8ff" },
          ]}
        >
          <View
            style={[
              styles.achieveBarFill,
              {
                width: `${item.progress}%` as any,
                backgroundColor: item.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.achievePct, { color: item.color }]}>
          {item.progress}%
        </Text>
      </View>
    </Animatable.View>
  );
});

export default AchievementCard;

const styles = StyleSheet.create({
  achieveCard: {
    width: 165,
    height: 168,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#ede8ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 2,
  },
  achieveIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  achieveTitle: {
    color: "#1e0f4e",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  achieveDesc: { color: "#8070a8", fontSize: 11, marginBottom: 9 },
  achieveBarBg: {
    backgroundColor: "#ede8ff",
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 5,
  },
  achieveBarFill: { height: "100%", borderRadius: 3 },
  achievePct: { fontSize: 11, fontWeight: "800" },
});
