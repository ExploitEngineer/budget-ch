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

interface ProgressChart {
  title: string;
  amount: string;
  value: number;
}

export function AnalysisTable() {
  const t = useTranslations("main-dashboard.report-page");

  const { monthlyReports, reportsError, fetchMonthlyReports, reportsLoading } =
    useReportStore();

  useEffect(() => {
    fetchMonthlyReports();
  }, []);

  const progressChart: ProgressChart[] = [
    {
      title: t("analysis-table-data.exp-by-cat.progress.groceries"),
      amount: "CHF 820.00",
      value: 40,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.rent"),
      amount: "CHF 1’920.00",
      value: 70,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.transportation"),
      amount: "CHF 320.00",
      value: 20,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.restaurant"),
      amount: "CHF 460.00",
      value: 30,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.household"),
      amount: "CHF 280.00",
      value: 15,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.leisure"),
      amount: "CHF 190.00",
      value: 10,
    },
  ];

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
              {t("analysis-table-data.badge")}
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
              {progressChart.map((data) => (
                <div key={data.title} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3>{data.title}</h3>
                    <h3>{data.amount}</h3>
                  </div>
                  <Progress value={data.value} />
                </div>
              ))}
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
