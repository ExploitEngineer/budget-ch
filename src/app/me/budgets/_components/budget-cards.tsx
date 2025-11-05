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
import { useBudgetStore } from "@/store/budget-store";
import { useTranslations } from "next-intl";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

export function BudgetCardsSection() {
  const t = useTranslations("main-dashboard.budgets-page");

  const {
    allocated,
    spent,
    available,
    percent,
    amountsLoading,
    amountsError,
    fetchBudgetsAmounts,
    categoriesCount,
    categoriesLoading,
    categoriesError,
    fetchCategoriesCount,
  } = useBudgetStore();

  useEffect(() => {
    fetchBudgetsAmounts();
    fetchCategoriesCount();
  }, [fetchBudgetsAmounts, fetchCategoriesCount]);

  const cards: CardsContent[] = [
    {
      title: t("cards.card-1.title"),
      content: `CHF ${allocated?.toLocaleString() ?? "—"}`,
      badge: t("cards.card-1.badge"),
    },
    {
      title: t("cards.card-2.title"),
      content: `CHF ${spent?.toLocaleString() ?? "—"}`,
      badge: percent + t("cards.card-2.badge"),
    },
    {
      title: t("cards.card-3.title"),
      content: `CHF ${available?.toLocaleString() ?? "—"}`,
      badge: t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title"),
      content: categoriesLoading
        ? "..."
        : categoriesError
          ? "—"
          : String(categoriesCount ?? "—"),
      badge: t("cards.card-4.badge"),
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
              {amountsLoading ? "..." : amountsError ? "—" : card.content}
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
