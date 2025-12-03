"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { setLanguage } from "@/app/actions";
import { AppearanceValues } from "@/lib/validations";

const STORAGE_KEY = "budget-ch-user-preferences";

function loadPreferencesLocally(): AppearanceValues | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as AppearanceValues;
  } catch {
    return null;
  }
}

/**
 * Hook to sync user preferences (theme and language) on page load
 * This ensures that saved preferences are applied when the user visits the app
 */
export function usePreferencesSync() {
  const { setTheme, theme } = useTheme();
  const currentLocale = useLocale();

  useEffect(() => {
    // Wait for theme to be mounted before applying preferences
    if (theme === undefined) return;

    const preferences = loadPreferencesLocally();
    if (!preferences) return;

    // Apply theme if different from current
    // Map "auto" to "system" for next-themes
    if (preferences.theme) {
      const themeToApply = preferences.theme === "auto" ? "system" : preferences.theme;
      if (themeToApply !== theme) {
        setTheme(themeToApply);
      }
    }

    // Apply language if different from current
    if (preferences.language && preferences.language !== currentLocale) {
      const formData = new FormData();
      formData.append("locale", preferences.language);
      formData.append("pathname", window.location.pathname);
      setLanguage(formData);
    }
  }, [theme, setTheme, currentLocale]); // Run when theme is mounted

  return { preferences: loadPreferencesLocally() };
}

