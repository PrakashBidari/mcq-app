// app/_layout.tsx
import GlobalSidebar from "@/components/GlobalSidebar";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
import ThemeManager from "@/utils/ThemeManager";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import "../i18n";
import "./globals.css";

function AppShell() {
  const { isDark } = useTheme();
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
