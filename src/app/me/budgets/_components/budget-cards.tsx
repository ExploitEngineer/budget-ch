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
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getBudgetsAmounts, getBudgets } from "@/lib/api";
import { getCategoriesCount } from "@/lib/services/category";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { CardsContent } from "@/lib/types/common-types";

export function BudgetCardsSection() {
  const t = useTranslations("main-dashboard.budgets-page");
  const commonT = useTranslations("common");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

  const {
    data: amounts,
    isLoading: amountsLoading,
    error: amountsError,
  } = useQuery({
    queryKey: budgetKeys.amounts(hubId, month, year),
    queryFn: async () => {
      if (!hubId) return null;
      const res = await getBudgetsAmounts(hubId, month, year);
      if (!res.success) {
        throw new Error(res.message || commonT("error-loading"));
      }
      return res.data;
    },
    enabled: !!hubId,
  });


  const {
    data: budgets,
    isLoading: budgetsLoading,
  } = useQuery({
    queryKey: budgetKeys.list(hubId, month, year),
    queryFn: async () => {
      if (!hubId) return [];
      const res = await getBudgets(hubId, month, year);
      if (!res.success) {
        throw new Error(res.message || commonT("error-loading"));
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const {
    data: categoriesCount,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: budgetKeys.categoriesCount(hubId),
    queryFn: async () => {
      if (!hubId) return 0;
      const res = await getCategoriesCount(hubId);
      if (!res.success) {
        throw new Error(res.message || commonT("error-loading"));
      }
      return Number(res.data?.count ?? 0);
    },
    enabled: !!hubId,
  });

  const warningCount = budgets?.filter((b) => {
    const ist = Number(b.spentAmount ?? 0);
    const spent = Number(b.calculatedSpentAmount ?? 0);
    const totalSpent = ist + spent;
    const allocated = Number(b.allocatedAmount ?? 0);
    const threshold = (allocated * (b.warningPercentage ?? 100)) / 100;
    return allocated > 0 && totalSpent > threshold;
  }).length;

  const allocated = amounts?.totalAllocated ?? null;
  const spent = amounts?.totalSpent ?? null;
  const available = (allocated !== null && spent !== null) ? allocated - spent : null;
  const percent = (allocated !== null && spent !== null && allocated > 0) ? (spent / allocated) * 100 : 0;

  const cards: CardsContent[] = [
    {
      title: t("cards.card-1.title"),
      content: `${commonT("currency")} ${allocated?.toLocaleString() ?? "—"}`,
      badge: t("cards.card-1.badge"),
    },
    {
      title: t("cards.card-2.title"),
      content: `${commonT("currency")} ${spent?.toLocaleString() ?? "—"}`,
      badge: percent.toFixed(0) + "% " + t("cards.card-2.badge"),
    },
    {
      title: (available ?? 0) < 0 ? t("cards.card-3.title-over") : t("cards.card-3.title"),
      content: `${commonT("currency")} ${available?.toLocaleString() ?? "—"}`,
      badge: (available ?? 0) < 0
        ? `${Math.ceil(Math.abs(percent - 100))}% ` + t("cards.card-3.badge-over")
        : `+${(100 - percent).toFixed(0)}% ` + t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title"),
      content: categoriesLoading
        ? commonT("loading")
        : categoriesError
          ? "—"
          : String(categoriesCount ?? "—"),
      badge:
        budgetsLoading || categoriesLoading
          ? commonT("loading")
          : `${t("cards.card-4.badge")}: ${warningCount ?? 0}`,
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
              {amountsLoading ? commonT("loading") : amountsError ? "—" : card.content}
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
