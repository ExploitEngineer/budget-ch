/**
 * Common shared types used across the application
 * Centralized location for reusable type definitions
 */

/**
 * Transaction type for financial transactions
 */
export type TransactionType = "income" | "expense" | "transfer";

/**
 * Common card content structure used in dashboard sections
 */
export interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

/**
 * Status of the two-factor authentication workflow in the UI
 */
export type TwoFactorStatus = "enabled" | "pending" | "disabled";

/**
 * KPI stats for the admin dashboard
 */
export interface KPIStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  subscriptionsByPlan: {
    individual: number;
    family: number;
  };
  mrr: number;
  previousMrr: number;
}
