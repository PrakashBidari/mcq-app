// utils/ThemeManager.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@app_theme";

class ThemeManager {
  private isDark: boolean = false;
  private listeners: Set<() => void> = new Set();

  async initialize() {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      this.isDark = saved === "dark";
      this.notifyListeners();
    } catch (error) {
      console.log("Error loading theme:", error);
    }
  }

  async toggle() {
    this.isDark = !this.isDark;
    try {
      await AsyncStorage.setItem(THEME_KEY, this.isDark ? "dark" : "light");
      this.notifyListeners();
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  }

  getIsDark() {
    return this.isDark;
  }

  getColors() {
    if (this.isDark) {
      return {
        background: "#111827",
        card: "#1F2937",
        text: "#F9FAFB",
        textSecondary: "#D1D5DB",
        border: "#374151",
        primary: "#A855F7",
      };
    }
    return {
      background: "#F9FAFB",
      card: "#FFFFFF",
      text: "#111827",
      textSecondary: "#6B7280",
      border: "#E5E7EB",
      primary: "#7C3AED",
    };
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

export default new ThemeManager();
