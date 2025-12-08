/**
 * Domain types - Single Source of Truth (SSOT) for all core data types
 * 
 * These types are derived directly from the database schema and represent
 * the canonical data structures used across services, API routes, and business logic.
 * 
 * UI-specific types should NOT be defined here. See ui-types.ts for presentation types.
 */

// Re-export schema-derived base types
export type {
  Budget,
  FinancialAccount,
  Transaction,
  Hub,
  HubMember,
  HubInvitation,
  TransactionCategory,
  SavingGoal,
  UserType,
  SubscriptionType,
  UserSettingsType,
  QuickTask,
  RecurringTransactionTemplateType,
  TwoFactorType,
} from "@/db/schema";

// Re-export enum types
export type {
  AccessRole,
  TransactionType,
  AccountType,
  BudgetMarkerColor,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/db/schema";

/**
 * BudgetWithCategory - Canonical domain view model for budgets with category information
 * Used by services and API routes when returning budget data that includes category names
 */
export interface BudgetWithCategory {
  id: string;
  hubId: string;
  userId: string | null;
  transactionCategoryId: string | null;
  allocatedAmount: number;
  spentAmount: number;
  warningPercentage: number;
  markerColor: string;
  createdAt: Date;
  updatedAt: Date;
  categoryName: string | null; // From joined TransactionCategory
}

/**
 * BudgetAmounts - Domain-level aggregate for budget totals
 * Used for cards, summaries, and any place that needs total allocated/spent amounts
 */
export interface BudgetAmounts {
  totalAllocated: number;
  totalSpent: number;
}

/**
 * TransactionWithDetails - Canonical domain view model for transactions with joined data
 * Used by services and API routes when returning transaction data that includes category and account names
 */
export interface TransactionWithDetails {
  id: string;
  hubId: string;
  userId: string | null;
  financialAccountId: string;
  destinationAccountId: string | null;
  transactionCategoryId: string | null;
  recurringTemplateId: string | null;
  type: TransactionType;
  source: string | null;
  amount: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  categoryName: string | null; // From joined TransactionCategory
  accountName: string | null; // From joined FinancialAccount
  userName: string | null; // From joined User
}
