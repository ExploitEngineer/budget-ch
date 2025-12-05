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
import EditBudgetDialog from "./edit-budget-dialog";
import { useState, useMemo } from "react";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useQuery } from "@tanstack/react-query";
import { getBudgets, getBudgetsAmounts } from "@/lib/services/budget";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { BudgetRow } from "@/lib/types/row-types";

export function BudgetDataTable() {
  const t = useTranslations("main-dashboard.budgets-page");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const { exportBudgets } = useExportCSV();

  const {
    data: budgets,
    isLoading: budgetsLoading,
    error: budgetsError,
  } = useQuery<BudgetRow[]>({
    queryKey: budgetKeys.list(hubId),
    queryFn: async () => {
      const res = await getBudgets();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budgets");
      }
      return res.data ?? [];
    },
  });

  const {
    data: amounts,
    isLoading: amountsLoading,
  } = useQuery({
    queryKey: budgetKeys.amounts(hubId),
    queryFn: async () => {
      const res = await getBudgetsAmounts();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budget amounts");
      }
      const totalAllocated = res.data?.totalAllocated ?? 0;
      const totalSpent = res.data?.totalSpent ?? 0;
      return {
        allocated: totalAllocated,
        spent: totalSpent,
        available: totalAllocated - totalSpent,
      };
    },
  });

  const allocated = amounts?.allocated ?? null;
  const available = amounts?.available ?? null;

  const [warnFilter, setWarnFilter] = useState<string | null>(null);

  const budgetDataTableHeadings: string[] = [
    t("data-table.headings.category"),
    t("data-table.headings.budget"),
    t("data-table.headings.ist"),
    t("data-table.headings.rest"),
    t("data-table.headings.progress"),
    t("data-table.headings.action"),
  ];

  const filteredBudgets = useMemo(() => {
    if (!budgets) return [];

    if (warnFilter === "warn-80") {
      return budgets.filter((b) => b.progress >= 80 && b.progress < 90);
    } else if (warnFilter === "warn-90") {
      return budgets.filter((b) => b.progress >= 90 && b.progress < 100);
    } else if (warnFilter === "warn-100") {
      return budgets.filter((b) => b.progress >= 100);
    }

    return budgets;
  }, [budgets, warnFilter]);

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
              {allocated ?? "..."} • {t("data-table.rest-budget")}
              {available ?? "..."}
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
                  <TableCell colSpan={6} className="text-center text-red-500">
                    {budgetsError.message || "Failed to load budgets"}
                  </TableCell>
                </TableRow>
              ) : budgetsLoading || budgets === undefined ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredBudgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">
                    No Budgets Found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBudgets.map((data) => (
                  <TableRow key={data.id} className="dark:border-border-blue">
                    <TableCell>{data.category}</TableCell>
                    <TableCell>{data.allocated}</TableCell>
                    <TableCell>{data.spent}</TableCell>
                    <TableCell>{data.remaining}</TableCell>
                    <TableCell>
                      <Progress value={data.progress} />
                    </TableCell>
                    <TableCell>
                      <EditBudgetDialog
                        variant="outline"
                        text="Edit"
                        budget={data}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Separator className="bg-border-blue mt-2" />
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            className="dark:border-border-blue bg-dark-blue-background border"
            type="single"
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
