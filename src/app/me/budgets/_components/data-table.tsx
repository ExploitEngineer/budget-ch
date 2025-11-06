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
import BudgetEditDialog from "./budget-edit-dialog";
import { useEffect, useState, useMemo } from "react";
import { useBudgetStore } from "@/store/budget-store";

export function BudgetDataTable() {
  const t = useTranslations("main-dashboard.budgets-page");

  const {
    budgets,
    budgetsLoading,
    budgetsError,
    allocated,
    available,
    fetchBudgets,
    fetchBudgetsAmounts,
  } = useBudgetStore();

  const [warnFilter, setWarnFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
    fetchBudgetsAmounts();
  }, [fetchBudgets, fetchBudgetsAmounts]);

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

  const exportToCSV = () => {
    const headers = budgetDataTableHeadings
      .slice(0, -1)
      .map((heading) => heading);

    const csvData = (budgets ?? []).map((budget) => [
      budget.category,
      budget.allocated.toFixed(2),
      budget.spent.toFixed(2),
      budget.remaining.toFixed(2),
      `${budget.progress.toFixed(1)}%`,
      ,
    ]);

    csvData.unshift(headers);

    const csvString = csvData
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `budgets-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              onClick={exportToCSV}
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
                    {budgetsError}
                  </TableCell>
                </TableRow>
              ) : budgetsLoading || budgets === null ? (
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
                      <BudgetEditDialog
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
