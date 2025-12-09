"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/lib/query-keys";
import type { Notification } from "@/db/schema";

interface UseNotificationsOptions {
  hubId: string | null;
  unreadOnly?: boolean;
  limit?: number;
  pollingInterval?: number; // in milliseconds, default 30000 (30 seconds)
}

/**
 * Hook for fetching notifications with polling
 */
export function useNotifications(options: UseNotificationsOptions) {
  const { hubId, unreadOnly = false, limit, pollingInterval = 30000 } = options;

  return useQuery<Notification[]>({
    queryKey: notificationKeys.list(hubId, unreadOnly, limit),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }

      const params = new URLSearchParams({
        hub: hubId,
        ...(unreadOnly && { unreadOnly: "true" }),
        ...(limit && { limit: limit.toString() }),
      });

      const response = await fetch(`/api/me/notifications?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch notifications");
      }

      return data.data ?? [];
    },
    enabled: !!hubId,
    refetchInterval: pollingInterval,
  });
}

/**
 * Hook for fetching unread notification count
 */
export function useNotificationCount(hubId: string | null) {
  return useQuery<number>({
    queryKey: notificationKeys.count(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }

      const response = await fetch(`/api/me/notifications/count?hub=${hubId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch notification count");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch notification count");
      }

      return data.data?.count ?? 0;
    },
    enabled: !!hubId,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

/**
 * Hook for marking a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notificationId,
      hubId,
    }: {
      notificationId: string;
      hubId: string;
    }) => {
      const response = await fetch(`/api/me/notifications?hub=${hubId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to mark notification as read");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({
        queryKey: notificationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.count(variables.hubId),
      });
    },
  });
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hubId: string) => {
      const response = await fetch(`/api/me/notifications?hub=${hubId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.message || "Failed to mark all notifications as read",
        );
      }

      return await response.json();
    },
    onSuccess: (_, hubId) => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({
        queryKey: notificationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.count(hubId),
      });
    },
  });
}
