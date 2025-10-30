"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HighlightedBarChart } from "@/components/ui/highlighted-bar-chart";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { getSavingGoals } from "@/lib/services/saving-goal";
import type { SavingGoal } from "@/db/queries";

export function BarChartSection() {
  const t = useTranslations("main-dashboard.dashboard-page");
  const [circleProgressCards, setCircleProgressCards] = useState<SavingGoal[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestGoals() {
      try {
        const res = await getSavingGoals(3);
        if (!res.success) {
          setError(res.message || "Failed to fetch saving goals");
          return;
        }
        setCircleProgressCards(res.data || []);
      } catch (err: any) {
        console.error("Error fetching latest saving goals:", err);
        setError("Unexpected error fetching saving goals");
      } finally {
        setLoading(false);
      }
    }

    fetchLatestGoals();
  }, []);

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <HighlightedBarChart />
      </div>
      <Card className="bg-blue-background flex w-full gap-4 lg:col-span-2 lg:flex-col">
        <CardHeader>
          <CardTitle>{t("progress-cards.title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />

        {loading && <p className="p-4 text-sm">Loading...</p>}
        {error && !loading && (
          <p className="p-4 text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && circleProgressCards.length === 0 && (
          <p className="text-muted-foreground p-4 text-sm">
            No saving goals yet.
          </p>
        )}

        {circleProgressCards.map((card) => (
          <CardContent key={card.name}>
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
        ))}
      </Card>
    </div>
  );
}
