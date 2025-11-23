import type { AccountType } from "@/db/queries";

/**
 * Row types for data tables and components
 * Centralized location for all row type definitions
 */

/**
 * Account row type for financial accounts table
 */
export interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  iban: string | null;
  balance: number;
  formattedBalance: string;
  note: string | null;
}

// Future row types can be added here:
// export interface BudgetRow { ... }
// export interface TransactionRow { ... }
// export interface SavingGoalRow { ... }
// etc.

