"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import DashboardTableAdjustDialog from "./dashboard-table-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui/error-state";
import { getUpcomingRecurringTransactions } from "@/lib/services/transaction";
import { getBudgets } from "@/lib/services/budget";
import { budgetKeys, transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { BudgetWithCategory } from "@/lib/types/domain-types";

export function WarningSection() {
  const t = useTranslations("main-dashboard.dashboard-page");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();

  const {
    data: upcomingTransactions,
    isLoading: upcomingLoading,
    error: upcomingError,
  } = useQuery({
    queryKey: transactionKeys.upcomingRecurring(hubId),
    queryFn: async () => {
      const res = await getUpcomingRecurringTransactions(14, hubId || undefined);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch upcoming transactions");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const {
    data: budgets,
    isLoading: budgetsLoading,
    error: budgetsError,
  } = useQuery({
    queryKey: budgetKeys.list(hubId),
    queryFn: async () => {
      const res = await getBudgets(undefined, undefined, hubId || undefined);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budgets");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const upComingTableHeadings: string[] = [
    t("upcoming-cards.table-data.table-heading.date"),
    t("upcoming-cards.table-data.table-heading.name.title"),
    t("upcoming-cards.table-data.table-heading.account.title"),
    t("upcoming-cards.table-data.table-heading.amount"),
  ];

  const budgetWarnings = budgets ? budgets.filter((b: BudgetWithCategory) => {
    const allocated = Number(b.allocatedAmount ?? 0);
    const carried = Number(b.carriedOverAmount ?? 0);
    const totalAllocated = allocated + (allocated > 0 ? carried : 0);

    const ist = Number(b.spentAmount ?? 0);
    const spent = Number(b.calculatedSpentAmount ?? 0);
    const totalSpent = ist + spent;

    const threshold = b.warningPercentage ?? 80;
    const percent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    return percent >= threshold;
  }) : [];

  return (
    <section className="grid auto-rows-min grid-cols-7 gap-4">
      <Card className="bg-blue-background dark:border-border-blue col-span-full lg:col-span-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("upcoming-cards.title")}</CardTitle>
          <Badge
            variant="outline"
            className="bg-badge-background dark:border-border-blue rounded-full px-2 py-1"
          >
            {t("upcoming-cards.button")}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="overflow-x-auto">
          {upcomingError ? (
            <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: transactionKeys.upcomingRecurring(hubId) })} />
          ) : upcomingLoading || !upcomingTransactions ? (
            <p className="text-muted-foreground px-6 text-sm">
              {t("upcoming-cards.loading")}
            </p>
          ) : (
            <div className="min-w-full">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="dark:border-border-blue">
                    {upComingTableHeadings.map((heading) => (
                      <TableHead
                        className="font-bold text-gray-500 dark:text-gray-400/80"
                        key={heading}
                      >
                        {heading}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="overflow-x-scroll">
                  {upcomingTransactions.length > 0 ? (
                    upcomingTransactions.map((data) => (
                      <TableRow className="dark:border-border-blue" key={data.id}>
                        <TableCell>{data.date}</TableCell>
                        <TableCell>{data.name}</TableCell>
                        <TableCell>{data.account}</TableCell>
                        <TableCell>{data.amount}</TableCell>
                        <TableCell>
                          <DashboardTableAdjustDialog templateId={data.templateId} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-gray-500"
                      >
                        {t("upcoming-cards.no-transactions")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="bg-blue-background dark:border-border-blue col-span-full lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("warning-cards.title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="space-y-3 pt-6">
          {budgetsLoading ? (
            <p className="text-muted-foreground text-sm">{t("upcoming-cards.loading")}</p>
          ) : budgetsError ? (
            <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: budgetKeys.list(hubId) })} />
          ) : budgetWarnings.length > 0 ? (
            budgetWarnings.map((b: BudgetWithCategory) => {
              const allocated = Number(b.allocatedAmount ?? 0);
              const carried = Number(b.carriedOverAmount ?? 0);
              const totalAllocated = allocated + (allocated > 0 ? carried : 0);
              const ist = Number(b.spentAmount ?? 0);
              const spent = Number(b.calculatedSpentAmount ?? 0);
              const totalSpent = ist + spent;
              const percent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
              const isExceeded = percent >= 100;

              return (
                <div
                  key={b.id}
                  className={cn(
                    "bg-badge-background flex items-center gap-2 rounded-full border px-4 py-2",
                    isExceeded ? "border-[#9A4249]" : "border-[#9A6F42]",
                  )}
                >
                  <p className="text-sm">
                    {b.categoryName} {isExceeded ? "budget exceeded" : `budget at ${Math.round(percent)}%`}
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-dark-blue-background rounded-full px-2 py-1 ml-auto"
                  >
                    CHF {totalSpent.toLocaleString()} / {totalAllocated.toLocaleString()}
                  </Badge>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-sm italic">No warnings. Your budget is healthy!</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
