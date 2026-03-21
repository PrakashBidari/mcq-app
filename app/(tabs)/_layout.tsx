// app/(tabs)/_layout.tsx
import { icons } from "@/constants/icons";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";



const TabIcon = ({ focused, icon, title, size = 6 }) => {
  return (
    <View className="flex-1 w-20 justify-center items-center relative">
      <Animatable.View
        animation={focused ? "fadeIn" : undefined}
        className="items-center gap-1"
      >
        {/* Icon with Light Background when focused */}
        <View
          className={`${focused ? "bg-purple-50" : ""} w-16 h-12 rounded-xl items-center justify-center`}
        >
          <Image
            source={icon}
            tintColor={focused ? "#667eea" : "#9CA3AF"}
            className={`size-${size}`}
            resizeMode="contain"
          />
          <Text
            className={`text-[10px] font-${focused ? "bold" : "medium"} ${focused ? "text-purple-600" : "text-gray-400"}`}
          >
            {title}
          </Text>
        </View>

        {/* Bottom Line Indicator */}
        {focused && (
          <Animatable.View
            animation="slideInUp"
            duration={300}
            className="absolute -bottom-2 w-10 h-1 bg-purple-600 rounded-full"
          />
        )}
      </Animatable.View>
    </View>
  );
};

const _Layout = () => {
  const insets = useSafeAreaInsets();
  const { setSidebarVisible } = useSidebar();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Show loading
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
          backgroundColor: "#FFFFFF",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 10,
          paddingHorizontal: 5,
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 20,
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
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: "Quiz",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.stats} title="MCQ" />
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
              size={9}
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
            <TabIcon focused={focused} icon={icons.save} title="Bookmark" />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: "Setting",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.setting} title="Setting" />
          ),
        }}
      />
    </Tabs>
  );
};

export default _Layout;
