import type { NotificationType, NotificationChannel } from "@/db/schema";

export type NotificationMetadata = Record<string, unknown> | null;

export interface SendNotificationInput {
  hubId: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  html?: string;
  channel?: NotificationChannel;
  metadata?: NotificationMetadata;
}

export interface NotificationConfig {
  type: NotificationType;
  defaultTitle: string;
  defaultMessageTemplate: string;
  channel: NotificationChannel;
}

export interface NotificationConfigFactory {
  (
    metadata?: NotificationMetadata,
  ): Omit<SendNotificationInput, "hubId" | "userId">;
}

export const BUDGET_THRESHOLD_80 = "BUDGET_THRESHOLD_80";
export const BUDGET_THRESHOLD_100 = "BUDGET_THRESHOLD_100";
export const SUBSCRIPTION_EXPIRING_3_DAYS = "SUBSCRIPTION_EXPIRING_3_DAYS";
export const SUBSCRIPTION_EXPIRING_1_DAY = "SUBSCRIPTION_EXPIRING_1_DAY";
export const SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED";

export type NotificationTypeKey =
  | typeof BUDGET_THRESHOLD_80
  | typeof BUDGET_THRESHOLD_100
  | typeof SUBSCRIPTION_EXPIRING_3_DAYS
  | typeof SUBSCRIPTION_EXPIRING_1_DAY
  | typeof SUBSCRIPTION_EXPIRED;
