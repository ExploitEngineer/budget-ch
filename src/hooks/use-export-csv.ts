"use client";

import { useTranslations } from "next-intl";
import {
  exportBudgetsToCSV,
  exportCategoriesToCSV,
  exportFinancialAccountsToCSV,
  exportLatestTransfersToCSV,
  exportTransactionsToCSV,
  exportSavingGoalsToCSV,
  exportTransactionsTemplateToCSV,
  exportBudgetsTemplateToCSV,
  exportAccountsTemplateToCSV,
  exportSavingGoalsTemplateToCSV,
  exportTransfersTemplateToCSV,
} from "@/lib/utils/export-csv";
import type {
  TransactionExportArgs,
  BudgetExportArgs,
  FinancialAccountExportArgs,
  LatestTranfersExportArgs,
  CategoriesExportArgs,
  SavingGoalsExportArgs,
} from "@/lib/utils/export-csv";
import { exportAllDataToJSON } from "@/lib/utils/export-json";

export const useExportCSV = () => {
  const transactionT = useTranslations("main-dashboard.transactions-page");
  const categoriesT = useTranslations(
    "main-dashboard.report-page.detailed-table",
  );
  const budgetT = useTranslations("main-dashboard.budgets-page");
  const accountTablet = useTranslations(
    "main-dashboard.content-page.data-table",
  );
  const latestTransfert = useTranslations(
    "main-dashboard.content-page.latest-tranfers-section",
  );
  const savingGoalsT = useTranslations(
    "main-dashboard.saving-goals-page.active-goals-section",
  );

  const budgetDataTableHeadings: string[] = [
    budgetT("data-table.headings.category"),
    budgetT("data-table.headings.budget"),
    budgetT("data-table.headings.ist"),
    budgetT("data-table.headings.rest"),
    budgetT("data-table.headings.progress"),
    budgetT("data-table.headings.action"),
  ];

  const accountTableHeadings: string[] = [
    accountTablet("headings.name"),
    accountTablet("headings.type"),
    accountTablet("headings.iban"),
    accountTablet("headings.balance"),
    accountTablet("headings.action"),
  ];

  const tableHeadings: string[] = [
    latestTransfert("data-table.headings.date"),
    latestTransfert("data-table.headings.from"),
    latestTransfert("data-table.headings.to"),
    latestTransfert("data-table.headings.note"),
    latestTransfert("data-table.headings.amount"),
  ];

  return {
    exportTransactions: ({ transactions }: Omit<TransactionExportArgs, "t">) =>
      exportTransactionsToCSV({ transactions, t: transactionT }),
    exportBudgets: ({ budgets }: Omit<BudgetExportArgs, "budgetHeadings">) =>
      exportBudgetsToCSV({ budgetHeadings: budgetDataTableHeadings, budgets }),
    exportAccounts: ({
      accounts,
    }: Omit<FinancialAccountExportArgs, "accountTableHeadings">) =>
      exportFinancialAccountsToCSV({ accountTableHeadings, accounts }),
    exportTransfers: ({
      transfers,
    }: Omit<LatestTranfersExportArgs, "tableHeadings">) =>
      exportLatestTransfersToCSV({ tableHeadings, transfers }),
    exportCategories: ({ categories }: Omit<CategoriesExportArgs, "t">) =>
      exportCategoriesToCSV({ categories, t: categoriesT }),
    exportSavingGoals: ({ goals }: Omit<SavingGoalsExportArgs, "t">) =>
      exportSavingGoalsToCSV({ goals, t: savingGoalsT }),

    // CSV Templates
    exportTransactionTemplate: () =>
      exportTransactionsTemplateToCSV(transactionT),
    exportBudgetTemplate: () => exportBudgetsTemplateToCSV(budgetT),
    exportAccountTemplate: () =>
      exportAccountsTemplateToCSV(accountTableHeadings),
    exportTransferTemplate: () => exportTransfersTemplateToCSV(tableHeadings),
    exportSavingGoalTemplate: () =>
      exportSavingGoalsTemplateToCSV(savingGoalsT),
    exportAllDataJSON: (data: Record<string, any>) => exportAllDataToJSON(data),
  };
};
