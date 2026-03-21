// app/(tabs)/setting.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: "person-outline", label: "Edit Profile", hasArrow: true },
        {
          icon: "lock-closed-outline",
          label: "Change Password",
          hasArrow: true,
        },
        { icon: "mail-outline", label: "Email Preferences", hasArrow: true },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "notifications-outline",
          label: "Push Notifications",
          hasSwitch: true,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: "moon-outline",
          label: "Dark Mode",
          hasSwitch: true,
          value: darkMode,
          onToggle: setDarkMode,
        },
        { icon: "language-outline", label: "Language", hasArrow: true },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle-outline", label: "Help Center", hasArrow: true },
        { icon: "chatbubble-outline", label: "Contact Us", hasArrow: true },
        { icon: "star-outline", label: "Rate App", hasArrow: true },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: "information-circle-outline",
          label: "About App",
          hasArrow: true,
        },
        {
          icon: "document-text-outline",
          label: "Terms of Service",
          hasArrow: true,
        },
        { icon: "shield-outline", label: "Privacy Policy", hasArrow: true },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mt-6">
            <Text className="px-6 mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </Text>
            <View className="bg-white border-y border-gray-100">
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  className={`flex-row items-center px-6 py-4 ${
                    itemIndex !== section.items.length - 1
                      ? "border-b border-gray-50"
                      : ""
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color="#7c3aed"
                    />
                  </View>
                  <Text className="flex-1 ml-4 text-base font-medium text-gray-900">
                    {item.label}
                  </Text>
                  {item.hasSwitch && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: "#e5e7eb", true: "#c084fc" }}
                      thumbColor={item.value ? "#7c3aed" : "#f3f4f6"}
                    />
                  )}
                  {item.hasArrow && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#cbd5e1"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View className="px-6 my-8">
          <TouchableOpacity
            className="bg-red-50 border border-red-200 rounded-xl py-4 items-center"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={22} color="#dc2626" />
              <Text className="ml-2 text-base font-semibold text-red-600">
                Log Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="items-center pb-8">
          <Text className="text-sm text-gray-400">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
