// components/AppBottomTabBar.tsx
import { icons } from "@/constants/icons";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabItem = {
  key: string;
  icon: any;
  label: string;
  route?: string;
};

const TABS: TabItem[] = [
  { key: "home", icon: icons.home, label: "Home", route: "/(tabs)/" },
  { key: "quiz", icon: icons.stats, label: "MCQ", route: "/(tabs)/quiz" },
  { key: "study", icon: icons.study, label: "Study", route: "/(tabs)/study" },
  { key: "bookmark", icon: icons.save, label: "Bookmark", route: "/(tabs)/bookmark" },
  { key: "setting", icon: icons.setting, label: "Setting" },
];

export default function AppBottomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setSidebarVisible } = useSidebar();
  const { colors, isDark } = useTheme();

  const handlePress = (tab: TabItem) => {
    if (tab.key === "setting") {
      setSidebarVisible(true);
    } else if (tab.route) {
      router.push(tab.route as any);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          backgroundColor: colors.headerBg,
          borderTopWidth: isDark ? 1 : 0,
          borderTopColor: isDark ? colors.border : "transparent",
          shadowOpacity: isDark ? 0 : 0.08,
          elevation: isDark ? 0 : 20,
        },
      ]}
    >
      {TABS.map((tab) => {
        const focused = false;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => handlePress(tab)}
            activeOpacity={0.7}
          >
            <Animatable.View className="items-center gap-1">
              <View
                style={{
                  backgroundColor: focused ? (isDark ? "#2d1f4e" : "#ede9fe") : "transparent",
                  width: 64,
                  height: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={tab.icon}
                  tintColor={focused ? "#667eea" : (isDark ? "#64748b" : "#9CA3AF")}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: focused ? "#7c3aed" : (isDark ? "#64748b" : "#9CA3AF"),
                    fontSize: 10,
                    fontWeight: focused ? "700" : "500",
                  }}
                >
                  {tab.label}
                </Text>
              </View>
            </Animatable.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingTop: 10,
    paddingHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
});
