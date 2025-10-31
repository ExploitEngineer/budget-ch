"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTransactions } from "@/lib/services/transaction";
import { useTranslations } from "next-intl";
import type { Transaction } from "@/lib/services/transaction";

export function ReportCardsSection() {
  const t = useTranslations("main-dashboard.report-page");

  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [savingRate, setSavingRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await getTransactions();

        if (!res.success || !res.data) {
          throw new Error(res.message || "Failed to fetch transactions");
        }

        let totalIncome = 0;
        let totalExpense = 0;

        (res.data as Transaction[]).forEach((tx) => {
          if (tx.type === "income") totalIncome += tx.amount;
          else if (tx.type === "expense") totalExpense += tx.amount;
        });

        const netBalance = totalIncome - totalExpense;
        const rate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

        setIncome(totalIncome);
        setExpense(totalExpense);
        setBalance(netBalance);
        setSavingRate(Number(rate.toFixed(1)));
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load report data");
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

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
