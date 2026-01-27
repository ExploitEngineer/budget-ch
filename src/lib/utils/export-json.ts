import type { BudgetRow, AccountRow, TransactionRow } from "@/lib/types/ui-types";
import type { SavingGoal } from "@/lib/types/domain-types";
import type { TransferData } from "@/app/me/accounts/_components/latest-transfers";
import { formatInAppTimezone } from "@/lib/timezone";

/**
 * Full JSON Export Format - matches what the importer expects
 * This format is consistent with the database schema field names
 */
export interface FullExportData {
  accounts: ExportAccount[];
  budgets: ExportBudget[];
  transactions: ExportTransaction[];
  "saving-goals": ExportSavingGoal[];
  transfers: ExportTransfer[];
  exportedAt: string;
  version: string;
}

export interface ExportAccount {
  name: string;
  type: string;
  balance: number;
  iban?: string | null;
  note?: string | null;
}

export interface ExportBudget {
  category: string;
  allocated: number;
  ist: number;
  month?: number;
  year?: number;
  warning: number;
  color: string;
}

export interface ExportTransaction {
  date: string;
  category: string;
  account: string;
  amount: number;
  type: string;
  source: string;
  note: string;
}

export interface ExportSavingGoal {
  name: string;
  goal: number;
  saved: number;
  monthlyAllocation: number;
  account: string | null;
  dueDate: string | null;
}

export interface ExportTransfer {
  date: string;
  from: string;
  to: string;
  amount: number;
  note: string | null;
}

/**
 * Transforms UI data into standardized export format
 * Maps UI types to database-consistent field names
 */
export function transformDataForExport(data: {
  transactions?: TransactionRow[];
  budgets?: BudgetRow[];
  accounts?: AccountRow[];
  goals?: SavingGoal[];
  transfers?: TransferData[];
}): FullExportData {
  const now = new Date();

  // Transform accounts (AccountRow -> ExportAccount)
  const accounts: ExportAccount[] = (data.accounts || []).map((acc) => ({
    name: acc.name,
    type: acc.type,
    balance: acc.balance,
    iban: acc.iban,
    note: acc.note,
  }));

  // Transform budgets (BudgetRow -> ExportBudget)
  // Strip UI-computed fields, keep database-relevant ones
  const budgets: ExportBudget[] = (data.budgets || [])
    .filter((b) => b.id !== null) // Only export budgets that exist (have IDs)
    .map((budget) => ({
      category: budget.category,
      allocated: budget.allocated ?? 0,
      ist: budget.ist ?? 0,
      month: budget.month,
      year: budget.year,
      warning: budget.warningThreshold ?? 80,
      color: budget.colorMarker ?? "standard",
    }));

  // Transform transactions (TransactionRow -> ExportTransaction)
  const transactions: ExportTransaction[] = (data.transactions || []).map((tx) => ({
    date: tx.date,
    category: tx.category || "",
    account: tx.account || "",
    amount: tx.amount,
    type: tx.type,
    source: tx.recipient || "", // UI uses 'recipient', DB uses 'source'
    note: tx.note || "",
  }));

  // Transform saving goals (SavingGoal -> ExportSavingGoal)
  // Note: goals may come with accountName from API join, or just financialAccountId
  const savingGoals: ExportSavingGoal[] = (data.goals || []).map((goal: any) => ({
    name: goal.name,
    goal: goal.goalAmount,
    saved: goal.amountSaved,
    monthlyAllocation: goal.monthlyAllocation,
    account: goal.accountName || null, // accountName comes from API join
    dueDate: goal.dueDate ? formatInAppTimezone(new Date(goal.dueDate), "yyyy-MM-dd") : null,
  }));

  // Transform transfers (TransferData -> ExportTransfer)
  const transfers: ExportTransfer[] = (data.transfers || []).map((t) => ({
    date: formatInAppTimezone(new Date(t.date), "yyyy-MM-dd"),
    from: t.source || "",
    to: t.destination || "",
    amount: Math.abs(t.amount),
    note: t.note || null,
  }));

  return {
    accounts,
    budgets,
    transactions,
    "saving-goals": savingGoals,
    transfers,
    exportedAt: now.toISOString(),
    version: "1.0",
  };
}

/**
 * Export all data as JSON file
 */
export const exportAllDataToJSON = (data: {
  transactions?: TransactionRow[];
  budgets?: BudgetRow[];
  accounts?: AccountRow[];
  goals?: SavingGoal[];
  transfers?: TransferData[];
}) => {
  const exportData = transformDataForExport(data);
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-export-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
