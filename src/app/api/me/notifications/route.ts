import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { validateHubAccess } from "@/lib/api-helpers";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hubId = searchParams.get("hub");
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  if (!hubId) {
    return apiError({ message: "Hub ID is required", status: 400 });
  }

  const access = await validateHubAccess(hubId);
  if (!access.success) {
    return apiError({
      message: access.message ?? "Access denied",
      status: 403,
    });
  }

  const notifications = await getNotifications(hubId, access.userId, {
    unreadOnly,
    limit,
  });

  if (!notifications.success) {
    return apiError({
      message: notifications.message ?? "Failed to fetch notifications",
      status: 500,
    });
  }

  return apiSuccess({ data: notifications.data ?? [], status: 200 });
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hubId = searchParams.get("hub");
  const body = await request.json();
  const { notificationId, markAll } = body;

  if (!hubId) {
    return apiError({ message: "Hub ID is required", status: 400 });
  }

  const access = await validateHubAccess(hubId);
  if (!access.success) {
    return apiError({
      message: access.message ?? "Access denied",
      status: 403,
    });
  }

  if (markAll) {
    const result = await markAllNotificationsAsRead(hubId, access.userId);
    if (!result.success) {
      return apiError({
        message: result.message ?? "Failed to mark all notifications as read",
        status: 500,
      });
    }
    return apiSuccess({ data: { success: true }, status: 200 });
  }

  if (!notificationId) {
    return apiError({
      message: "Notification ID is required",
      status: 400,
    });
  }

  const result = await markNotificationAsRead(notificationId, hubId);
  if (!result.success) {
    return apiError({
      message: result.message ?? "Failed to mark notification as read",
      status: 500,
    });
  }

  return apiSuccess({ data: { success: true }, status: 200 });
}
