/**
 * Account adapters - Transform domain types to UI types for accounts
 * 
 * These functions convert FinancialAccount (domain type) to AccountRow (UI type)
 * by adding UI-specific formatting and computed values.
 */

import type { FinancialAccount } from "@/lib/types/domain-types";
import type { AccountRow } from "@/lib/types/ui-types";

/**
 * Maps a FinancialAccount domain type to AccountRow UI type
 * Adds formatted balance and normalizes field names for display
 */
export function mapAccountToAccountRow(
  account: FinancialAccount,
  currency: string = "CHF",
): AccountRow {
  const balance = Number(account.initialBalance ?? 0);
  const formattedBalance = `${currency} ${balance.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
  })}`;

  return {
    id: account.id,
    name: account.name,
    type: account.type,
    iban: account.iban ?? null,
    balance,
    formattedBalance,
    note: account.note ?? null,
  };
}

/**
 * Maps an array of FinancialAccount domain types to AccountRow UI types
 */
export function mapAccountsToRows(
  accounts: FinancialAccount[],
  currency: string = "CHF",
): AccountRow[] {
  return accounts.map((account) => mapAccountToAccountRow(account, currency));
}
