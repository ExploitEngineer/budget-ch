"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { useReportStore } from "@/store/report-store";
import { useEffect } from "react";

export function AnalysisTable() {
  const t = useTranslations("main-dashboard.report-page");

  const {
    monthlyReports,
    reportsError,
    income,
    expense,
    fetchMonthlyReports,
    reportsLoading,
    expenseCategoriesProgress,
    expenseCategoriesProgressLoading,
    expenseCategoriesProgressError,
    fetchExpenseCategoriesProgress,
  } = useReportStore();

  useEffect(() => {
    fetchMonthlyReports();
    fetchExpenseCategoriesProgress();
  }, []);

  const tableHeadings: string[] = [
    t("income-exp.data-table.headings.month"),
    t("income-exp.data-table.headings.income"),
    t("income-exp.data-table.headings.expenses"),
    t("income-exp.data-table.headings.balance"),
  ];

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{t("analysis-table-data.title")}</CardTitle>{" "}
            <Badge
              className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2 whitespace-pre-wrap"
              variant="outline"
            >
              {t("analysis-table-data.badge-last-month")} {income}{" "}
              {t("analysis-table-data.badge-income")}
              {expense} {t("analysis-table-data.badge-expense")}
            </Badge>
          </div>
          <ToggleGroup
            className="dark:border-border-blue bg-dark-blue-background border"
            type="single"
          >
            <ToggleGroupItem
              className="px-3"
              value="month"
              aria-label="toggle-month"
            >
              {t("analysis-table-data.toggle-groups.month")}
            </ToggleGroupItem>
            <ToggleGroupItem
              className="px-3"
              value="quarter"
              aria-label="toggle-quarter"
            >
              {t("analysis-table-data.toggle-groups.quarter")}
            </ToggleGroupItem>
            <ToggleGroupItem
              className="px-3"
              value="year"
              aria-label="toggle-year"
            >
              {t("analysis-table-data.toggle-groups.year")}
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <Separator className="dark:bg-[#1A2441]" />
        <CardContent className="grid gap-10 lg:grid-cols-2 lg:gap-3">
          <div>
            <h2 className="mb-4 font-bold">
              {t("analysis-table-data.exp-by-cat.title")}
            </h2>
            <div className="flex flex-col gap-3">
              {expenseCategoriesProgressError ? (
                <p className="text-sm text-red-500">
                  {expenseCategoriesProgressError}
                </p>
              ) : expenseCategoriesProgressLoading ? (
                <p className="text-muted-foreground text-sm">{t("loading")}</p>
              ) : expenseCategoriesProgress &&
                expenseCategoriesProgress.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {expenseCategoriesProgress.map((data) => (
                    <div key={data.category} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3>{data.category}</h3>
                        <h3>
                          CHF{" "}
                          {data.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </h3>
                      </div>
                      <Progress value={data.percent} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("no-categories-yet")}
                </p>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <h2 className="mb-4 font-bold">{t("income-exp.title")}</h2>
            <Table>
              <TableHeader>
                <TableRow className="dark:border-border-blue">
                  {tableHeadings.map((heading) => (
                    <TableHead
                      className="font-bold text-gray-500 dark:text-gray-400/80"
                      key={heading}
                    >
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsError ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p className="px-6 text-sm text-red-500">
                        {reportsError}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : monthlyReports === null || reportsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p className="text-muted-foreground px-6 text-sm">
                        {t("loading")}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : monthlyReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p className="text-muted-foreground px-6 text-sm">
                        {t("no-reports")}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyReports.map((row) => (
                    <TableRow
                      className="dark:border-border-blue"
                      key={row.month}
                    >
                      <TableCell>{row.month}</TableCell>
                      <TableCell>{row.income}</TableCell>
                      <TableCell>{row.expenses}</TableCell>
                      <TableCell>{row.balance}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
