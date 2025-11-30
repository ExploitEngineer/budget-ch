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

