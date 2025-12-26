"use client";

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import React, { useState } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMonthlyReports, type MonthlyReport } from "@/lib/api";
import { reportKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";


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
  const commonT = useTranslations("common");

  const chartConfig = {
    expenses: {
      label: t("dashboard-page.budget-health.card-2.title"),
      color: "url(#bar-gradient)",
    },
  } satisfies ChartConfig;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();

  const {
    data: monthlyReports,
    isLoading: reportsLoading,
    error: reportsError,
  } = useQuery<MonthlyReport[]>({
    queryKey: reportKeys.monthly(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getMonthlyReports(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch monthly reports");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const chartData = ALL_MONTHS.map((month, index) => {
    const found = monthlyReports?.find((report) => {
      const reportMonth = report.month.toLowerCase();
      // Match using English months as the DB returns 'Month YYYY' in English
      return reportMonth.includes(month.slice(0, 3).toLowerCase());
    });

    return {
      month: commonT(`months.${index}`),
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
          <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: reportKeys.monthly(hubId) })} />
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
                  `${commonT("currency")} ${value.toLocaleString()}`
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
