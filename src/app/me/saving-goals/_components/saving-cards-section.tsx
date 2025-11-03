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
import { useEffect } from "react";
import { useSavingGoalStore } from "@/store/saving-goal-store";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

interface SavingCardsSectionProps {
  cards: CardsContent[];
}

export function SavingCardsSection({ cards }: SavingCardsSectionProps) {
  const { summary, summaryLoading, summaryError, fetchSummary } =
    useSavingGoalStore();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => {
        let content = card.content;

        if (
          idx === 0 &&
          summary?.totalTarget !== null &&
          summary?.totalTarget !== undefined
        )
          content = `CHF ${summary.totalTarget.toLocaleString()}`;
        if (
          idx === 1 &&
          summary?.totalSaved !== null &&
          summary?.totalSaved !== undefined
        )
          content = `CHF ${summary.totalSaved.toLocaleString()}`;
        if (
          idx === 2 &&
          summary?.remainingToSave !== null &&
          summary?.remainingToSave !== undefined
        )
          content = `CHF ${summary.remainingToSave.toLocaleString()}`;
        if (
          idx === 3 &&
          summary?.totalGoals !== null &&
          summary?.totalGoals !== undefined
        )
          content = `${summary.totalGoals}`;

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
                {summaryLoading ? "..." : summaryError ? "—" : content}
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
