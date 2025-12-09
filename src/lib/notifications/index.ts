"use server";

import {
  createNotificationDB,
  getNotificationsDB,
  markNotificationAsReadDB,
  markAllNotificationsAsReadDB,
  getUnreadNotificationCountDB,
} from "@/db/queries";
import { sendNotificationEmail } from "./email";
import { getUserEmailDB } from "@/db/queries";
import type { SendNotificationInput, NotificationTypeKey } from "./types";
import { getNotificationConfig } from "./config";
import type { NotificationChannel } from "@/db/schema";

export interface SendNotificationResult {
  success: boolean;
  message?: string;
  notificationId?: string;
}

/**
 * Main function to send notifications
 * Handles DB insert and email sending (fire-and-forget)
 */
export async function sendNotification(
  input:
    | (SendNotificationInput & { typeKey?: never; emailRecipientId?: string | null })
    | {
        typeKey: NotificationTypeKey;
        hubId: string;
        userId?: string | null;
        metadata?: Record<string, unknown>;
        emailRecipientId?: string | null; // Optional: user to send email to (for hub-wide notifications)
      },
): Promise<SendNotificationResult> {
  try {
    let notificationData: SendNotificationInput;

    // If typeKey is provided, use config to generate notification data
    if ("typeKey" in input && input.typeKey) {
      const config = getNotificationConfig(input.typeKey, input.metadata);
      notificationData = {
        hubId: input.hubId,
        userId: input.userId ?? null,
        ...config,
      };
    } else {
      notificationData = input;
    }

    // Create notification in DB
    const result = await createNotificationDB({
      hubId: notificationData.hubId,
      userId: notificationData.userId ?? null,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      html: notificationData.html,
      channel: notificationData.channel ?? "both",
      metadata: notificationData.metadata ?? null,
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message || "Failed to create notification",
      };
    }

    const notification = result.data;

    // Send email if channel includes email
    const channel = (notificationData.channel ?? "both") as NotificationChannel;
    if (channel === "email" || channel === "both") {
      // Determine email recipient: use emailRecipientId if provided, otherwise use userId
      const emailRecipientId = "emailRecipientId" in input 
        ? input.emailRecipientId 
        : notificationData.userId;
      
      if (emailRecipientId) {
        const emailResult = await getUserEmailDB(emailRecipientId);
        if (emailResult.success && emailResult.data?.email) {
          // Fire-and-forget email sending
          sendNotificationEmail(notification, emailResult.data.email).catch(
            (err) => {
              console.error("Error sending notification email:", err);
              // Don't fail the notification creation if email fails
            },
          );
        }
      }
    }

    return {
      success: true,
      message: "Notification sent successfully",
      notificationId: notification.id,
    };
  } catch (err: any) {
    console.error("Error sending notification:", err);
    return {
      success: false,
      message: err.message || "Failed to send notification",
    };
  }
}

/**
 * Get notifications for a hub/user
 */
export async function getNotifications(
  hubId: string,
  userId?: string | null,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
  },
) {
  return await getNotificationsDB({
    hubId,
    userId,
    unreadOnly: options?.unreadOnly ?? false,
    limit: options?.limit,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  hubId: string,
) {
  return await markNotificationAsReadDB(notificationId, hubId);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(
  hubId: string,
  userId?: string | null,
) {
  return await markAllNotificationsAsReadDB(hubId, userId);
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(
  hubId: string,
  userId?: string | null,
) {
  return await getUnreadNotificationCountDB(hubId, userId);
}
