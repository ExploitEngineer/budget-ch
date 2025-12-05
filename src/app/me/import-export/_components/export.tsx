"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useEffect, useState } from "react";
import { getAccountTransfers } from "@/lib/services/latest-transfers";
import { useQuery } from "@tanstack/react-query";
import { getFinancialAccounts } from "@/lib/services/financial-account";
import { getRecentTransactions } from "@/lib/services/transaction";
import { getBudgets } from "@/lib/services/budget";
import {
  accountKeys,
  transactionKeys,
  budgetKeys,
  savingGoalKeys,
} from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { type TransferData } from "../../accounts/_components/latest-transfers";
import { type Transaction } from "@/lib/types/dashboard-types";
import { getSavingGoals } from "@/lib/services/saving-goal";
import type { BudgetRow } from "@/lib/types/row-types";
import type { SavingGoal } from "@/db/queries";

export function Export() {
  const t = useTranslations("main-dashboard.import-export-page.export-section");

  const [transfers, setTransfers] = useState<TransferData[]>([]);

  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const { data: budgets } = useQuery<BudgetRow[]>({
    queryKey: budgetKeys.list(hubId),
    queryFn: async () => {
      const res = await getBudgets();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budgets");
      }
      return res.data ?? [];
    },
  });
  const { data: accounts } = useQuery({
    queryKey: accountKeys.list(hubId),
    queryFn: async () => {
      const res = await getFinancialAccounts();
      if (!res.status) {
        throw new Error("Failed to fetch accounts");
      }
      return res.tableData ?? [];
    },
  });
  const { data: transactions } = useQuery({
    queryKey: transactionKeys.recent(hubId),
    queryFn: async () => {
      const res = await getRecentTransactions();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch recent transactions");
      }
      return res.data ?? [];
    },
  });

  const { data: goals } = useQuery<SavingGoal[]>({
    queryKey: savingGoalKeys.list(hubId),
    queryFn: async () => {
      const res = await getSavingGoals();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch saving goals");
      }
      return res.data ?? [];
    },
  });
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
    exportAllDataJSON,
  } = useExportCSV();

  async function fetchTransfers() {
    try {
      const result = await getAccountTransfers();

      if (!result) {
        throw new Error("Financial Account not found");
      }

      setTransfers((result.data as TransferData[]) || []);
    } catch (err: any) {
      console.error("Error fetching transfers:", err);
    }
  }

  useEffect(() => {
    fetchTransfers();
  }, []);

  const buttons = [
    {
      title: t("export-card.buttons.transactions"),
      onClick: () => {
        if (transactions && transactions.length > 0) {
          exportTransactions({
            transactions: transactions as Omit<Transaction, "type">[],
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
      onClick: () => exportTransfers({ transfers }),
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
                  className="!bg-dark-blue-background dark:border-border-blue text-foreground cursor-pointer"
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
                onClick={() =>
                  exportAllDataJSON({
                    transactions,
                    budgets,
                    accounts,
                    goals,
                    transfers,
                  })
                }
                className="btn-gradient dark:text-foreground w-[38%] cursor-pointer hover:text-white"
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
                  className="!bg-dark-blue-background shadow-dark-blue-background dark:border-border-blue text-foreground shadow-4xl cursor-pointer border-dashed"
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
