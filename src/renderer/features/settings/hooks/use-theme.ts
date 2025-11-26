// Hook for managing application theme

import { useEffect } from "react";
import { useAtom } from "jotai";
import {
  themeAtom,
  themePreferenceAtom,
  getSystemTheme,
} from "@/stores/theme-atoms";
import type { ThemePreference } from "@/stores/theme-atoms";

export function useTheme() {
  const [theme] = useAtom(themeAtom);
  const [themePreference, setThemePreference] = useAtom(themePreferenceAtom);

  // Sync dark class with theme atom
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (themePreference !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const systemTheme = getSystemTheme();
      if (systemTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themePreference]);

  const handleThemeChange = (newTheme: ThemePreference) => {
    setThemePreference(newTheme);
  };

  return {
    theme,
    themePreference,
    setTheme: handleThemeChange,
  };
}
