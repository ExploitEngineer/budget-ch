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
import { getFinancialAccounts } from "@/lib/services/financial-account";
import { accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { AccountRow } from "@/lib/types/row-types";

export function ContentCardsSection() {
  const t = useTranslations("main-dashboard.content-page");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const {
    data: accounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useQuery<AccountRow[]>({
    queryKey: accountKeys.list(hubId),
    queryFn: async () => {
      const res = await getFinancialAccounts();
      if (!res.status) {
        throw new Error("Failed to fetch accounts");
      }
      return res.tableData ?? [];
    },
    enabled: !!hubId,
  });

  const parsedAccounts = (accounts ?? []).map((acc) => ({
    ...acc,
    numericBalance:
      parseFloat(acc.formattedBalance.replace(/[^\d.-]/g, "")) || 0,
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
        const content = accountsLoading
          ? "..."
          : accountsError
            ? "—"
            : card.content;

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
                  accountsLoading && "text-gray-400",
                  accountsError && "text-red-500",
                )}
              >
                {accountsLoading ? "..." : accountsError ? "—" : content}
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
