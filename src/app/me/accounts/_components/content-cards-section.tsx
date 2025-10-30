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
import { useEffect, useState } from "react";
import { getFinancialAccounts } from "@/lib/services/financial-account";

interface TableData {
  name: string;
  type: string;
  iban: string;
  balance: string;
}

export function ContentCardsSection() {
  const t = useTranslations("main-dashboard.content-page");
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<TableData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { tableData, status } = await getFinancialAccounts();
        if (!status) throw new Error("Failed to fetch data");
        setAccounts(tableData);
      } catch (err) {
        console.error("Error loading accounts:", err);
        setError("Failed to load financial account data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const parsedAccounts = accounts.map((acc) => ({
    ...acc,
    numericBalance: parseFloat(acc.balance.replace(/[^\d.-]/g, "")) || 0,
  }));

  const totalBalance = parsedAccounts.reduce(
    (sum, acc) => sum + acc.numericBalance,
    0,
  );
  const checkingCashTotal = parsedAccounts
    .filter((a) => a.type === "checking" || a.type === "cash")
    .reduce((sum, acc) => sum + acc.numericBalance, 0);
  const savingsBalance = parsedAccounts
    .filter((a) => a.type === "savings")
    .reduce((sum, acc) => sum + acc.numericBalance, 0);
  const creditCardTotal = parsedAccounts
    .filter((a) => a.type === "credit-card")
    .reduce((sum, acc) => sum + acc.numericBalance, 0);

  const cards = [
    {
      title: t("cards.card-1.title"),
      content: `CHF ${totalBalance.toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      badge: t("cards.card-1.badge"),
    },
    {
      title: t("cards.card-2.title"),
      content: `CHF ${checkingCashTotal.toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      badge: t("cards.card-2.badge"),
    },
    {
      title: t("cards.card-3.title"),
      content: `CHF ${savingsBalance.toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      badge: t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title"),
      content: `CHF ${creditCardTotal.toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      badge: t("cards.card-4.badge"),
    },
  ];

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => {
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
                className={cn(
                  "bg-badge-background rounded-full px-4 py-2 whitespace-pre-wrap",
                  idx === 2
                    ? "border-[#308BA4]"
                    : idx === 3
                      ? "border-[#9A4249]"
                      : "dark:border-border-blue",
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
