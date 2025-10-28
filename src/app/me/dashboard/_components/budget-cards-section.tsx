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
import { getBudgetsAmounts } from "@/lib/services/budget";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

interface BudgetCardsSectionProps {
  cards: CardsContent[];
}

export function BudgetCardsSection({ cards }: BudgetCardsSectionProps) {
  const [allocated, setAllocated] = useState<number | null>(null);
  const [spent, setSpent] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchBudgetData() {
      try {
        const res = await getBudgetsAmounts();

        if (!res.success) {
          setError(res.message || "Failed to fetch budgets");
          return;
        }

        const totalAllocated = res.data?.totalAllocated ?? 0;
        const totalSpent = res.data?.totalSpent ?? 0;

        setAllocated(totalAllocated);
        setSpent(totalSpent);
        setAvailable(totalAllocated - totalSpent);
      } catch (err: any) {
        console.error("Error fetching budgets:", err);
        setError("Unexpected error fetching budget data");
      } finally {
        setLoading(false);
      }
    }

    fetchBudgetData();
  }, []);

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => {
        let content = card.content;

        if (idx === 0 && allocated !== null)
          content = `CHF ${allocated.toLocaleString()}`;
        if (idx === 1 && spent !== null)
          content = `CHF ${spent.toLocaleString()}`;
        if (idx === 2 && available !== null)
          content = `CHF ${available.toLocaleString()}`;

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
                {loading ? "..." /* <Spinner /> */ : error ? "—" : content}
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
