// app/_layout.tsx
import GlobalSidebar from "@/components/GlobalSidebar";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import ThemeManager from "@/utils/ThemeManager";
import { Stack } from "expo-router";
import { useEffect } from "react";
import "./globals.css";

export default function RootLayout() {
  useEffect(() => {
    ThemeManager.initialize();
  }, []);

  return (
    <AuthProvider>
      <SidebarProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <GlobalSidebar />
      </SidebarProvider>
    </AuthProvider>
  );
}
