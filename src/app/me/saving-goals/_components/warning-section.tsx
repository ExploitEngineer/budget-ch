"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { savingGoalKeys } from "@/lib/query-keys";
import { getSavingGoals } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

export function WarningSection() {
  const t = useTranslations("main-dashboard.saving-goals-page.warning-section");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const [showAll, setShowAll] = useState(false);

  const { data: goals, isLoading } = useQuery({
    queryKey: savingGoalKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) return [];
      const res = await getSavingGoals(hubId);
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  // Filter Overdue Goals: Due date in past AND logic check (amountSaved < goalAmount)
  const overdueGoals = (goals ?? []).filter((goal) => {
    if (!goal.dueDate) return false;
    const isOverdue = new Date(goal.dueDate) < new Date();
    // Assuming 'fully funded' check is strict (>= goalAmount)
    const isNotFunded = (goal.amountSaved ?? 0) < (goal.goalAmount ?? 0);
    return isOverdue && isNotFunded;
  });

  const hasWarnings = overdueGoals.length > 0;

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          {overdueGoals.length > 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
            >
              {showAll ? t("hide-all") : t("show-all")}
            </Button>
          )}
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : !hasWarnings ? (
            <Badge
              variant="outline"
              className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
            >
              {t("badge")}
            </Badge>
          ) : (
            <div className="space-y-3">
              {(showAll ? overdueGoals : overdueGoals.slice(0, 3)).map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-red-900 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-200"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div className="flex flex-col">
                      <span className="font-semibold">{goal.name}</span>
                      <span className="text-xs opacity-90">
                        {t("due")}{new Date(goal.dueDate!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">
                      {(
                        ((goal.amountSaved ?? 0) / (goal.goalAmount || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-xs opacity-80">{t("funded")}</div>
                  </div>
                </div>
              ))}
              {!showAll && overdueGoals.length > 3 && (
                <p className="text-center text-xs text-muted-foreground">
                  {t("more-overdue", { count: overdueGoals.length - 3 })}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
