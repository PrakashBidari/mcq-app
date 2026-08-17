// app/_layout.tsx
import GlobalSidebar from "@/components/GlobalSidebar";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
import ThemeManager from "@/utils/ThemeManager";
import { initGlobalPurchaseHandling } from "@/utils/purchases";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform, StatusBar, StyleSheet } from "react-native";
import "../i18n";
import "./globals.css";

// react-native-screenguard reads a TurboModule at import time with no web
// implementation - a plain top-level import crashes the web bundle outright.
// Deferring the require to native platforms only avoids ever evaluating it on web.
const ScreenGuardModule =
  Platform.OS !== "web" ? require("react-native-screenguard").default : null;

// In Expo Go the native module can never exist (no native rebuild is possible there) -
// calling initSettings() logs its own noisy diagnostic error even when we catch the
// resulting rejection, so skip calling it entirely rather than just catching it.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function AppShell() {
  const { isDark } = useTheme();

  // Android: FLAG_SECURE blocks the screenshot outright.
  // iOS: OS-level secure-content redaction makes the captured screenshot/recording
  // render solid black, even though the live screen looks completely normal.
  // No native module on web or in Expo Go - screenshot prevention needs a real native build.
  useEffect(() => {
    if (!ScreenGuardModule || isExpoGo) return;
    ScreenGuardModule.initSettings({
      enableCapture: false,
      enableContentMultitask: false,
    })
      .then(() => ScreenGuardModule.register({ backgroundColor: "#000000" }))
      .catch(() => {});
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
    initGlobalPurchaseHandling().catch(() => {});
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
