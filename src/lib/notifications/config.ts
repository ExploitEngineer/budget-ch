import type {
  NotificationConfigFactory,
  NotificationMetadata,
  NotificationTypeKey,
} from "./types";

interface BudgetMetadata {
  budgetId?: string;
  categoryName?: string;
  spentAmount?: number;
  allocatedAmount?: number;
  [key: string]: unknown;
}

interface SubscriptionMetadata {
  subscriptionId?: string;
  expiresAt?: string;
  daysRemaining?: number;
  [key: string]: unknown;
}

const notificationConfigs: Record<
  NotificationTypeKey,
  NotificationConfigFactory
> = {
  BUDGET_THRESHOLD_80: (metadata?: NotificationMetadata) => {
    const budgetMeta = metadata as BudgetMetadata | undefined;
    return {
      type: "warning",
      title: "Budget Threshold Reached",
      message: `Your budget for "${budgetMeta?.categoryName || "category"}" has reached 80% of the allocated amount.`,
      channel: "both",
      metadata,
    };
  },

  BUDGET_THRESHOLD_100: (metadata?: NotificationMetadata) => {
    const budgetMeta = metadata as BudgetMetadata | undefined;
    return {
      type: "error",
      title: "Budget Exceeded",
      message: `Your budget for "${budgetMeta?.categoryName || "category"}" has been exceeded.`,
      channel: "both",
      metadata,
    };
  },

  SUBSCRIPTION_EXPIRING_3_DAYS: (metadata?: NotificationMetadata) => {
    const subMeta = metadata as SubscriptionMetadata | undefined;
    return {
      type: "warning",
      title: "Subscription Expiring Soon",
      message: `Your subscription will expire in 3 days. Please renew to continue using all features.`,
      channel: "both",
      metadata,
    };
  },

  SUBSCRIPTION_EXPIRING_1_DAY: (metadata?: NotificationMetadata) => {
    const subMeta = metadata as SubscriptionMetadata | undefined;
    return {
      type: "error",
      title: "Subscription Expiring Tomorrow",
      message: `Your subscription will expire tomorrow. Please renew immediately to avoid service interruption.`,
      channel: "both",
      metadata,
    };
  },

  SUBSCRIPTION_EXPIRED: (metadata?: NotificationMetadata) => {
    const subMeta = metadata as SubscriptionMetadata | undefined;
    return {
      type: "error",
      title: "Subscription Expired",
      message: `Your subscription has expired. Please renew to restore access to all features.`,
      channel: "both",
      metadata,
    };
  },
};

export function getNotificationConfig(
  type: NotificationTypeKey,
  metadata?: NotificationMetadata,
): ReturnType<NotificationConfigFactory> {
  const factory = notificationConfigs[type];
  if (!factory) {
    throw new Error(`Unknown notification type: ${type}`);
  }
  return factory(metadata);
}
