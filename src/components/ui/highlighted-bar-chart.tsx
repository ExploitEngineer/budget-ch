"use client";

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CustomTooltipProps,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useReportStore } from "@/store/report-store";
import { Spinner } from "@/components/ui/spinner";

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "url(#bar-gradient)",
  },
} satisfies ChartConfig;

const ALL_MONTHS = [
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

export function HighlightedBarChart() {
  const t = useTranslations("main-dashboard");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { monthlyReports, fetchMonthlyReports, reportsLoading, reportsError } =
    useReportStore();

  useEffect(() => {
    fetchMonthlyReports();
  }, [fetchMonthlyReports]);

  const chartData = ALL_MONTHS.map((month) => {
    const found = monthlyReports?.find((report) => {
      const reportMonth = report.month.toLowerCase();
      return reportMonth.includes(month.slice(0, 3).toLowerCase());
    });

    return {
      month,
      expenses: found ? Number(found.expenses) || 0 : 0,
    };
  });

  return (
    <Card className="bg-blue-background dark:border-[#1A2441]">
      <CardHeader>
        <div className="flex w-full items-center justify-between">
          <CardTitle>{t("dashboard-page.chart.primary-title")}</CardTitle>
          <CardTitle className="font-light">
            {t("dashboard-page.chart.secondary-title")}
          </CardTitle>
        </div>
        <Separator className="my-2 dark:bg-[#1A2441]" />
      </CardHeader>

      <CardContent className="flex justify-center">
        {reportsError ? (
          <p className="text-sm text-red-500">{reportsError}</p>
        ) : reportsLoading ? (
          <Spinner />
        ) : (
          <ChartContainer
            className="w-full xl:h-[360px] xl:w-[80%]"
            config={chartConfig}
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              onMouseLeave={() => setActiveIndex(null)}
              barSize={80}
            >
              <defs>
                <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" />
                  <stop offset="100%" stopColor="var(--acc)" />
                </linearGradient>
              </defs>

              <YAxis
                tickFormatter={(value) =>
                  `CHF ${value.toLocaleString("de-CH")}`
                }
                axisLine
                tickLine
                width={80}
                tickMargin={14}
                tick={{ fill: "oklch(0.4 0 0)", fontSize: 12 }}
                style={{ userSelect: "none" }}
              />

              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />

              <ChartTooltip
                cursor={false}
                content={(props: CustomTooltipProps) => (
                  <ChartTooltipContent {...props} hideIndicator hideLabel />
                )}
              />

              <Bar dataKey="expenses" radius={4} fill="url(#bar-gradient)">
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fillOpacity={
                      activeIndex === null ? 1 : activeIndex === index ? 1 : 0.3
                    }
                    stroke={activeIndex === index ? "url(#bar-gradient)" : ""}
                    className="duration-200"
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
