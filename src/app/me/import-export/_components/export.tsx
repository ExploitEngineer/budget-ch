"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useQuery } from "@tanstack/react-query";
import { getAccountTransfers, getFinancialAccounts, getTransactions, getBudgets, getSavingGoals } from "@/lib/api";
import {
  accountKeys,
  transactionKeys,
  budgetKeys,
  savingGoalKeys,
  transferKeys,
} from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { type TransferData } from "../../accounts/_components/latest-transfers";
import { type Transaction } from "@/lib/types/dashboard-types";
import type { BudgetRow, AccountRow, TransactionRow } from "@/lib/types/ui-types";
import type { BudgetWithCategory, FinancialAccount, TransactionWithDetails } from "@/lib/types/domain-types";
import type { SavingGoal } from "@/lib/types/domain-types";
import { mapBudgetsToRows } from "@/app/me/budgets/budget-adapters";
import { mapAccountsToRows } from "@/app/me/accounts/account-adapters";
import { mapTransactionsToRows } from "@/app/me/transactions/transaction-adapters";

export function Export() {
  const t = useTranslations("main-dashboard.import-export-page.export-section");

  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const { data: domainBudgets } = useQuery<BudgetWithCategory[]>({
    queryKey: budgetKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getBudgets(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budgets");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  // Convert domain budgets to UI rows for export
  const budgets = domainBudgets ? mapBudgetsToRows(domainBudgets) : undefined;

  const { data: domainAccounts } = useQuery<FinancialAccount[]>({
    queryKey: accountKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getFinancialAccounts(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch accounts");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  // Convert domain accounts to UI rows for export
  const accounts = domainAccounts ? mapAccountsToRows(domainAccounts) : undefined;

  const { data: domainTransactions } = useQuery<TransactionWithDetails[]>({
    queryKey: transactionKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getTransactions(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch transactions");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  // Convert domain transactions to UI rows for export
  const transactions = domainTransactions ? mapTransactionsToRows(domainTransactions) : undefined;

  const { data: goals } = useQuery<SavingGoal[]>({
    queryKey: savingGoalKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getSavingGoals(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch saving goals");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const { data: transfersData } = useQuery<{ data: TransferData[]; message?: string }>({
    queryKey: transferKeys.list(hubId),
    queryFn: async () => {
      const res = await getAccountTransfers(hubId!);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch transfers");
      }
      return { data: res.data ?? [], message: res.message };
    },
    enabled: !!hubId,
  });
  const transfers = transfersData?.data;
  const {
    exportTransactions,
    exportBudgets,
    exportAccounts,
    exportTransfers,
    exportSavingGoals,
    exportTransactionTemplate,
    exportBudgetTemplate,
    exportAccountTemplate,
    exportTransferTemplate,
    exportSavingGoalTemplate,
    exportGDPRDataJSON,
  } = useExportCSV();

  const buttons = [
    {
      title: t("export-card.buttons.transactions"),
      onClick: () => {
        if (transactions && transactions.length > 0) {
          // Convert TransactionRow to the format expected by exportTransactions
          const exportData = transactions.map(tx => ({
            id: tx.id,
            date: tx.date,
            category: tx.category,
            amount: tx.amount,
            recipient: tx.recipient,
            note: tx.note,
          }));
          exportTransactions({
            transactions: exportData,
          });
        } else {
          console.warn("No transactions to export");
        }
      },
    },
    {
      title: t("export-card.buttons.budgets"),
      onClick: () => exportBudgets({ budgets: budgets ?? null }),
    },
    {
      title: t("export-card.buttons.savings-goals"),
      onClick: () => exportSavingGoals({ goals: goals ?? null }),
    },
    {
      title: t("export-card.buttons.accounts"),
      onClick: () => exportAccounts({ accounts: accounts ?? null }),
    },
    {
      title: t("export-card.buttons.transfers"),
      onClick: () => exportTransfers({ transfers: transfers ?? null }),
    },
  ];

  const templateButtons = [
    {
      title: t("export-card.buttons.transactions"),
      onClick: () => exportTransactionTemplate(),
    },
    {
      title: t("export-card.buttons.budgets"),
      onClick: () => exportBudgetTemplate(),
    },
    {
      title: t("export-card.buttons.savings-goals"),
      onClick: () => exportSavingGoalTemplate(),
    },
    {
      title: t("export-card.buttons.accounts"),
      onClick: () => exportAccountTemplate(),
    },
    {
      title: t("export-card.buttons.transfers"),
      onClick: () => exportTransferTemplate(),
    },
  ];

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge
            variant="outline"
            className="dark:border-border-blue bg-badge-background rounded-full px-3 py-2"
          >
            {t("badge")}
          </Badge>
        </CardHeader>

        <Separator className="dark:bg-border-blue" />

        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-blue-background dark:border-border-blue">
            <CardHeader className="m-0">
              <CardTitle>{t("export-card.title")}</CardTitle>
            </CardHeader>
            <Separator className="dark:bg-border-blue" />
            <CardContent className="mt-3 grid grid-cols-2 gap-3">
              {buttons.map((btn) => (
                <Button
                  key={btn.title}
                  onClick={btn.onClick}
                  variant="outline"
                  className="!bg-dark-blue-background dark:border-border-blue text-foreground cursor-pointer h-auto min-h-10 py-2 text-center whitespace-normal text-xs"
                >
                  {btn.title}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-blue-background dark:border-border-blue">
            <CardHeader>
              <CardTitle>{t("export-json-card.title")}</CardTitle>
            </CardHeader>
            <Separator className="dark:bg-border-blue" />
            <CardContent className="mt-3 flex flex-col gap-3">
              <p>{t("export-json-card.content")}</p>
              <Button
                variant="outline"
                onClick={() => exportGDPRDataJSON()}
                className="btn-gradient dark:text-foreground w-auto cursor-pointer hover:text-white"
              >
                {t("export-json-card.button")}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-blue-background dark:border-border-blue">
            <CardHeader>
              <CardTitle>{t("csv-template-card.title")}</CardTitle>
            </CardHeader>
            <Separator className="dark:bg-border-blue" />
            <CardContent className="mt-3 grid grid-cols-2 gap-3">
              {templateButtons.map((btn) => (
                <Button
                  key={btn.title}
                  onClick={btn.onClick}
                  variant="outline"
                  className="!bg-dark-blue-background shadow-dark-blue-background dark:border-border-blue text-foreground shadow-4xl cursor-pointer border-dashed h-auto min-h-10 py-2 text-center whitespace-normal text-xs"
                >
                  {btn.title}
                </Button>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  );
}
