"use client";

import { usePreferencesSync } from "@/hooks/use-preferences-sync";

/**
 * Component to sync user preferences (theme and language) on page load
 * This ensures that saved preferences are applied when the user visits the app
 */
export function PreferencesSync() {
  usePreferencesSync();
  return null;
}

