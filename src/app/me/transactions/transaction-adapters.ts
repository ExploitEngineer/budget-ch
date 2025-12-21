/**
 * Transaction adapters - Transform domain types to UI types for transactions
 * 
 * These functions convert TransactionWithDetails (domain type) to TransactionRow (UI type)
 * by adding UI-specific formatting and computed values.
 */

import type { TransactionWithDetails } from "@/lib/types/domain-types";
import type { TransactionRow } from "@/lib/types/ui-types";

/**
 * Maps a TransactionWithDetails domain type to TransactionRow UI type
 * Formats dates and adds computed fields like isRecurring
 */
export function mapTransactionToTransactionRow(
  transaction: TransactionWithDetails,
): TransactionRow {
  const date = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleDateString("en-GB")
    : null;

  // DEBUG: Log first 3 transactions to see raw data
  if (Math.random() < 0.05) { // Log ~5% of transactions
    console.log('🔍 TRANSACTION ADAPTER - Raw Data:', {
      id: transaction.id,
      source: transaction.source,
      recurringTemplateId: transaction.recurringTemplateId,
      hasRecurringTemplateId: !!transaction.recurringTemplateId,
      type: transaction.type
    });
  }

  const mapped = {
    id: transaction.id,
    date: date ?? "—",
    recipient: transaction.source ?? "—",
    type: transaction.type,
    category: transaction.categoryName ?? "—",
    note: transaction.note ?? "—",
    amount: Number(transaction.amount ?? 0),
    accountId: transaction.financialAccountId ?? null,
    destinationAccountId: transaction.destinationAccountId ?? null,
    recurringTemplateId: transaction.recurringTemplateId ?? null,
    isRecurring: !!transaction.recurringTemplateId,
  };

  return mapped;
}

/**
 * Maps an array of TransactionWithDetails domain types to TransactionRow UI types
 */
export function mapTransactionsToRows(
  transactions: TransactionWithDetails[],
): TransactionRow[] {
  return transactions.map(mapTransactionToTransactionRow);
}
