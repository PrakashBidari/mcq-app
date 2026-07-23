// app/_layout.tsx
import GlobalSidebar from "@/components/GlobalSidebar";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
import ThemeManager from "@/utils/ThemeManager";
import { initGlobalPurchaseHandling } from "@/utils/purchases";
import { Stack } from "expo-router";
import { usePreventScreenCapture } from "expo-screen-capture";
import { useEffect } from "react";
import { Platform, StatusBar, StyleSheet } from "react-native";
import "../i18n";
import "./globals.css";

function AppShell() {
  const { isDark } = useTheme();

  // Blocks screenshots/screen recording on Android (FLAG_SECURE) and iOS 13+
  // (secure-layer trick that makes captured content render black).
  usePreventScreenCapture();

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f0f1a" : "#6d28d9"}
      />
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalSidebar />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    ThemeManager.initialize();
    initGlobalPurchaseHandling();
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

const styles = StyleSheet.create({});
