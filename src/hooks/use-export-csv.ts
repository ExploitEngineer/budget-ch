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
import Papa from "papaparse";

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
    budgetT("data-table.headings.spent"),
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

  // Modified function to combine all templates into one CSV
  const exportALLCSVTemplates = () => {
    const templates = [
      {
        title: "Transactions Template",
        headers: [
          transactionT("data-table.headings.date"),
          transactionT("data-table.headings.category"),
          transactionT("data-table.headings.account"),
          transactionT("data-table.headings.amount"),
          transactionT("data-table.headings.recipient"),
          transactionT("data-table.headings.note"),
        ],
      },
      {
        title: "Budgets Template",
        headers: [
          budgetT("data-table.headings.category"),
          budgetT("data-table.headings.budget"),
          budgetT("data-table.headings.ist"),
          budgetT("data-table.headings.rest"),
          budgetT("data-table.headings.progress"),
        ],
      },
      {
        title: "Saving Goals Template",
        headers: [
          savingGoalsT("cards.tax-reserves.content.goal"),
          savingGoalsT("cards.tax-reserves.content.saved"),
          savingGoalsT("cards.tax-reserves.content.remaining"),
          savingGoalsT("cards.tax-reserves.content.monthly-allocated"),
          savingGoalsT("cards.tax-reserves.content.account.title"),
          "Account Type",
        ],
      },
      {
        title: "Accounts Template",
        headers: accountTableHeadings,
      },
      {
        title: "Transfers Template",
        headers: tableHeadings,
      },
    ];

    const csvRows: string[][] = [];
    templates.forEach((template) => {
      csvRows.push([template.title]);
      csvRows.push(template.headers);
      csvRows.push([]);
    });

    const csv = Papa.unparse(csvRows);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `all-templates-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    // (JSON) export
    exportAllDataJSON: (data: Record<string, any>) => exportAllDataToJSON(data),

    // All csv templates export
    exportALLCSVTemplates,
  };
};
