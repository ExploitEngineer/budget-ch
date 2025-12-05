"use client";

import { useHubSync } from "@/hooks/use-hub-sync";

/**
 * Component that syncs hub ID from cookie to URL
 * Handles default hub when no cookie/URL param exists
 */
export function HubSync() {
  useHubSync();
  return null;
}

