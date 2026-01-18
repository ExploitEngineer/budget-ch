/**
 * Domain types - Single Source of Truth (SSOT) for all core data types
 * 
 * These types are derived directly from the database schema and represent
 * the canonical data structures used across services, API routes, and business logic.
 * 
 * UI-specific types should NOT be defined here. See ui-types.ts for presentation types.
 */

// Import schema-derived base types for extending
import type {
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
  AccessRole,
  TransactionType,
  AccountType,
  BudgetMarkerColor,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/db/schema";

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
};

// Re-export enum types
export type {
  AccessRole,
  TransactionType,
  AccountType,
  BudgetMarkerColor,
  SubscriptionPlan,
  SubscriptionStatus,
};

export interface BudgetWithCategory {
  id: string | null; // Null if category is not budgeted
  hubId: string;
  userId?: string | null;
  transactionCategoryId: string;
  allocatedAmount: number | null;
  spentAmount: number | null; // IST
  calculatedSpentAmount?: number; // From transactions
  warningPercentage?: number | null;
  markerColor?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  categoryName: string | null;
  carriedOverAmount?: number;
  isInstance?: boolean;
  month?: number;
  year?: number;
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
 * Extends Transaction schema type with joined category, account, and user names
 */
export interface TransactionWithDetails extends Transaction {
  // Joined fields
  categoryName: string | null; // From joined TransactionCategory
  accountName: string | null; // From joined FinancialAccount
  userName: string | null; // From joined User
}

/**
 * RecurringTemplateWithDetails - Domain view model for recurring templates with joined data
 * Used for displaying recurring templates with account, category, and destination account names
 */
export interface RecurringTemplateWithDetails {
  id: string;
  hubId: string;
  userId: string | null;
  financialAccountId: string;
  destinationAccountId: string | null;
  transactionCategoryId: string | null;
  type: TransactionType;
  source: string | null;
  amount: number;
  note: string | null;
  frequencyDays: number;
  startDate: Date;
  endDate: Date | null;
  status: 'active' | 'inactive';
  lastGeneratedDate: Date | null;
  createdAt: Date;
  // Joined fields
  accountName: string | null;
  categoryName: string | null;
  destinationAccountName: string | null;
}
