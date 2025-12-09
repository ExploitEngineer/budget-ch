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
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import FilterDialog from "@/app/me/reports/_components/filter-dialog";
import CreateBudgetDialog from "@/app/me/budgets/_components/create-budget-dialog";
import CreateSavingGoalDialog from "@/app/me/saving-goals/_components/create-saving-goal-dialog";
import NewAccountDialog from "@/app/me/accounts/_components/new-account-dialog";
import CreateTransactionDialog from "@/app/me/transactions/_components/create-transaction-dialog";
import { getAccountTransfers } from "@/lib/api";
import { transferKeys } from "@/lib/query-keys";
import type { TransferData } from "@/app/me/accounts/_components/latest-transfers";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useQuery } from "@tanstack/react-query";
import { getFinancialAccounts, getRecentTransactions, getBudgets, getSavingGoals } from "@/lib/api";
import { accountKeys, transactionKeys, budgetKeys, savingGoalKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { BudgetRow } from "@/lib/types/ui-types";
import type { BudgetWithCategory } from "@/lib/types/domain-types";
import type { SavingGoal } from "@/lib/types/domain-types";
import { mapBudgetsToRows } from "@/app/me/budgets/budget-adapters";
import { NotificationsBell } from "@/components/notifications-bell";

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
  const [date, setDate] = useState(
    new Date(today.getFullYear(), today.getMonth()),
  );
  const pathname = usePathname();
  const route = pathname.split("/").pop();

  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  
  // Only fetch export-related data on the import-export page to avoid unnecessary requests
  const isExportPage = route === "import-export";
  
  const { data: transfers } = useQuery<TransferData[]>({
    queryKey: transferKeys.list(),
    queryFn: async () => {
      const res = await getAccountTransfers();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch transfers");
      }
      return res.data ?? [];
    },
    enabled: isExportPage,
  });
  
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
    enabled: isExportPage && !!hubId,
  });

  // Convert domain budgets to UI rows for export
  const budgets = domainBudgets ? mapBudgetsToRows(domainBudgets) : undefined;
  const { data: accounts } = useQuery({
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
    enabled: isExportPage && !!hubId,
  });
  const { data: transactions } = useQuery({
    queryKey: transactionKeys.recent(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getRecentTransactions(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch recent transactions");
      }
      return res.data ?? [];
    },
    enabled: isExportPage && !!hubId,
  });
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
    enabled: isExportPage && !!hubId,
  });

  const { exportAllDataJSON, exportALLCSVTemplates } = useExportCSV();

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
          {/* 
          // Month Switcher
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
          */}

          <NotificationsBell />

          {(route === "dashboard" || route === "transactions") && (
            <CreateTransactionDialog variant="gradient" />
          )}

          {route === "budgets" && <CreateBudgetDialog />}

          {route === "saving-goals" && <CreateSavingGoalDialog />}

          {route === "accounts" && (
            <div className="flex items-center gap-2">
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
