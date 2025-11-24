"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  File,
  Download,
  ChevronRight,
  MessageSquare,
  Check,
} from "lucide-react";
import TransactionDialog from "./dialogs/transaction-dialog";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import TransferDialog from "@/app/me/accounts/_components/transfer-dialog";
import FilterDialog from "@/app/me/reports/_components/filter-dialog";
import BudgetDialog from "@/app/me/budgets/_components/budget-dialog";
import SavingGoalDialog from "@/app/me/saving-goals/_components/saving-goal-dialog";
import NewAccountDialog from "@/app/me/accounts/_components/new-account-dialog";
import CreateTransactionDialog from "@/app/me/transactions/_components/create-transaction-dialog";
import { getAccountTransfers } from "@/lib/services/latest-transfers";
import type { TransferData } from "@/app/me/accounts/_components/latest-transfers";
import { useSavingGoalStore } from "@/store/saving-goal-store";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFinancialAccounts } from "@/lib/services/financial-account";
import { getRecentTransactions } from "@/lib/services/transaction";
import { getBudgets } from "@/lib/services/budget";
import { accountKeys, transactionKeys, budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { BudgetRow } from "@/lib/types/row-types";

const monthNames: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SidebarHeader() {
  const today = new Date();
  const t = useTranslations("main-dashboard");
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [date, setDate] = useState(
    new Date(today.getFullYear(), today.getMonth()),
  );
  const pathname = usePathname();
  const route = pathname.split("/").pop();

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
  const { goals } = useSavingGoalStore();

  const { exportAllDataJSON, exportALLCSVTemplates } = useExportCSV();

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

  const goToPrevMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };
  const goToNextMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  return (
    <header className="relative mb-2 flex flex-col gap-2 px-2 pt-6">
      <div className="flex w-full flex-wrap items-center justify-between px-4 sm:gap-2">
        <div className="flex shrink-0 items-center">
          <SidebarTrigger className="-ml-1 cursor-pointer lg:mt-0" />
          <Separator
            orientation="vertical"
            className="mr-2 ml-2 data-[orientation=vertical]:h-4 lg:mt-0"
          />
        </div>

        <div
          className={`flex flex-wrap items-center justify-end gap-4 transition-all duration-300`}
        >
          <div
            className={`bg-blue-background hidden items-center gap-2 rounded-lg border px-2 transition-all duration-300 sm:flex`}
          >
            <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-center text-sm font-medium whitespace-nowrap sm:min-w-[120px]">
              {monthNames[date.getMonth()]} {date.getFullYear()}
            </span>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {route === "dashboard" && <TransactionDialog />}

          {route === "transactions" && (
            <CreateTransactionDialog variant="gradient" />
          )}

          {route === "budgets" && <BudgetDialog />}

          {route === "saving-goals" && <SavingGoalDialog />}

          {route === "accounts" && (
            <div className="flex items-center gap-2">
              <TransferDialog />
              <NewAccountDialog variant="gradient" />
            </div>
          )}

          {route === "reports" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="dark:border-border-blue !bg-dark-blue-background flex items-center gap-2"
              >
                <Download />
                <span className="hidden sm:block">{t("export")}</span>
              </Button>
              <FilterDialog />
            </div>
          )}

          {route === "import-export" && (
            <div className="flex items-center gap-2">
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
                className="dark:border-border-blue !bg-dark-blue-background flex cursor-pointer items-center gap-2"
              >
                <Download />
                <span className="hidden sm:block">{t("export-json")}</span>
              </Button>
              <Button
                onClick={exportALLCSVTemplates}
                className="btn-gradient flex cursor-pointer items-center gap-2 dark:text-white"
              >
                <File />
                <span className="hidden sm:block">{t("csv-templates")}</span>
              </Button>
            </div>
          )}

          {route === "settings" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="dark:border-border-blue !bg-dark-blue-background flex items-center gap-2"
              >
                <Download />
                <span className="hidden sm:block">{t("export")}</span>
              </Button>
              <Button className="btn-gradient flex items-center gap-2 dark:text-white">
                <Check />
                <span className="hidden sm:block">{t("save")}</span>
              </Button>
            </div>
          )}

          {route === "help" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="dark:border-border-blue !bg-dark-blue-background flex items-center gap-2"
              >
                <Download />
                <span className="hidden sm:block">{t("diagnose")}</span>
              </Button>
              <Button className="btn-gradient flex items-center gap-2 dark:text-white">
                <MessageSquare />
                <span className="hidden sm:block">{t("support")}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full justify-center px-4 sm:hidden">
        <div className="bg-blue-background flex w-full items-center justify-between gap-2 rounded-lg border">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-center text-xs font-medium whitespace-nowrap sm:text-sm">
            {monthNames[date.getMonth()]} {date.getFullYear()}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
