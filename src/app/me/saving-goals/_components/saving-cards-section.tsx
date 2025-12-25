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
import { useQuery } from "@tanstack/react-query";
import { getSavingGoalsSummary } from "@/lib/services/saving-goal";
import { savingGoalKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { SavingGoalsSummary } from "@/lib/services/saving-goal";
import { useTranslations } from "next-intl";

export function SavingCardsSection() {
  const t = useTranslations("main-dashboard.saving-goals-page");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery<SavingGoalsSummary>({
    queryKey: savingGoalKeys.summary(hubId),
    queryFn: async () => {
      const res = await getSavingGoalsSummary();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch saving goals summary");
      }
      return res.data!;
    },
    enabled: !!hubId,
  });

  // Calculate dynamic badge values
  const achievementPercent = summary?.totalTarget && summary?.totalSaved
    ? Math.round((summary.totalSaved / summary.totalTarget) * 100)
    : 0;

  const cards = [
    {
      title: t("cards.card-1.title"),
      content: summary?.totalTarget !== null && summary?.totalTarget !== undefined
        ? `CHF ${summary.totalTarget.toLocaleString()}`
        : "—",
      badge: t("cards.card-1.badge"), // "All Active Goals" is fine as-is
    },
    {
      title: t("cards.card-2.title"),
      content: summary?.totalSaved !== null && summary?.totalSaved !== undefined
        ? `CHF ${summary.totalSaved.toLocaleString()}`
        : "—",
      badge: `${achievementPercent}% Achieved`,
    },
    {
      title: t("cards.card-3.title"),
      content: summary?.remainingToSave !== null && summary?.remainingToSave !== undefined
        ? `CHF ${summary.remainingToSave.toLocaleString()}`
        : "—",
      badge: summary?.totalMonthlyAllocation !== null && summary?.totalMonthlyAllocation !== undefined
        ? `Monthly per: CHF ${summary.totalMonthlyAllocation.toLocaleString()}`
        : t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title"),
      content: summary?.totalGoals !== null && summary?.totalGoals !== undefined
        ? `${summary.totalGoals}`
        : "—",
      badge: summary?.overdueGoalsCount && summary.overdueGoalsCount > 0
        ? `⚠️ ${summary.overdueGoalsCount} Overdue`
        : "No Urgent Due Items",
    },
  ];

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card
          key={card.title}
          className="bg-blue-background dark:border-border-blue flex flex-col gap-0 rounded-xl"
        >
          <CardHeader>
            <CardTitle className="text-sm font-light">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <h1 className="text-2xl font-bold">
              {summaryLoading
                ? "..."
                : summaryError
                  ? "—"
                  : card.content}
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
      ))}
    </div>
  );
}
