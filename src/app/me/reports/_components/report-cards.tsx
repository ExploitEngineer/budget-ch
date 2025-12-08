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
import { getTransactions } from "@/lib/api";
import { transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { Transaction } from "@/lib/types/dashboard-types";

export function ReportCardsSection() {
  const t = useTranslations("main-dashboard.report-page");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const {
    data: transactions,
    isLoading: loading,
    error: queryError,
  } = useQuery<Transaction[]>({
    queryKey: transactionKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getTransactions(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch transactions");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  // Calculate income, expense, balance, and saving rate from transactions
  const income = transactions?.reduce((sum, tx) => {
    return tx.type === "income" ? sum + tx.amount : sum;
  }, 0) ?? 0;

  const expense = transactions?.reduce((sum, tx) => {
    return tx.type === "expense" ? sum + tx.amount : sum;
  }, 0) ?? 0;

  const balance = income - expense;
  const savingRate = income > 0 ? Number(((balance / income) * 100).toFixed(1)) : 0;

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load report data") : null;

  const cards = [
    {
      title: t("cards.card-1.title"),
      content: `CHF ${income.toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      badge: t("cards.card-1.badge"),
    },
    {
      title: t("cards.card-2.title"),
      content: `CHF ${expense.toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      badge: t("cards.card-2.badge"),
    },
    {
      title: t("cards.card-3.title"),
      content: `CHF ${balance.toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      badge: t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title"),
      content: `${savingRate}%`,
      badge: t("cards.card-4.badge"),
    },
  ];

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const content = loading ? "..." : error ? "—" : card.content;

        return (
          <Card
            key={card.title}
            className="bg-blue-background dark:border-border-blue flex flex-col gap-0 rounded-xl"
          >
            <CardHeader>
              <CardTitle className="text-sm font-light">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <h1
                className={cn(
                  "text-2xl font-bold",
                  loading && "animate-pulse text-gray-400",
                  error && "text-red-500",
                )}
              >
                {content}
              </h1>
            </CardContent>
            <CardFooter className="mt-2">
              <Badge
                variant="outline"
                className="bg-badge-background dark:border-border-blue rounded-full px-4 py-2 whitespace-pre-wrap"
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
