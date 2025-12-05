"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook to manage hub navigation with URL query parameter
 * Preserves hub parameter when navigating between pages
 */
export function useHubNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentHubId = searchParams.get("hub");

  /**
   * Navigate to a new path while preserving the hub query parameter
   */
  const navigateWithHub = useCallback(
    (path: string, hubId?: string | null) => {
      const url = new URL(path, window.location.origin);
      
      // Use provided hubId, or preserve current hub, or omit if none
      const hubToUse = hubId ?? currentHubId;
      if (hubToUse) {
        url.searchParams.set("hub", hubToUse);
      }
      
      router.push(url.pathname + url.search);
    },
    [router, currentHubId]
  );

  /**
   * Switch to a different hub (updates URL with new hub param)
   */
  const switchHub = useCallback(
    (hubId: string) => {
      const url = new URL(pathname, window.location.origin);
      url.searchParams.set("hub", hubId);
      router.push(url.pathname + url.search);
    },
    [router, pathname]
  );

  /**
   * Get a URL with hub parameter preserved
   */
  const getUrlWithHub = useCallback(
    (path: string, hubId?: string | null): string => {
      const url = new URL(path, window.location.origin);
      const hubToUse = hubId ?? currentHubId;
      if (hubToUse) {
        url.searchParams.set("hub", hubToUse);
      }
      return url.pathname + url.search;
    },
    [currentHubId]
  );

  return {
    currentHubId,
    navigateWithHub,
    switchHub,
    getUrlWithHub,
  };
}

