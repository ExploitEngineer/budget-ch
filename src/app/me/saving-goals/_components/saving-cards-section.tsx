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
  const tc = useTranslations("common");
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
        throw new Error(res.message || t("active-goals-section.error-loading"));
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
        ? `${tc("currency")} ${summary.totalTarget.toLocaleString()}`
        : "—",
      badge: t("cards.card-1.badge"), // "All Active Goals" is fine as-is
    },
    {
      title: t("cards.card-2.title"),
      content: summary?.totalSaved !== null && summary?.totalSaved !== undefined
        ? `${tc("currency")} ${summary.totalSaved.toLocaleString()}`
        : "—",
      badge: t("cards.card-2.badge-pattern", { percent: achievementPercent }),
    },
    {
      title: t("cards.card-3.title"),
      content: summary?.remainingToSave !== null && summary?.remainingToSave !== undefined
        ? `${tc("currency")} ${summary.remainingToSave.toLocaleString()}`
        : "—",
      badge: summary?.totalMonthlyAllocation !== null && summary?.totalMonthlyAllocation !== undefined
        ? t("cards.card-3.badge-pattern", { currency: tc("currency"), amount: summary.totalMonthlyAllocation.toLocaleString() })
        : t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title"),
      content: summary?.totalGoals !== null && summary?.totalGoals !== undefined
        ? `${summary.totalGoals}`
        : "—",
      badge: summary?.overdueGoalsCount && summary.overdueGoalsCount > 0
        ? t("cards.card-4.badge-overdue", { count: summary.overdueGoalsCount })
        : t("cards.card-4.badge-none"),
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
                  ? tc("error-loading")
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
