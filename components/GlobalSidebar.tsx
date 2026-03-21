// components/GlobalSidebar.tsx
import { useSidebar } from "@/context/SidebarContext";
import { useRouter } from "expo-router";
import React from "react";
import SettingsSidebar from "./SettingsSidebar";

const GlobalSidebar = () => {
  const { sidebarVisible, setSidebarVisible } = useSidebar();
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    if (screen === "Settings") {
      // Navigate to the actual settings page
      router.push("/(tabs)/setting");
    } else if (screen === "Blogs") {
      // Navigate to blog listing page
      router.push("/blog");
    } else if (screen === "Profile") {
      router.push("/profile");
    } else if (screen === "FAQs") {
      router.push("/faqs");
    } else if (screen === "MyLearning") {
      console.log("Navigate to: MyLearning");
      router.push("/my-learning");
    } else {
      // For other pages, you can create them later
      // For now, just log
      console.log(`Navigate to: ${screen}`);
      // When ready: router.push(`/${screen.toLowerCase()}`);
    }
  };

  return (
    <SettingsSidebar
      visible={sidebarVisible}
      onClose={() => setSidebarVisible(false)}
      onNavigate={handleNavigate}
    />
  );
};

export default GlobalSidebar;
