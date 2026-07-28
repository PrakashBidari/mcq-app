// app/_layout.tsx
import GlobalSidebar from "@/components/GlobalSidebar";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
import ThemeManager from "@/utils/ThemeManager";
import { initGlobalPurchaseHandling } from "@/utils/purchases";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform, StatusBar, StyleSheet } from "react-native";
import ScreenGuardModule from "react-native-screenguard";
import "../i18n";
import "./globals.css";

function AppShell() {
  const { isDark } = useTheme();

  // Android: FLAG_SECURE blocks the screenshot outright.
  // iOS: OS-level secure-content redaction makes the captured screenshot/recording
  // render solid black, even though the live screen looks completely normal.
  useEffect(() => {
    ScreenGuardModule.initSettings({
      enableCapture: false,
      enableContentMultitask: false,
    }).then(() => ScreenGuardModule.register({ backgroundColor: "#000000" }));
  }, []);

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
