"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getDefaultHubIdAction, validateHubAccessAction } from "@/lib/services/hub";

/**
 * Hook to sync hub ID to URL
 * - If URL has hub param: validate user has access, if not redirect to default hub
 * - If URL doesn't have hub param: get default hub and update URL
 * Note: Cookie is httpOnly so we can't read it client-side.
 * Middleware handles syncing cookie to URL when cookie exists.
 */
export function useHubSync() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const urlHubId = searchParams.get("hub");

  useEffect(() => {
    const syncHub = async () => {
      // If URL has hub param, validate user has access
      if (urlHubId) {
        
        const validation = await validateHubAccessAction(urlHubId);
        if (!validation.success) {
          // User doesn't have access, redirect to default hub
          const res = await getDefaultHubIdAction();
          if (res.success && res.data) {
            const url = new URL(pathname, window.location.origin);
            url.searchParams.set("hub", res.data);
            router.replace(url.pathname + url.search);
          }
        }
        return;
      }

      // No URL param - get default hub and update URL
      // Middleware will sync the URL param to cookie on next request
      const res = await getDefaultHubIdAction();
      if (res.success && res.data) {
        const url = new URL(pathname, window.location.origin);
        url.searchParams.set("hub", res.data);
        router.replace(url.pathname + url.search);
      }
    };

    syncHub();
  }, [urlHubId, pathname, router]);
}

/**
 * Get URL with hub parameter
 * Since cookie is httpOnly, we can't read it client-side.
 * This function just returns the path as-is - middleware will add hub param from cookie.
 * For navigation, middleware will handle adding hub param from cookie.
 */
export function getUrlWithHubFromCookie(path: string): string {
  // Just return the path - middleware will add hub param from cookie when navigating
  return path;
}

