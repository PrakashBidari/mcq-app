// app/(tabs)/_layout.tsx
import { icons } from "@/constants/icons";
import { useAuth } from "@/context/AuthContext";
import { useSidebarSetter } from "@/context/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabIcon = React.memo(({
  focused,
  icon,
  title,
  iconSize = 22,
  isDark = false,
}: {
  focused: boolean;
  icon: any;
  title: string;
  iconSize?: number;
  isDark?: boolean;
}) => {
  const iconColor = focused ? "#667eea" : isDark ? "#64748b" : "#9CA3AF";
  const labelColor = focused ? "#7c3aed" : isDark ? "#64748b" : "#9CA3AF";
  return (
    <View style={tabStyles.wrap}>
      <Animatable.View animation={focused ? "fadeIn" : undefined} style={tabStyles.inner}>
        <View style={[
          tabStyles.iconBox,
          { backgroundColor: focused ? (isDark ? "#2d1f4e" : "#ede9fe") : "transparent" },
        ]}>
          <Image
            source={icon}
            tintColor={iconColor}
            style={tabStyles.icon}
            resizeMode="contain"
          />
          <Text style={[tabStyles.label, { color: labelColor, fontWeight: focused ? "700" : "500" }]}>
            {title}
          </Text>
        </View>
        {focused && (
          <Animatable.View animation="slideInUp" duration={260} style={tabStyles.indicator} />
        )}
      </Animatable.View>
    </View>
  );
});

const tabStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    alignItems: "center",
  },
  iconBox: {
    width: 64,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  icon: {
    width: 22,
    height: 22,
  },
  label: {
    fontSize: 10,
    textAlign: "center",
  },
  indicator: {
    marginTop: 2,
    width: 40,
    height: 4,
    backgroundColor: "#7c3aed",
    borderRadius: 2,
  },
});

const _Layout = () => {
  const insets = useSafeAreaInsets();
  const setSidebarVisible = useSidebarSetter();
  const { isLoading, isAuthenticated } = useAuth();
  const { colors, isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }


  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.headerBg,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 10,
          paddingHorizontal: 5,
          borderTopWidth: isDark ? 1 : 0,
          borderTopColor: isDark ? colors.border : "transparent",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 16,
          elevation: isDark ? 0 : 20,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          // Check if the settings tab was pressed
          if (e.target?.includes("setting")) {
            e.preventDefault(); // Prevent navigation
            setSidebarVisible(true); // Open sidebar instead
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: "Quiz",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.stats} title="MCQ" isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: "Study",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={icons.study}
              title="Study"
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmark"
        options={{
          title: "Bookmark",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.save} title="Bookmark" isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: "Setting",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.setting} title="Setting" isDark={isDark} />
          ),
        }}
      />
    </Tabs>
  );
};

export default _Layout;
