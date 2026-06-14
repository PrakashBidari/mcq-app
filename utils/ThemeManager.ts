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
        background: "#0f0f1a",
        card: "#1a1a2e",
        cardAlt: "#16213e",
        text: "#f1f5f9",
        textSecondary: "#94a3b8",
        textMuted: "#64748b",
        border: "#2d2d44",
        inputBg: "#1e1e30",
        primary: "#a855f7",
        primaryLight: "#c084fc",
        sectionBg: "#12121f",
        headerBg: "#1a1a2e",
        success: "#10b981",
        danger: "#ef4444",
      };
    }
    return {
      background: "#F5F3FF",
      card: "#FFFFFF",
      cardAlt: "#f8f7ff",
      text: "#1e293b",
      textSecondary: "#64748b",
      textMuted: "#94a3b8",
      border: "#e2e8f0",
      inputBg: "#f8fafc",
      primary: "#7c3aed",
      primaryLight: "#a855f7",
      sectionBg: "#F5F3FF",
      headerBg: "#FFFFFF",
      success: "#10b981",
      danger: "#ef4444",
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
