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

interface RecurringPaymentMetadata {
  templateName?: string;
  amount?: number;
  date?: string;
  reason?: string;
  [key: string]: unknown;
}

interface RecurringPaymentSummaryMetadata {
  hubName?: string;
  successCount?: number;
  failedCount?: number;
  skippedCount?: number;
  successItems?: Array<{ name: string; amount: number }>;
  failedItems?: Array<{ name: string; amount: number; reason: string }>;
  skippedItems?: Array<{ name: string; nextDue: string }>;
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

  RECURRING_PAYMENT_SUCCESS: (metadata?: NotificationMetadata) => {
    const paymentMeta = metadata as RecurringPaymentMetadata | undefined;
    const amount = paymentMeta?.amount ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(paymentMeta.amount) : '';
    return {
      type: "success",
      title: "Recurring Payment Processed",
      message: `Your recurring payment "${paymentMeta?.templateName || "payment"}" (${amount}) was successfully processed on ${paymentMeta?.date || "today"}.`,
      channel: "both",
      metadata,
    };
  },

  RECURRING_PAYMENT_FAILED: (metadata?: NotificationMetadata) => {
    const paymentMeta = metadata as RecurringPaymentMetadata | undefined;
    const amount = paymentMeta?.amount ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(paymentMeta.amount) : '';
    return {
      type: "error",
      title: "Recurring Payment Failed",
      message: `Your recurring payment "${paymentMeta?.templateName || "payment"}" (${amount}) failed on ${paymentMeta?.date || "today"}. Reason: ${paymentMeta?.reason || "Unknown error"}.`,
      channel: "both",
      metadata,
    };
  },

  RECURRING_PAYMENT_SUMMARY: (metadata?: NotificationMetadata) => {
    const summaryMeta = metadata as RecurringPaymentSummaryMetadata | undefined;
    return {
      type: "info",
      title: "Recurring Payments Summary",
      message: `Processed ${summaryMeta?.successCount || 0} successful, ${summaryMeta?.failedCount || 0} failed, ${summaryMeta?.skippedCount || 0} skipped recurring payments.`,
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
