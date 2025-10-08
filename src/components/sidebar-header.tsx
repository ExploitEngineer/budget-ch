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
import TransferDialog from "@/app/me/content/_components/transfer-dialog";
import FilterDialog from "@/app/me/reports/_components/filter-dialog";
import BudgetDialog from "@/app/me/budgets/_components/budget-dialog";
import SavingsGoalMainDialog from "@/app/me/budgets/_components/saving-goals-main-dialog";
import NewAccountDialog from "@/app/me/content/_components/content-dialog";

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

  const goToPrevMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  return (
    <header className="relative mb-2 flex items-center gap-2 px-2 pt-6">
      <div className="flex w-full px-4 lg:items-center">
        <SidebarTrigger className="mt-1 -ml-1 cursor-pointer lg:mt-0" />

        <Separator
          orientation="vertical"
          className="mt-[11px] mr-2 data-[orientation=vertical]:h-4 lg:mt-0"
        />

        <div className="flex w-full flex-col items-center gap-4 lg:flex-row">
          <div className="bg-blue-background relative w-full flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder={t("sidebar.header.search")}
              className="rounded-lg py-5 pr-3 pl-9"
            />
          </div>

          <div className="bg-blue-background flex items-center gap-2 rounded-lg border">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium whitespace-nowrap">
              {monthNames[date.getMonth()]} {date.getFullYear()}
            </span>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {route === "dashboard" || route === "transactions" ? (
            <DashBoardDialog />
          ) : null}

          {route === "budgets" && <BudgetDialog />}

          {route === "saving-goals" && <SavingsGoalMainDialog />}

          {route === "content" && (
            <>
              <NewAccountDialog />
              <TransferDialog />
            </>
          )}

          {route === "reports" && (
            <>
              <Button
                variant="outline"
                className="flex cursor-pointer items-center justify-center gap-2"
              >
                <Download />
                <span>{t("export")}</span>
              </Button>
              <FilterDialog />
            </>
          )}
          {route === "import-export" && (
            <>
              <Button
                variant="outline"
                className="flex cursor-pointer items-center justify-center gap-2"
              >
                <Download />
                <span>{t("export-json")}</span>
              </Button>
              <Button className="btn-gradient flex cursor-pointer items-center justify-center gap-2 dark:text-white">
                <File />
                <span>{t("csv-templates")}</span>
              </Button>
            </>
          )}

          {route === "settings" && (
            <>
              <Button
                variant="outline"
                className="flex cursor-pointer items-center justify-center gap-2"
              >
                <Download />
                <span>{t("export")}</span>
              </Button>
              <Button className="btn-gradient flex cursor-pointer items-center justify-center gap-2 dark:text-white">
                <Check />
                <span>{t("save")}</span>
              </Button>
            </>
          )}

          {route === "help" && (
            <>
              <Button
                variant="outline"
                className="flex cursor-pointer items-center justify-center gap-2"
              >
                <Download />
                <span>{t("diagnose")}</span>
              </Button>
              <Button className="btn-gradient flex cursor-pointer items-center justify-center gap-2 dark:text-white">
                <MessageSquare />
                <span>{t("support")}</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
