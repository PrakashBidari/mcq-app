// app/_layout.tsx
import GlobalSidebar from "@/components/GlobalSidebar";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
import ThemeManager from "@/utils/ThemeManager";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import ScreenshotPrevent, { addListener } from "react-native-screenshot-prevent";
import "../i18n";
import "./globals.css";

function AppShell() {
  const { isDark } = useTheme();
  const [screenshotBlocked, setScreenshotBlocked] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const subscription = addListener(() => {
      setScreenshotBlocked(true);
      setTimeout(() => setScreenshotBlocked(false), 3000);
    });
    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f0f1a" : "#6d28d9"}
      />
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalSidebar />
      {screenshotBlocked && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Screenshots are not allowed</Text>
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    ThemeManager.initialize();
    if (Platform.OS === "android") {
      ScreenshotPrevent.enabled(true);
    }
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <SidebarProvider>
          <AppShell />
        </SidebarProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
