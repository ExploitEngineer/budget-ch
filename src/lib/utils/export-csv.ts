import Papa from "papaparse";
import type { Transaction } from "@/lib/types/dashboard-types";
import type { BudgetRow, AccountRow } from "@/lib/types/row-types";
import type { TransferData } from "@/app/me/accounts/_components/latest-transfers";
import type { CategoryDetail, MonthlyReport } from "@/lib/api";
import type { SavingGoal } from "@/lib/types/domain-types";

export type TransactionExportArgs = {
  transactions: Omit<Transaction, "type">[];
  t: (key: string) => string;
};

export type BudgetExportArgs = {
  budgetHeadings: string[];
  budgets: BudgetRow[] | null;
};

export type FinancialAccountExportArgs = {
  accountTableHeadings: string[];
  accounts: AccountRow[] | null;
};

export type LatestTranfersExportArgs = {
  tableHeadings: string[];
  transfers: TransferData[] | null;
};

export type CategoriesExportArgs = {
  categories: CategoryDetail[] | null;
  t: (key: string) => string;
};

export type SavingGoalsExportArgs = {
  goals: SavingGoal[] | null;
  t: (key: string) => string;
};

export type MonthlyReportExportArgs = {
  tableHeadings: string[];
  monthlyReports: MonthlyReport[] | null;
};

export type FullReportExportArgs = {
  summary: {
    income: number;
    expense: number;
    balance: number;
    savingRate: number;
  } | null;
  categories: CategoryDetail[] | null;
  monthlyReports: MonthlyReport[] | null;
  t: (key: string) => string;
  trendHeadings: string[];
};

