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
import { subMonths, subQuarters, subYears, format, startOfMonth, startOfQuarter, startOfYear, endOfMonth, endOfQuarter, endOfYear } from "date-fns";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMonthlyReports, getExpenseCategoriesProgress, getReportSummary, type MonthlyReport, type ExpenseCategoryProgress, type ReportSummary } from "@/lib/api";
import { reportKeys } from "@/lib/query-keys";

export function AnalysisTable({
  initialFrom,
  initialTo,
}: {
  initialFrom?: string;
  initialTo?: string;
}) {
  const t = useTranslations("main-dashboard.report-page");
  const commonT = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const hubId = searchParams.get("hub");
  const from = searchParams.get("from") || initialFrom;
  const to = searchParams.get("to") || initialTo;
  const groupBy = (searchParams.get("group_by") as "month" | "quarter" | "year") ?? "month";

  // If no explicit 'from' is provided, we default the trend chart to a wider range
  const trendFrom = searchParams.get("from") || (() => {
    const now = new Date();
    if (groupBy === "quarter") return startOfQuarter(subQuarters(now, 4)).toISOString();
    if (groupBy === "year") return startOfYear(subYears(now, 2)).toISOString();
    return startOfMonth(subMonths(now, 8)).toISOString(); // Default 9 months including current
  })();

  const {
    data: monthlyReports,
    isLoading: reportsLoading,
    error: reportsError,
  } = useQuery<MonthlyReport[]>({
    queryKey: reportKeys.monthly(hubId, trendFrom, to, groupBy),
    queryFn: async () => {
      if (!hubId) throw new Error("Hub ID is required");
      const res = await getMonthlyReports(hubId, trendFrom, to, groupBy);
      if (!res.success) throw new Error(res.message);
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const {
    data: expenseCategoriesProgress,
    isLoading: expenseCategoriesProgressLoading,
    error: expenseCategoriesProgressError,
  } = useQuery<ExpenseCategoryProgress[]>({
    queryKey: reportKeys.expenseCategoriesProgress(hubId, from, to),
    queryFn: async () => {
      if (!hubId) throw new Error("Hub ID is required");
      const res = await getExpenseCategoriesProgress(hubId, from, to);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
    enabled: !!hubId,
  });

  // Context-aware summary timeframe
  const summaryTimeframe = searchParams.get("from") || searchParams.get("to")
    ? { from, to }
    : (() => {
      const now = new Date();
      if (groupBy === "quarter") return {
        from: startOfQuarter(now).toISOString(),
        to: endOfQuarter(now).toISOString(),
        label: t("analysis-table-data.badge-this-quarter")
      };
      if (groupBy === "year") return {
        from: startOfYear(now).toISOString(),
        to: endOfYear(now).toISOString(),
        label: t("analysis-table-data.badge-this-year")
      };
      return {
        from,
        to,
        label: t("analysis-table-data.badge-last-month")
      };
    })();

  const {
    data: summary,
  } = useQuery<ReportSummary>({
    queryKey: reportKeys.summary(hubId, summaryTimeframe.from, summaryTimeframe.to),
    queryFn: async () => {
      if (!hubId) throw new Error("Hub ID is required");
      const res = await getReportSummary(hubId, summaryTimeframe.from, summaryTimeframe.to);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
    enabled: !!hubId,
  });

  const handleGroupByChange = (value: string) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("group_by", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;

  const badgeLabel = searchParams.get("from") || searchParams.get("to")
    ? t("analysis-table-data.badge-period")
    : (summaryTimeframe as any).label;

  const trendTitle = groupBy === "month"
    ? t("detailed-table.income-exp.title")
    : groupBy === "quarter"
      ? t("detailed-table.income-exp.title-quarter")
      : t("detailed-table.income-exp.title-year");

  const tableHeadings: string[] = [
    groupBy === "month"
      ? t("detailed-table.income-exp.data-table.headings.month")
      : groupBy === "quarter"
        ? t("detailed-table.income-exp.data-table.headings.quarter")
        : t("detailed-table.income-exp.data-table.headings.year"),
    t("detailed-table.income-exp.data-table.headings.income"),
    t("detailed-table.income-exp.data-table.headings.expenses"),
    t("detailed-table.income-exp.data-table.headings.balance"),
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
              {badgeLabel}
              {income.toLocaleString("de-CH", { minimumFractionDigits: 2 })}{" "}
              {t("analysis-table-data.badge-income")}
              {expense.toLocaleString("de-CH", { minimumFractionDigits: 2 })}{" "}
              {t("analysis-table-data.badge-expense")}
            </Badge>
          </div>
          <ToggleGroup
            className="dark:border-border-blue bg-dark-blue-background border"
            type="single"
            value={groupBy}
            onValueChange={handleGroupByChange}
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
                  {expenseCategoriesProgressError instanceof Error
                    ? expenseCategoriesProgressError.message
                    : "Failed to load expense categories progress"}
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
                          {commonT("currency")}{" "}
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
            <h2 className="mb-4 font-bold">{trendTitle}</h2>
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
                        {reportsError instanceof Error
                          ? reportsError.message
                          : "Failed to load monthly reports"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : monthlyReports === null || monthlyReports === undefined || reportsLoading ? (
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
