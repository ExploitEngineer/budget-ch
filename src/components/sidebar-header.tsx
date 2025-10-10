"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  File,
  Download,
  ChevronRight,
  Search,
  MessageSquare,
  Check,
} from "lucide-react";
import DashBoardDialog from "./dialogs/dashboard-dialog";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import TransferDialog from "@/app/me/accounts/_components/transfer-dialog";
import FilterDialog from "@/app/me/reports/_components/filter-dialog";
import BudgetDialog from "@/app/me/budgets/_components/budget-dialog";
import SavingsGoalMainDialog from "@/app/me/budgets/_components/saving-goals-main-dialog";
import NewAccountDialog from "@/app/me/accounts/_components/new-account-dialog";
import TransactionEditDialog from "@/app/me/transactions/_components/transactions-edit-dialog";

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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState(
    new Date(today.getFullYear(), today.getMonth()),
  );
  const pathname = usePathname();
  const route = pathname.split("/").pop();

  const goToPrevMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };
  const goToNextMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleSearchFocus = () => {
    if (window.innerWidth < 640) setIsSearchExpanded(true);
  };
  const handleSearchBlur = () => {
    if (window.innerWidth < 640 && searchQuery === "")
      setIsSearchExpanded(false);
  };

  return (
    <header className="relative mb-2 flex flex-col gap-2 px-2 pt-6">
      <div className="flex w-full flex-wrap items-center gap-3 px-4 sm:justify-between">
        <div className="flex shrink-0 items-center">
          <SidebarTrigger className="-ml-1 cursor-pointer lg:mt-0" />
          <Separator
            orientation="vertical"
            className="mr-2 ml-2 data-[orientation=vertical]:h-4 lg:mt-0"
          />
        </div>

        <div
          className={`relative min-w-[2.5rem] flex-1 transition-all duration-300 ${
            isSearchExpanded ? "max-sm:flex-1" : "max-sm:w-10"
          }`}
        >
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 cursor-pointer"
            onClick={handleSearchFocus}
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholder={t("sidebar.header.search")}
            className={`!bg-blue-background dark:border-border-blue rounded-lg py-5 pr-3 pl-9 transition-all duration-300 ${
              isSearchExpanded
                ? "w-full opacity-100"
                : "w-10 opacity-0 sm:w-full sm:opacity-100"
            }`}
          />
        </div>

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

        <div
          className={`flex flex-wrap items-center justify-end gap-4 transition-all duration-300 ${
            isSearchExpanded ? "hidden sm:flex" : "flex"
          }`}
        >
          {route === "dashboard" && <DashBoardDialog />}

          {route === "transactions" && (
            <TransactionEditDialog variant="gradient" />
          )}

          {route === "budgets" && <BudgetDialog />}

          {route === "saving-goals" && <SavingsGoalMainDialog />}

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
                className="dark:border-border-blue !bg-dark-blue-background flex items-center gap-2"
              >
                <Download />
                <span className="hidden sm:block">{t("export-json")}</span>
              </Button>
              <Button className="btn-gradient flex items-center gap-2 dark:text-white">
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
        <div className="bg-blue-background flex w-full items-center justify-between gap-2 rounded-lg border py-1">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-center text-sm font-medium whitespace-nowrap">
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
