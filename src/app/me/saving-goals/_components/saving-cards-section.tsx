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
import { useEffect, useState } from "react";
import { getSavingGoalsSummary } from "@/lib/services/saving-goal";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

interface SavingCardsSectionProps {
  cards: CardsContent[];
}

export function SavingCardsSection({ cards }: SavingCardsSectionProps) {
  const [totalTarget, setTotalTarget] = useState<number | null>(null);
  const [totalSaved, setTotalSaved] = useState<number | null>(null);
  const [remainingToSave, setRemainingToSave] = useState<number | null>(null);
  const [totalGoals, setTotalGoals] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSavingGoalsData = async () => {
      try {
        const res = await getSavingGoalsSummary();

        if (!res.success || !res.data) {
          setError(res.message || "Failed to fetch saving goals summary");
          return;
        }

        const { totalTarget, totalSaved, remainingToSave, totalGoals } =
          res.data;

        setTotalTarget(totalTarget);
        setTotalSaved(totalSaved);
        setRemainingToSave(remainingToSave);
        setTotalGoals(totalGoals);
      } catch (err: unknown) {
        console.error("Error fetching saving goals summary:", err);
        setError("Unexpected error fetching saving goals");
      } finally {
        setLoading(false);
      }
    };

    fetchSavingGoalsData();
  }, []);

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => {
        let content = card.content;

        if (idx === 0 && totalTarget !== null)
          content = `CHF ${totalTarget.toLocaleString()}`;
        if (idx === 1 && totalSaved !== null)
          content = `CHF ${totalSaved.toLocaleString()}`;
        if (idx === 2 && remainingToSave !== null)
          content = `CHF ${remainingToSave.toLocaleString()}`;
        if (idx === 3 && totalGoals !== null) content = `${totalGoals}`;

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
                {loading ? "..." : error ? "—" : content}
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