const triggerCSVDownload = (csv: string, filename: string) => {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Transactions export
export const exportTransactionsToCSV = ({
  transactions,
  t,
}: TransactionExportArgs) => {
  const headers = [
    t("data-table.headings.date"),
    t("data-table.headings.category"),
    t("data-table.headings.account"),
    t("data-table.headings.amount"),
    t("data-table.headings.type"),
    t("data-table.headings.recipient"),
    t("data-table.headings.note"),
  ];

  const data = transactions.map((tx) => ({
    [headers[0]]: tx.date,
    [headers[1]]: tx.category,
    [headers[2]]: tx.account || "-",
    [headers[3]]: tx.amount,
    [headers[4]]: "expense", // Default to expense for simple export if type is missing
    [headers[5]]: tx.recipient || "-",
    [headers[6]]: tx.note || "-",
  }));

  const csv = Papa.unparse(data);
  triggerCSVDownload(csv, "transactions");
};

// Budgets export
export const exportBudgetsToCSV = ({
  budgetHeadings,
  budgets,
}: BudgetExportArgs) => {
  if (!budgets || budgets.length === 0) {
    console.warn("No budgets to export.");
    return;
  }

  const headers = budgetHeadings.slice(0, -1); // Remove "action" column

  const data = budgets.map((budget) => ({
    [headers[0]]: budget.category,
    [headers[1]]: (budget.allocated ?? 0).toFixed(2),
    [headers[2]]: (budget.ist ?? 0).toFixed(2), // IST column
    [headers[3]]: (budget.spent ?? 0).toFixed(2), // Spent column
    [headers[4]]: (budget.remaining ?? 0).toFixed(2),
    [headers[5]]: `${(budget.progress ?? 0).toFixed(1)}%`,
    [headers[6]]: budget.month || (new Date().getMonth() + 1),
    [headers[7]]: budget.year || new Date().getFullYear(),
  }));

  const csv = Papa.unparse(data);
  triggerCSVDownload(csv, "budgets");
};

// Financial accounts export
export const exportFinancialAccountsToCSV = ({
  accountTableHeadings,
  accounts,
}: FinancialAccountExportArgs) => {
  if (!accounts || accounts.length === 0) {
    console.warn("No accounts to export.");
    return;
  }

  const headers = accountTableHeadings.slice(0, -1);

  const data = accounts.map((acc) => ({
    [headers[0]]: acc.name,
    [headers[1]]: acc.type,
    [headers[2]]: acc.iban || acc.note || "-",
    [headers[3]]: acc.balance.toFixed(2),
  }));

  const csv = Papa.unparse(data);
  triggerCSVDownload(csv, "accounts");
};

// Latest transfers export
export const exportLatestTransfersToCSV = ({
  tableHeadings,
  transfers,
}: LatestTranfersExportArgs) => {
  if (!transfers || transfers.length === 0) {
    console.warn("No transfers to export.");
    return;
  }

  const headers = tableHeadings;

  const data = transfers.map((transfer) => ({
    [headers[0]]: new Date(transfer.date).toLocaleDateString(),
    [headers[1]]: transfer.source,
    [headers[2]]: transfer.destination,
    [headers[3]]: transfer.note || "-",
    [headers[4]]: transfer.amount.toFixed(2),
  }));

  const csv = Papa.unparse(data);
  triggerCSVDownload(csv, "transfers");
};

// Monthly Reports (Trend) export
export const exportMonthlyReportsToCSV = ({
  tableHeadings,
  monthlyReports,
}: MonthlyReportExportArgs) => {
  if (!monthlyReports || monthlyReports.length === 0) {
    console.warn("No monthly reports to export.");
    return;
  }

  const headers = tableHeadings;

  const data = monthlyReports.map((report) => ({
    [headers[0]]: report.month,
    [headers[1]]: report.income.toFixed(2),
    [headers[2]]: report.expenses.toFixed(2),
    [headers[3]]: report.balance.toFixed(2),
  }));

  const csv = Papa.unparse(data);
  triggerCSVDownload(csv, "monthly-reports-trend");
};

// Full Report Export (Summary + Categories + Trend)
export const exportFullReportToCSV = ({
  summary,
  categories,
  monthlyReports,
  t,
  trendHeadings,
}: FullReportExportArgs) => {
  const csvRows: any[][] = [];

  // 1. Summary Section
  csvRows.push([t("summary-title")]);
  csvRows.push([t("income"), summary?.income.toFixed(2) || "0.00"]);
  csvRows.push([t("expenses"), summary?.expense.toFixed(2) || "0.00"]);
  csvRows.push([t("balance"), summary?.balance.toFixed(2) || "0.00"]);
  csvRows.push([
    t("savings-rate"),
    `${(summary?.savingRate || 0).toFixed(1)}%`,
  ]);
  csvRows.push([]); // Empty row as separator

  // 2. Categories Section
  csvRows.push([t("categories-title")]);
  csvRows.push([t("category"), t("amount")]);
  if (categories && categories.length > 0) {
    categories.forEach((cat) => {
      csvRows.push([cat.name, cat.totalAmount.toFixed(2)]);
    });
  } else {
    csvRows.push([t("no-data")]);
  }
  csvRows.push([]); // Empty row as separator

  // 3. Trend Section
  csvRows.push([t("trend-title")]);
  csvRows.push(trendHeadings);
  if (monthlyReports && monthlyReports.length > 0) {
    monthlyReports.forEach((report) => {
      csvRows.push([
        report.month,
        report.income.toFixed(2),
        report.expenses.toFixed(2),
        report.balance.toFixed(2),
      ]);
    });
  } else {
    csvRows.push([t("no-data")]);
  }

  const csv = Papa.unparse(csvRows);
  triggerCSVDownload(csv, "financial-report");
};

export const exportCategoriesToCSV = ({
  categories,
  t,
}: CategoriesExportArgs) => {
  if (!categories || categories.length === 0) {
    console.warn("No categories to export.");
    return;
  }

  const headers = [
    t("data-table.headings.category"),
    t("data-table.headings.amount"),
  ];

  const data = categories.map((cat) => ({
    [headers[0]]: cat.name,
    [headers[1]]: cat.totalAmount.toFixed(2),
  }));

  const csv = Papa.unparse(data);
  triggerCSVDownload(csv, "categories");
};

// Saving Goals export
export const exportSavingGoalsToCSV = ({ goals, t }: SavingGoalsExportArgs) => {
  if (!goals || goals.length === 0) {
    console.warn("No saving goals to export.");
    return;
  }

  const headers = [
    t("sidebar-header.dialog.labels.name.title"),  // Name
    t("active-goals-section.cards.tax-reserves.content.goal"),  // Goal Amount
    t("active-goals-section.cards.tax-reserves.content.saved"),  // Saved
    t("active-goals-section.cards.tax-reserves.content.rest"),  // Remaining
    t("active-goals-section.cards.tax-reserves.content.monthly-allocated"),  // Allocated
    "Progress",
    t("active-goals-section.cards.tax-reserves.content.account.title"),  // Account
    t("active-goals-section.cards.tax-reserves.content.due"),  // Due
    "Status",
  ];

  const data = goals.map((goal) => {
    const remaining = Math.max(0, (goal.goalAmount ?? 0) - (goal.amountSaved ?? 0));
    const goalAmount = Number(goal.goalAmount ?? 0);
    const amountSaved = Number(goal.amountSaved ?? 0);
    // Allow progress > 100%
    const progress = goalAmount > 0
      ? (amountSaved / goalAmount) * 100
      : 0;

    let status = "Not Started";
    if (amountSaved >= goalAmount) status = "Achieved";
    else if (amountSaved > 0) status = "In Progress";

    // Add overdue check if needed, but simple status requested for now
    if (goal.dueDate && new Date(goal.dueDate) < new Date() && amountSaved < goalAmount) {
      status = "Overdue";
    }

    return {
      [headers[0]]: goal.name,
      [headers[1]]: goalAmount.toFixed(2),
      [headers[2]]: amountSaved.toFixed(2),
      [headers[3]]: remaining.toFixed(2),
      [headers[4]]: (goal.monthlyAllocation ?? 0).toFixed(2),
      [headers[5]]: `${progress.toFixed(1)}%`,
      [headers[6]]: goal.financialAccountId || "-",
      [headers[7]]: goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : "N/A",
      [headers[8]]: status,
    };
  });

  const csv = Papa.unparse(data);
  triggerCSVDownload(csv, "saving-goals");
};

// CSV Templates
export const exportTransactionsTemplateToCSV = (t: (key: string) => string) => {
  const headers = [
    t("data-table.headings.date"),
    t("data-table.headings.category"),
    t("data-table.headings.account"),
    t("data-table.headings.amount"),
    t("data-table.headings.type"),
    t("data-table.headings.recipient"),
    t("data-table.headings.note"),
  ];

  const csv = Papa.unparse([headers]);
  triggerCSVDownload(csv, "transactions-template");
};

export const exportBudgetsTemplateToCSV = (t: (key: string) => string) => {
  const headers = [
    t("data-table.headings.category"),
    t("data-table.headings.budget"),
    t("data-table.headings.ist"),
    t("data-table.headings.month"),
    t("data-table.headings.year"),
    t("sidebar-header.dialog.labels.warning"),
    t("sidebar-header.dialog.labels.color-marker.title"),
  ];

  const csv = Papa.unparse([headers]);
  triggerCSVDownload(csv, "budgets-template");
};

export const exportAccountsTemplateToCSV = (t: (key: string) => string) => {
  const headers = [
    t("sidebar-header.new-account-dialog.labels.name.title"),
    t("sidebar-header.new-account-dialog.labels.type.title"),
    t("sidebar-header.new-account-dialog.labels.balance"),
    t("sidebar-header.new-account-dialog.labels.iban.title"),
    t("sidebar-header.new-account-dialog.labels.note.title"),
  ];
  const csv = Papa.unparse([headers]);
  triggerCSVDownload(csv, "accounts-template");
};

export const exportTransfersTemplateToCSV = (t: (key: string) => string) => {
  const headers = [
    t("data-table.headings.date"),
    t("data-table.headings.from"),
    t("data-table.headings.to"),
    t("data-table.headings.note"),
    t("data-table.headings.amount"),
  ];
  const csv = Papa.unparse([headers]);
  triggerCSVDownload(csv, "transfers-template");
};

export const exportSavingGoalsTemplateToCSV = (t: (key: string) => string) => {
  const headers = [
    t("sidebar-header.dialog.labels.name.title"),
    t("sidebar-header.dialog.labels.goal-amount"),
    t("sidebar-header.dialog.labels.saved-amount"),
    t("sidebar-header.dialog.labels.monthly-allocation"),
    t("sidebar-header.dialog.labels.account.title"),
    t("sidebar-header.dialog.labels.due-date.title"),
  ];

  const csv = Papa.unparse([headers]);
  triggerCSVDownload(csv, "saving-goals-template");
};
