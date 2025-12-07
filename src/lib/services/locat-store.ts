"use client";

import { UserPreferencesValues } from "../validations";

export const PREFERENCES_STORAGE_KEY = "budget-ch-user-preferences";
export const DEFAULT_PREFERENCES: UserPreferencesValues = {
  language: "en",
  currency: "chf",
  theme: "auto",
};

const hasLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function getLocalUserPreferences(returnDefault: boolean = false) {
  if (!hasLocalStorage()) {
    return returnDefault ? DEFAULT_PREFERENCES : null;
  }

  try {
    const stored = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);

    if (!stored && returnDefault) {
      return DEFAULT_PREFERENCES;
    }
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as typeof DEFAULT_PREFERENCES;
  } catch (error) {
    console.error("Error getting local user preferences:", error);
    return returnDefault ? DEFAULT_PREFERENCES : null;
  }
}

export function setLocalUserPreferences(
  preferences: Partial<UserPreferencesValues>,
) {
  const currentPreferences =
    (getLocalUserPreferences(true) as UserPreferencesValues) ??
    DEFAULT_PREFERENCES;
  const newPreferences = { ...currentPreferences, ...preferences };

  if (!hasLocalStorage()) {
    return newPreferences;
  }

  try {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(newPreferences),
    );
    return newPreferences;
  } catch (error) {
    console.error("Error setting local user preferences:", error);
    return newPreferences;
  }
}
