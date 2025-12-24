"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableRow,
  TableHeader,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import EditBudgetDialog from "./edit-budget-dialog";
import CreateBudgetDialog from "./create-budget-dialog";
import { useState, useMemo } from "react";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useQuery } from "@tanstack/react-query";
import { getBudgets, getBudgetsAmounts } from "@/lib/api";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { BudgetRow } from "@/lib/types/ui-types";
import type { BudgetWithCategory } from "@/lib/types/domain-types";
import { mapBudgetsToRows } from "../budget-adapters";

export function BudgetDataTable() {
  const t = useTranslations("main-dashboard.budgets-page");
  const commonT = useTranslations("common");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

  const { exportBudgets } = useExportCSV();

  const {
    data: domainBudgets,
    isLoading: budgetsLoading,
    error: budgetsError,
  } = useQuery<BudgetWithCategory[]>({
    queryKey: budgetKeys.list(hubId, month, year),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getBudgets(hubId, month, year);
      if (!res.success) {
        throw new Error(res.message || t("data-table.error-loading"));
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  // Convert domain budgets to UI rows using adapter
  const budgets = useMemo(() => {
    if (!domainBudgets) return undefined;
    return mapBudgetsToRows(domainBudgets);
  }, [domainBudgets]);

  const {
    data: amounts,
    isLoading: amountsLoading,
    error: amountsError,
  } = useQuery({
    queryKey: budgetKeys.amounts(hubId, month, year),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getBudgetsAmounts(hubId, month, year);
      if (!res.success) {
        throw new Error(res.message || t("data-table.error-loading"));
      }
      return res.data;
    },
    enabled: !!hubId,
  });

  const allocated = amounts?.totalAllocated ?? null;
  const available = (amounts?.totalAllocated !== undefined && amounts?.totalSpent !== undefined)
    ? amounts.totalAllocated - amounts.totalSpent
    : null;

  const [warnFilter, setWarnFilter] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<"month" | "week">("month");

  // Fetch transactions for weekly calculation
  const { data: transactionsData } = useQuery({
    queryKey: ["transactions", hubId],
    queryFn: async () => {
      if (!hubId) return [];
      const { getTransactions } = await import("@/lib/api");
      const res = await getTransactions(hubId);
      return res.data ?? [];
    },
    enabled: !!hubId && periodFilter === "week",
  });

  const budgetDataTableHeadings: string[] = [
    t("data-table.headings.category"),
    t("data-table.headings.budget"),
    t("data-table.headings.ist"),
    t("data-table.headings.spent"),
    t("data-table.headings.rest"),
    t("data-table.headings.progress"),
    t("data-table.headings.action"),
  ];

  const filteredBudgets = useMemo(() => {
    if (!budgets) return [];

    let processedBudgets = [...budgets];

    // If week filter is active, recalculate spent from transactions
    if (periodFilter === "week" && transactionsData) {
      const { startOfWeek, endOfWeek } = require("date-fns");
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      // Calculate weekly spent per category
      const weeklySpentByCategory = new Map<string, number>();

      transactionsData.forEach((tx: any) => {
        const txDate = new Date(tx.createdAt);
        if (txDate >= weekStart && txDate <= weekEnd && tx.type === "expense" && tx.categoryName) {
          const current = weeklySpentByCategory.get(tx.categoryName) || 0;
          weeklySpentByCategory.set(tx.categoryName, current + Number(tx.amount));
        }
      });

      // Update budgets with weekly spent
      processedBudgets = budgets.map((b) => {
        const weeklySpent = weeklySpentByCategory.get(b.category) || 0;
        return {
          ...b,
          spent: weeklySpent,
          remaining: (b.allocated ?? 0) - weeklySpent,
          progress: b.allocated ? Math.min((weeklySpent / b.allocated) * 100, 100) : 0,
        };
      });
    }

    // Apply warning filter
    if (warnFilter === "warn-80") {
      return processedBudgets.filter((b) => b.progress >= 80 && b.progress < 90);
    } else if (warnFilter === "warn-90") {
      return processedBudgets.filter((b) => b.progress >= 90 && b.progress < 100);
    } else if (warnFilter === "warn-100") {
      return processedBudgets.filter((b) => b.progress >= 100);
    }

    return processedBudgets;
  }, [budgets, warnFilter, periodFilter, transactionsData]);

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{t("data-table.title")}</CardTitle>
            <Badge
              className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
              variant="outline"
            >
              {t("data-table.total-budget")}
              {commonT("currency")} {allocated?.toLocaleString() ?? commonT("loading")} • {t("data-table.rest-budget")}
              {commonT("currency")} {available?.toLocaleString() ?? commonT("loading")}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportBudgets({
                  budgets: budgets ?? null,
                })
              }
              className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
            >
              {t("data-table.buttons.export")}
            </Button>
            <Button
              variant="outline"
              className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
              onClick={() => setWarnFilter(null)}
            >
              {t("data-table.buttons.reset")}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="dark:border-border-blue">
                {budgetDataTableHeadings.map((heading) => (
                  <TableHead
                    key={heading}
                    className="font-bold text-gray-500 dark:text-gray-400/80"
                  >
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetsError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-red-500">
                    {budgetsError.message || "Failed to load budgets"}
                  </TableCell>
                </TableRow>
              ) : budgetsLoading || budgets === undefined ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    {commonT("loading")}
                  </TableCell>
                </TableRow>
              ) : filteredBudgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    {t("data-table.no-budgets")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBudgets.map((row) => {
                  // Find the corresponding domain budget for editing
                  const domainBudget = domainBudgets?.find((b) => b.id === row.id);
                  return (
                    <TableRow key={row.category} className="dark:border-border-blue">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {row.colorMarker && row.colorMarker !== "standard" && (
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full",
                                row.colorMarker === "green" ? "bg-green-500" :
                                  row.colorMarker === "orange" ? "bg-orange-500" :
                                    row.colorMarker === "red" ? "bg-red-500" : ""
                              )}
                            />
                          )}
                          {row.category}
                        </div>
                      </TableCell>
                      <TableCell>{row.allocated !== null ? row.allocated.toLocaleString() : "—"}</TableCell>
                      <TableCell>{row.ist !== null ? row.ist.toLocaleString() : "—"}</TableCell>
                      <TableCell>{row.spent.toLocaleString()}</TableCell>
                      <TableCell>{row.allocated !== null ? row.remaining.toLocaleString() : "—"}</TableCell>
                      <TableCell>
                        <Progress
                          value={row.progress}
                          warningThreshold={row.warningThreshold ?? 80}
                          markerColor={row.colorMarker ?? "standard"}
                        />
                      </TableCell>
                      <TableCell>
                        {row.id ? (
                          <EditBudgetDialog
                            variant="outline"
                            text={t("data-table.edit")}
                            budget={domainBudget}
                          />
                        ) : (
                          <CreateBudgetDialog
                            variant="outline"
                            text={t("data-table.set-budget")}
                            defaultCategory={row.category}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Separator className="bg-border-blue mt-2" />
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            className="dark:border-border-blue bg-dark-blue-background border"
            type="single"
            value={periodFilter}
            onValueChange={(val) => val && setPeriodFilter(val as "month" | "week")}
          >
            <ToggleGroupItem value="month" aria-label="toggle-month">
              {t("data-table.toggle-groups.month")}
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="toggle-week">
              {t("data-table.toggle-groups.week")}
            </ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup
            className="dark:border-border-blue bg-dark-blue-background border"
            type="single"
            value={warnFilter ?? ""}
            onValueChange={(val) => setWarnFilter(val || null)}
          >
            <ToggleGroupItem value="warn-80" aria-label="toggle-warn-80">
              {t("data-table.toggle-groups.warn-80")}
            </ToggleGroupItem>
            <ToggleGroupItem value="warn-90" aria-label="toggle-warn-90">
              {t("data-table.toggle-groups.warn-90")}
            </ToggleGroupItem>
            <ToggleGroupItem value="warn-100" aria-label="toggle-warn-100">
              {t("data-table.toggle-groups.warn-100")}
            </ToggleGroupItem>
          </ToggleGroup>
        </CardFooter>
      </Card>
    </section>
  );
}
