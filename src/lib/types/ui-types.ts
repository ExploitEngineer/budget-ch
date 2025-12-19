/**
 * UI types - Presentation-specific types for components, tables, and UI views
 * 
 * These types are derived from domain types (in domain-types.ts) and represent
 * how data is displayed or manipulated in the UI. They may include:
 * - Computed/derived fields (e.g., progress percentages, formatted values)
 * - Renamed fields for display (e.g., "allocated" instead of "allocatedAmount")
 * - UI-only properties (e.g., formattedBalance, remaining)
 * 
 * All UI types should be derived from domain types using TypeScript utility types
 * (Pick, Omit, etc.) to maintain type safety and consistency.
 */

import type {
  BudgetWithCategory,
  AccountType,
  TransactionType,
  SavingGoal,
} from "./domain-types";

/**
 * BudgetRow - UI type for budget table rows
 * Derived from BudgetWithCategory with UI-specific field names and computed values
 */
export interface BudgetRow {
  id: string | null; // Null if category is not budgeted
  category: string; // Maps from categoryName
  allocated: number | null;
  ist: number | null; // Initial stored spent amount
  spent: number; // Calculated spent amount from transactions
  carriedOver: number | null; // Carried over from previous month
  remaining: number; // Computed: allocated - (spent + ist)
  progress: number; // Computed: ((spent + ist) / allocated) * 100
  warningThreshold: number | null;
  colorMarker: string | null;
}

/**
 * AccountRow - UI type for financial account table rows
 * Derived from FinancialAccount with UI-specific formatting
 */
export interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  iban: string | null;
  balance: number;
  formattedBalance: string; // UI-only formatted display value
  note: string | null;
}

/**
 * Transaction - UI type for transaction display
 * Note: This is currently defined in dashboard-types.ts but should be migrated here
 * Keeping it for now to maintain compatibility
 */
export interface TransactionRow {
  id: string;
  date: string;
  recipient: string;
  type: TransactionType;
  category: string;
  note: string;
  amount: number;
  accountId?: string | null;
  destinationAccountId?: string | null;
  recurringTemplateId?: string | null;
  isRecurring?: boolean;
}

/**
 * SavingGoalRow - UI type for saving goal display
 * Derived from SavingGoal with computed progress value
 */
export interface SavingGoalRow {
  id: SavingGoal["id"];
  name: SavingGoal["name"];
  goalAmount: SavingGoal["goalAmount"];
  amountSaved: SavingGoal["amountSaved"];
  monthlyAllocation: SavingGoal["monthlyAllocation"];
  financialAccountId: SavingGoal["financialAccountId"];
  dueDate: SavingGoal["dueDate"];
  value: number; // Computed: progress percentage (0-100)
  remaining?: number; // Computed: goalAmount - amountSaved
}

// Re-export dashboard types that are UI-specific
export type { DashboardCards, DashboardSavingsGoalsCards, DashboardSavingsGoals } from "./dashboard-types";

// Re-export common UI types
export type { CardsContent, TwoFactorStatus } from "./common-types";
