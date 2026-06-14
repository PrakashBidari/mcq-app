// app/(tabs)/setting.tsx
import { useTheme } from "@/hooks/useTheme";
import ThemeManager from "@/utils/ThemeManager";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingScreen() {
  const { colors, isDark } = useTheme();
  const [notifications, setNotifications] = React.useState(true);

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
          value: isDark,
          onToggle: () => ThemeManager.toggle(),
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-6 py-4 border-b" style={{ backgroundColor: colors.headerBg, borderColor: colors.border }}>
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>Settings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mt-6">
            <Text className="px-6 mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
              {section.title}
            </Text>
            <View className="border-y" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  className="flex-row items-center px-6 py-4"
                  style={itemIndex !== section.items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: isDark ? "#2d2d44" : "#f1f5f9" } : undefined}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: isDark ? "#2d1f4e" : "#f5f3ff" }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={isDark ? "#a855f7" : "#7c3aed"}
                    />
                  </View>
                  <Text className="flex-1 ml-4 text-base font-medium" style={{ color: colors.text }}>
                    {item.label}
                  </Text>
                  {item.hasSwitch && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: isDark ? "#374151" : "#e5e7eb", true: "#c084fc" }}
                      thumbColor={item.value ? "#7c3aed" : (isDark ? "#94a3b8" : "#f3f4f6")}
                    />
                  )}
                  {item.hasArrow && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={isDark ? "#ffffff50" : "#cbd5e1"}
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
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: isDark ? "#3b1a1a" : "#fef2f2", borderWidth: 1, borderColor: isDark ? "#7f1d1d" : "#fecaca" }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={22} color={isDark ? "#f87171" : "#dc2626"} />
              <Text className="ml-2 text-base font-semibold" style={{ color: isDark ? "#f87171" : "#dc2626" }}>
                Log Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="items-center pb-8">
          <Text className="text-sm" style={{ color: colors.textMuted }}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
