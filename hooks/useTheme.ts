// hooks/useTheme.ts
import ThemeManager from "@/utils/ThemeManager";
import { useEffect, useState } from "react";

export const useTheme = () => {
  const [isDark, setIsDark] = useState(ThemeManager.getIsDark());
  const [colors, setColors] = useState(ThemeManager.getColors());

  useEffect(() => {
    // Subscribe to theme changes
    const unsubscribe = ThemeManager.subscribe(() => {
      setIsDark(ThemeManager.getIsDark());
      setColors(ThemeManager.getColors());
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  return {
    isDark,
    colors,
    toggle: () => ThemeManager.toggle(),
  };
};
