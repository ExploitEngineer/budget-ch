"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useDashboardStore } from "@/store/dashboard-store";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useEffect, useState } from "react";
import { useBudgetStore } from "@/store/budget-store";
import { useAccountStore } from "@/store/account-store";
import { getAccountTransfers } from "@/lib/services/latest-transfers";
import { type TransferData } from "../../accounts/_components/latest-transfers";
import { type Transaction } from "@/lib/types/dashboard-types";
import { useSavingGoalStore } from "@/store/saving-goal-store";

export function Export() {
  const t = useTranslations("main-dashboard.import-export-page.export-section");

  const [transfers, setTransfers] = useState<TransferData[]>([]);

  const { transactions, fetchTransactions } = useDashboardStore();
  const { budgets, fetchBudgets } = useBudgetStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { goals, fetchGoals } = useSavingGoalStore();
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
  } = useExportCSV();

  async function fetchTransfers() {
    try {
      const result = await getAccountTransfers();

      if (!result || !result.status) {
        throw new Error(result?.message || "Unknown error");
      }

      setTransfers((result.data as TransferData[]) || []);
    } catch (err: any) {
      console.error("Error fetching transfers:", err);
    }
  }

  useEffect(() => {
    fetchTransactions();
    fetchBudgets();
    fetchAccounts();
    fetchGoals();
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
      onClick: () => exportBudgets({ budgets }),
    },
    {
      title: t("export-card.buttons.savings-goals"),
      onClick: () => exportSavingGoals({ goals }),
    },
    {
      title: t("export-card.buttons.accounts"),
      onClick: () => exportAccounts({ accounts }),
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
                className="btn-gradient dark:text-foreground w-[30%] cursor-pointer hover:text-white"
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
