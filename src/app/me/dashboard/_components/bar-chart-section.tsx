"use client";

import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HighlightedBarChart } from "@/components/ui/highlighted-bar-chart";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useDashboardStore } from "@/store/dashboard-store";

export function BarChartSection() {
  const t = useTranslations("main-dashboard.dashboard-page.progress-cards");

  const { goalsLoading, goalsError, savingGoals, fetchSavingsGoals } =
    useDashboardStore();

  useEffect(() => {
    fetchSavingsGoals();
  }, []);

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <HighlightedBarChart />
      </div>
      <Card className="bg-blue-background flex w-full gap-4 lg:col-span-2 lg:flex-col">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />

        {goalsError ? (
          <p className="px-6 text-sm text-red-500">{goalsError}</p>
        ) : savingGoals === null || goalsLoading ? (
          <p className="text-muted-foreground px-6 text-sm">{t("loading")}</p>
        ) : savingGoals.length === 0 ? (
          <p className="text-muted-foreground px-6 text-sm">{t("no-goals")}</p>
        ) : (
          savingGoals.map((card, idx: number) => (
            <CardContent key={idx}>
              <Card className="bg-blue-background dark:border-border-blue dark:shadow-dark-blue-background w-full flex-1 py-4 dark:shadow-2xl">
                <CardContent className="flex items-center gap-3">
                  <AnimatedCircularProgressBar
                    className="h-16 w-16"
                    value={card.value}
                  />
                  <div className="flex flex-col">
                    <CardTitle className="text-xs font-light uppercase">
                      {card.name}
                    </CardTitle>
                    <p className="text-lg font-bold">{card.value + "%"}</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          ))
        )}
      </Card>
    </div>
  );
}
