"use client";

import { useEffect, useRef, useState } from "react";
import type { Notification } from "@/db/schema";

const BROWSER_NOTIFICATION_ENABLED_KEY = "browser-notifications-enabled";
const BROWSER_NOTIFICATION_PERMISSION_REQUESTED_KEY =
  "browser-notification-permission-requested";

/**
 * Check if browser notifications are supported
 */
export function isBrowserNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return "denied";
  return Notification.permission;
}

/**
 * Check if browser notifications are enabled in user preferences
 */
export function isBrowserNotificationEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(BROWSER_NOTIFICATION_ENABLED_KEY);
  return stored === "true";
}

/**
 * Set browser notification enabled preference
 */
export function setBrowserNotificationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BROWSER_NOTIFICATION_ENABLED_KEY, enabled.toString());
}

/**
 * Check if permission has been requested before
 */
export function hasPermissionBeenRequested(): boolean {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(BROWSER_NOTIFICATION_PERMISSION_REQUESTED_KEY) ===
    "true"
  );
}

/**
 * Mark permission as requested
 */
export function markPermissionAsRequested(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    BROWSER_NOTIFICATION_PERMISSION_REQUESTED_KEY,
    "true",
  );
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<
  NotificationPermission
> {
  if (!isBrowserNotificationSupported()) {
    throw new Error("Browser notifications are not supported");
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  const permission = await Notification.requestPermission();
  markPermissionAsRequested();
  return permission;
}

/**
 * Show a browser notification
 */
export function showBrowserNotification(
  notification: Notification,
  onClick?: () => void,
): void {
  if (!isBrowserNotificationSupported()) return;
  if (Notification.permission !== "granted") return;
  if (!isBrowserNotificationEnabled()) return;

  const browserNotification = new window.Notification(notification.title, {
    body: notification.message,
    icon: "/favicon.ico", // You can customize this
    badge: "/favicon.ico",
    tag: notification.id, // Prevent duplicate notifications
    requireInteraction: false,
  });

  browserNotification.onclick = () => {
    browserNotification.close();
    if (onClick) {
      onClick();
    } else {
      // Focus the window
      window.focus();
    }
  };
}

interface UseBrowserNotificationsOptions {
  notifications: Notification[];
  enabled?: boolean;
}

/**
 * Hook to handle browser notifications
 * Shows browser notifications when new notifications arrive and tab is inactive
 */
export function useBrowserNotifications(
  options: UseBrowserNotificationsOptions,
) {
  const { notifications, enabled = true } = options;
  const [isTabActive, setIsTabActive] = useState(true);
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>(() => getNotificationPermission());

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Detect new notifications and show browser notifications
  useEffect(() => {
    if (!enabled) return;
    if (!isBrowserNotificationSupported()) return;
    if (permissionStatus !== "granted") return;
    if (!isBrowserNotificationEnabled()) return;
    if (isTabActive) return; // Only show when tab is inactive

    const currentNotificationIds = new Set(
      notifications.map((n) => n.id),
    );
    const previousIds = previousNotificationIdsRef.current;

    // Find new notifications (not in previous set)
    const newNotifications = notifications.filter(
      (notification) => !previousIds.has(notification.id),
    );

    // Show browser notification for each new notification
    newNotifications.forEach((notification) => {
      showBrowserNotification(notification, () => {
        window.focus();
      });
    });

    // Update previous IDs
    previousNotificationIdsRef.current = currentNotificationIds;
  }, [notifications, enabled, permissionStatus, isTabActive]);

  // Update permission status when it changes
  useEffect(() => {
    const checkPermission = () => {
      setPermissionStatus(getNotificationPermission());
    };

    // Check permission periodically (in case user changes it in browser settings)
    const interval = setInterval(checkPermission, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    permissionStatus,
    isSupported: isBrowserNotificationSupported(),
    isEnabled: isBrowserNotificationEnabled(),
    setEnabled: setBrowserNotificationEnabled,
    requestPermission: async () => {
      const permission = await requestNotificationPermission();
      setPermissionStatus(permission);
      return permission;
    },
    hasPermissionBeenRequested: hasPermissionBeenRequested(),
  };
}
