"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HighlightedBarChart } from "@/components/ui/highlighted-bar-chart";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSavingGoals } from "@/lib/api";
import { savingGoalKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { DashboardSavingsGoals } from "@/lib/types/dashboard-types";
import type { SavingGoal } from "@/lib/types/domain-types";
import { mapSavingGoalsToRows } from "@/app/me/saving-goals/saving-goal-adapters";
import { useMemo } from "react";
import { ErrorState } from "@/components/ui/error-state";

export function BarChartSection() {
  const t = useTranslations("main-dashboard.dashboard-page.progress-cards");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();

  const {
    data: domainSavingGoals,
    isLoading: goalsLoading,
    error: goalsError,
  } = useQuery<SavingGoal[]>({
    queryKey: savingGoalKeys.list(hubId, 3),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getSavingGoals(hubId, 3);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch savings goals");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const savingGoals = useMemo(() => {
    if (!domainSavingGoals) return undefined;
    return mapSavingGoalsToRows(domainSavingGoals) as DashboardSavingsGoals[];
  }, [domainSavingGoals]);

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
          <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: savingGoalKeys.list(hubId, 3) })} />
        ) : savingGoals === undefined || goalsLoading ? (
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
