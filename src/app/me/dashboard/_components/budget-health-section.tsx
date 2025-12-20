"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getBudgetsAmounts, getBudgetWarningsCount } from "@/lib/services/budget";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui/error-state";

export function BudgetHealthSection() {
  const t = useTranslations("main-dashboard.dashboard-page.budget-health");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();

  const {
    data: amounts,
    isLoading: amountsLoading,
    error: amountsError,
  } = useQuery({
    queryKey: budgetKeys.amounts(hubId),
    queryFn: async () => {
      const res = await getBudgetsAmounts(undefined, undefined, hubId || undefined);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budget amounts");
      }
      return res.data;
    },
    enabled: !!hubId,
  });

  const {
    data: warningsCount,
    isLoading: warningsLoading,
    error: warningsError,
  } = useQuery({
    queryKey: budgetKeys.warningsCount(hubId),
    queryFn: async () => {
      if (!hubId) return 0;
      const res = await getBudgetWarningsCount(undefined, undefined, hubId || undefined);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch warnings count");
      }
      return Number(res.data?.count ?? 0);
    },
    enabled: !!hubId,
  });

  const allocated = amounts?.totalAllocated ?? null;
  const spent = amounts?.totalSpent ?? null;

  const progress =
    allocated && allocated > 0 && spent !== null
      ? Math.min((spent / allocated) * 100, 100)
      : 0;
  const progressStr = amountsLoading ? "..." : `${Math.round(progress)}%`;
  const warning = progress > 80;

  const cards = [
    {
      title: t("card-1.title"),
      value: amountsLoading
        ? "..."
        : `CHF ${allocated?.toLocaleString() ?? "-"}`,
    },
    {
      title: t("card-2.title"),
      value: amountsLoading ? "..." : `CHF ${spent?.toLocaleString() ?? "-"}`,
    },
    {
      title: t("card-3.title"),
      value: warningsLoading ? "..." : String(warningsCount ?? "-"),
    },
  ];

  return (
    <div className="w-full">
      <Card className="bg-blue-background dark:border-border-blue w-full">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <p className="text-gray-400/80">{t("secondary-title")}</p>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          {amountsError || warningsError ? (
            <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: budgetKeys.all })} />
          ) : (
            <div className="flex flex-wrap gap-4 lg:flex-nowrap">
              <Card className="bg-blue-background dark:border-border-blue flex-1 p-1 lg:flex-[0.2]">
                <CardContent className="flex items-center gap-3 p-4">
                  <AnimatedCircularProgressBar
                    className="h-20 w-20"
                    value={progress}
                  />
                  <div className="w-full">
                    <p className="text-xs font-light">
                      {t("warning-card.title")}
                    </p>
                    <h3 className="text-lg font-bold">{progressStr}</h3>
                    <p className="text-sm">
                      {warning
                        ? t("warning-card.warning-high")
                        : t("warning-card.warning-normal")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t("warning-card.spending")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-wrap gap-4 lg:flex-1">
                {cards.map((card) => (
                  <Card
                    key={card.title}
                    className="bg-blue-background dark:border-border-blue my-auto min-w-[160px] flex-1 p-0 lg:flex-[1.2]"
                  >
                    <CardContent className="flex flex-col gap-2 p-4">
                      <p className="text-xs font-light uppercase sm:text-sm">
                        {card.title}
                      </p>
                      <h2 className="text-lg font-bold">{card.value}</h2>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
