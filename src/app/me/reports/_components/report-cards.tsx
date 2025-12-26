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
import { useSearchParams } from "next/navigation";
import { getReportSummary, type ReportSummary } from "@/lib/api";
import { reportKeys } from "@/lib/query-keys";

export function ReportCardsSection({
  initialFrom,
  initialTo,
}: {
  initialFrom?: string;
  initialTo?: string;
}) {
  const t = useTranslations("main-dashboard.report-page");
  const commonT = useTranslations("common");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const from = searchParams.get("from") || initialFrom;
  const to = searchParams.get("to") || initialTo;

  const {
    data: summary,
    isLoading: loading,
    error: queryError,
  } = useQuery<ReportSummary>({
    queryKey: reportKeys.summary(hubId, from, to),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getReportSummary(hubId, from, to);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch report summary");
      }
      return res.data!;
    },
    enabled: !!hubId,
  });

  console.log("DEBUG: ReportCardsSection - Summary Data:", summary);

  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;
  const balance = summary?.balance ?? 0;
  const savingRate = summary?.savingRate ?? 0;

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load report data") : null;

  const cards = [
    {
      title: t("cards.card-1.title"),
      content: `${commonT("currency")} ${income.toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      badge: t("cards.card-1.badge"),
    },
    {
      title: t("cards.card-2.title"),
      content: `${commonT("currency")} ${expense.toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      badge: t("cards.card-2.badge"),
    },
    {
      title: t("cards.card-3.title"),
      content: `${commonT("currency")} ${balance.toLocaleString("de-CH", {
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
