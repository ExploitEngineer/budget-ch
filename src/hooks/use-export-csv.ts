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
  exportMonthlyReportsToCSV,
  exportFullReportToCSV,
} from "@/lib/utils/export-csv";
import type {
  TransactionExportArgs,
  BudgetExportArgs,
  FinancialAccountExportArgs,
  LatestTranfersExportArgs,
  CategoriesExportArgs,
  SavingGoalsExportArgs,
  MonthlyReportExportArgs,
  FullReportExportArgs,
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
    "main-dashboard.saving-goals-page",
  );
  const accountT = useTranslations("main-dashboard.content-page");
  const reportExportT = useTranslations("main-dashboard.report-page.export");

  const budgetDataTableHeadings: string[] = [
    budgetT("data-table.headings.category"),
    budgetT("data-table.headings.budget"),
    budgetT("data-table.headings.ist"),
    budgetT("data-table.headings.spent"),
    budgetT("data-table.headings.rest"),
    budgetT("data-table.headings.progress"),
    budgetT("data-table.headings.month"),
    budgetT("data-table.headings.year"),
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
  const trendTableHeadings: string[] = [
    categoriesT("income-exp.data-table.headings.month"),
    categoriesT("income-exp.data-table.headings.income"),
    categoriesT("income-exp.data-table.headings.expenses"),
    categoriesT("income-exp.data-table.headings.balance"),
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
          transactionT("data-table.headings.type"),
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
          budgetT("data-table.headings.month"),
          budgetT("data-table.headings.year"),
          budgetT("sidebar-header.dialog.labels.warning"),
          budgetT("sidebar-header.dialog.labels.color-marker.title"),
        ],
      },
      {
        title: "Saving Goals Template",
        headers: [
          savingGoalsT("sidebar-header.dialog.labels.name.title"),
          savingGoalsT("sidebar-header.dialog.labels.goal-amount"),
          savingGoalsT("sidebar-header.dialog.labels.saved-amount"),
          savingGoalsT("sidebar-header.dialog.labels.monthly-allocation"),
          savingGoalsT("sidebar-header.dialog.labels.account.title"),
          savingGoalsT("sidebar-header.dialog.labels.due-date.title"),
        ],
      },
      {
        title: "Accounts Template",
        headers: [
          accountT("sidebar-header.new-account-dialog.labels.name.title"),
          accountT("sidebar-header.new-account-dialog.labels.type.title"),
          accountT("sidebar-header.new-account-dialog.labels.balance"),
          accountT("sidebar-header.new-account-dialog.labels.iban.title"),
          accountT("sidebar-header.new-account-dialog.labels.note.title"),
        ],
      },
      {
        title: "Transfers Template",
        headers: [
          latestTransfert("data-table.headings.date"),
          latestTransfert("data-table.headings.from"),
          latestTransfert("data-table.headings.to"),
          latestTransfert("data-table.headings.note"),
          latestTransfert("data-table.headings.amount"),
        ],
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
    link.download = `all-templates-${new Date().toISOString().split("T")[0]
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
      exportSavingGoalsToCSV({ goals, t: useTranslations("main-dashboard.saving-goals-page.active-goals-section") }),
    exportMonthlyReports: ({
      monthlyReports,
    }: Omit<MonthlyReportExportArgs, "tableHeadings">) =>
      exportMonthlyReportsToCSV({
        tableHeadings: trendTableHeadings,
        monthlyReports,
      }),

    // CSV Templates
    exportTransactionTemplate: () =>
      exportTransactionsTemplateToCSV(transactionT),
    exportBudgetTemplate: () => exportBudgetsTemplateToCSV(budgetT),
    exportAccountTemplate: () =>
      exportAccountsTemplateToCSV(accountT),
    exportTransferTemplate: () => exportTransfersTemplateToCSV(latestTransfert),
    exportSavingGoalTemplate: () =>
      exportSavingGoalsTemplateToCSV(savingGoalsT),

    // (JSON) export
    exportAllDataJSON: (data: Record<string, any>) => exportAllDataToJSON(data),

    // All csv templates export
    exportALLCSVTemplates,

    // Full Report Export
    exportFullReport: (args: Omit<FullReportExportArgs, "t" | "trendHeadings"> & { groupBy: string }) => {
      const exportT = (key: string) => reportExportT(key);

      const dynamicTrendHeadings = [
        categoriesT(`income-exp.data-table.headings.${args.groupBy}`),
        categoriesT("income-exp.data-table.headings.income"),
        categoriesT("income-exp.data-table.headings.expenses"),
        categoriesT("income-exp.data-table.headings.balance"),
      ];

      return exportFullReportToCSV({
        ...args,
        t: exportT,
        trendHeadings: dynamicTrendHeadings,
      });
    },
  };
};
