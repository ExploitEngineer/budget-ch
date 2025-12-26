"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import EditSavingGoalDialog from "./edit-saving-goal-dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AllocateForm } from "./allocate-form";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getSavingGoals } from "@/lib/api";
import { savingGoalKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { SavingGoal } from "@/lib/types/domain-types";
import type { SavingGoalRow } from "@/lib/types/ui-types";
import { mapSavingGoalsToRows } from "../saving-goal-adapters";
import { useMemo, useState } from "react";

export function ActiveGoalsSection() {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.active-goals-section",
  );
  const tc = useTranslations("common");

  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  // Default to true if not specified
  const showOverfunded = searchParams.get("showOverfunded") !== "false";

  const [sortBy, setSortBy] = useState<"due" | "progress" | "remaining-amount">("due");

  const {
    data: domainGoals,
    isLoading: goalsLoading,
    error: goalsError,
  } = useQuery<SavingGoal[]>({
    queryKey: savingGoalKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getSavingGoals(hubId);
      if (!res.success) {
        throw new Error(res.message || t("error-loading"));
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const goals = useMemo(() => {
    if (!domainGoals) return undefined;
    const mapped = mapSavingGoalsToRows(domainGoals);

    // Filter based on "Show Overfunded" setting
    const filtered = showOverfunded
      ? mapped
      : mapped.filter(g => g.value < 100);

    // Sort based on selected option
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "due") {
        // Sort by due date (soonest first, null dates last)
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === "progress") {
        // Sort by progress percentage (highest first)
        return b.value - a.value;
      } else if (sortBy === "remaining-amount") {
        // Sort by remaining amount (highest first)
        return (b.remaining ?? 0) - (a.remaining ?? 0);
      }
      return 0;
    });

    return sorted;
  }, [domainGoals, sortBy, showOverfunded]);

  const activeGoalsData = (goals ?? []) as SavingGoalRow[];

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CardTitle className="truncate">{t("title")}</CardTitle>
            <Badge
              variant="outline"
              className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
            >
              {t("badge-pattern", {
                count: activeGoalsData.length,
                currency: tc("currency"),
                amount: (domainGoals ?? [])
                  .filter(g => g.autoAllocationEnabled)
                  .reduce((sum, g) => sum + (g.monthlyAllocation ?? 0), 0)
                  .toLocaleString()
              })}
            </Badge>
          </div>

          <ToggleGroup
            className="dark:border-border-blue bg-dark-blue-background inline-flex flex-none items-center gap-1 rounded border"
            type="single"
            value={sortBy}
            onValueChange={(value) => value && setSortBy(value as typeof sortBy)}
            aria-label="view"
          >
            <ToggleGroupItem
              value="due"
              className="px-3 py-1 text-sm whitespace-nowrap"
            >
              {t("buttons.due")}
            </ToggleGroupItem>

            <ToggleGroupItem
              value="progress"
              className="px-3 py-1 text-sm whitespace-nowrap"
            >
              {t("buttons.progress")}
            </ToggleGroupItem>

            <ToggleGroupItem
              value="remaining-amount"
              className="px-3 py-1 text-sm"
            >
              <span className="inline-block max-w-[10rem] truncate">
                {t("buttons.remaining-amount")}
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-3">
          {goalsError ? (
            <p className="text-muted-foreground p-4 text-sm">
              {goalsError instanceof Error ? goalsError.message : t("error-loading")}
            </p>
          ) : goalsLoading ? (
            <p className="text-muted-foreground p-4 text-sm">{tc("loading")}</p>
          ) : activeGoalsData.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">{t("no-goals")}</p>
          ) : (
            activeGoalsData.map((goal, idx) => {
              const remainingCHF = (
                goal.goalAmount - goal.amountSaved
              )?.toLocaleString("de-CH", {
                minimumFractionDigits: 2,
              });
              const goalAmountCHF = goal.goalAmount?.toLocaleString("de-CH", {
                minimumFractionDigits: 2,
              });
              const savedCHF = goal.amountSaved?.toLocaleString("de-CH", {
                minimumFractionDigits: 2,
              });
              const monthlyCHF = goal.monthlyAllocation?.toLocaleString(
                "de-CH",
                {
                  minimumFractionDigits: 2,
                },
              );
              const currency = tc("currency");

              return (
                <Card
                  className="bg-blue-background dark:border-border-blue"
                  key={goal.id}
                >
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>{goal.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="dark:border-border-blue bg-badge-background rounded-full px-3 py-2"
                      >
                        {goal.value}%
                      </Badge>
                      <EditSavingGoalDialog goalData={goal} />
                    </div>
                  </CardHeader>

                  <Separator className="dark:bg-border-blue" />

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h3>{t("cards.tax-reserves.content.goal")}</h3>
                        <p>{currency} {goalAmountCHF}</p>
                      </div>
                      <div>
                        <h3>{t("cards.tax-reserves.content.saved")}</h3>
                        <p>{currency} {savedCHF}</p>
                      </div>
                      <div>
                        <h3>{t("cards.tax-reserves.content.remaining")}</h3>
                        <p>{currency} {remainingCHF}</p>
                      </div>
                      <div>
                        <h3>
                          {t("cards.tax-reserves.content.monthly-allocated")}
                        </h3>
                        <p>{currency} {monthlyCHF}</p>
                      </div>
                    </div>

                    <Progress
                      value={goal.value}
                      className="mt-2 mb-3"
                      markerColor={
                        goal.dueDate && new Date(goal.dueDate) < new Date() && goal.value < 100
                          ? "red"
                          : goal.value >= 100
                            ? "green"
                            : "standard"
                      }
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
                      >
                        {t("cards.tax-reserves.content.auto")}: {currency}{" "}
                        {goal.monthlyAllocation?.toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                        }) ?? "0.00"}
                      </Badge>

                      <Badge
                        variant="outline"
                        className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
                      >
                        {t("cards.tax-reserves.content.remaining")}: {currency}{" "}
                        {goal.remaining?.toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                        }) ?? "0.00"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <AllocateForm
                        amountSaved={goal.amountSaved || 0}
                        goalId={goal.id}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
    </section>
  );
}
