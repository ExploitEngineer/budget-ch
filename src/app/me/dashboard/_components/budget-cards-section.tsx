"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getBudgetsAmounts, getBudgetForecast } from "@/lib/services/budget";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { DashboardCards } from "@/lib/types/dashboard-types";
import { useSessionReady } from "@/hooks/use-session-ready";

export function BudgetCardsSection() {
  const t = useTranslations("main-dashboard.dashboard-page");
  const commonT = useTranslations("common");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const { isSessionReady } = useSessionReady();

  const {
    data: budgetAmounts,
    isLoading: budgetLoading,
    error: budgetError,
  } = useQuery({
    queryKey: budgetKeys.amounts(hubId),
    queryFn: async () => {
      const res = await getBudgetsAmounts(undefined, undefined, hubId || undefined);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budgets");
      }
      return res.data;
    },
    enabled: !!hubId && isSessionReady,
  });

  const {
    data: forecastData,
    isLoading: forecastLoading,
  } = useQuery({
    queryKey: budgetKeys.forecast(hubId),
    queryFn: async () => {
      const res = await getBudgetForecast(hubId || undefined);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch forecast");
      }
      return res.data;
    },
    enabled: !!hubId && isSessionReady,
  });

  const totalAllocated = budgetAmounts?.totalAllocated ?? 0;
  const totalSpent = budgetAmounts?.totalSpent ?? 0;
  const available = totalAllocated - totalSpent;
  const percent =
    totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const isLoading = budgetLoading || budgetAmounts === undefined || forecastLoading;

  const cards: DashboardCards[] = [
    {
      title: t("cards.card-1.title"),
      content: `${commonT("currency")} ${(totalAllocated).toLocaleString()}`,
      badge: t("cards.card-1.simple-badge"),
    },
    {
      title: t("cards.card-2.title"),
      content: `${commonT("currency")} ${(totalSpent).toLocaleString()}`,
      badge: percent.toFixed(0) + "% " + t("cards.card-2.badge"),
    },
    {
      title: available < 0 ? t("cards.card-3.title-over") : t("cards.card-3.title"),
      content: `${commonT("currency")} ${available.toLocaleString()}`,
      badge: available < 0
        ? `${Math.ceil(Math.abs(percent - 100))}% ` + t("cards.card-3.badge-over")
        : `+${Math.floor(100 - percent)}% ` + t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title") + " " + (forecastData?.forecastDate ?? ""),
      content: `${commonT("currency")} ${forecastData?.forecastValue.toLocaleString() ?? "-"}`,
      badge: t("cards.card-4.badge"),
    },
  ];

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => {
        return (
          <Card
            key={card.title}
            className="bg-blue-background dark:border-border-blue flex flex-col gap-0 rounded-xl"
          >
            <CardHeader>
              <CardTitle className="text-sm font-light">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <h1 className="text-2xl font-bold">
                {isLoading ? "..." : budgetError ? "—" : card.content}
              </h1>
            </CardContent>
            <CardFooter className="mt-2">
              <Badge
                variant="outline"
                className={cn(
                  "bg-badge-background rounded-full px-2 py-1 whitespace-pre-wrap",
                  idx === 1 && "border-[#996E41]",
                  idx === 2 && "border-[#308BA4]",
                )}
              >
                <p className="w-full text-xs">{card.badge}</p>
              </Badge>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
