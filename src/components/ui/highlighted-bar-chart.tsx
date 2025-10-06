"use client";

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import React from "react";
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

const chartData = [
  { month: "January", desktop: 342 },
  { month: "February", desktop: 876 },
  { month: "March", desktop: 512 },
  { month: "April", desktop: 629 },
  { month: "May", desktop: 458 },
  { month: "June", desktop: 781 },
  { month: "July", desktop: 394 },
  { month: "August", desktop: 925 },
  { month: "September", desktop: 647 },
  { month: "October", desktop: 532 },
  { month: "November", desktop: 803 },
  { month: "December", desktop: 271 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "url(#bar-gradient)",
  },
} satisfies ChartConfig;

export function HighlightedBarChart() {
  const t = useTranslations("main-dashboard");
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex w-full items-center justify-between">
          <CardTitle>{t("dashboard-page.chart.primary-title")}</CardTitle>
          <CardTitle className="font-light">
            {t("dashboard-page.chart.secondary-title")}
          </CardTitle>
        </div>
        <Separator className="my-2" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            onMouseLeave={() => setActiveIndex(null)}
            barSize={50}
          >
            <defs>
              <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" />
                <stop offset="100%" stopColor="var(--acc)" />
              </linearGradient>
            </defs>

            <YAxis
              ticks={[0, 300, 600, 900]}
              domain={[0, 900]}
              tickFormatter={(value) => `CHF ${value.toLocaleString("de-CH")}`}
              axisLine={false}
              tickLine={false}
              width={60}
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

            <Bar dataKey="desktop" radius={4} fill="url(#bar-gradient)">
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
      </CardContent>
    </Card>
  );
}
