"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableCell,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui/error-state";
import { getRecentTransactions } from "@/lib/api";
import { transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { Transaction } from "@/lib/types/dashboard-types";
import type { TransactionWithDetails } from "@/lib/types/domain-types";
import { mapTransactionsToRows } from "@/app/me/transactions/transaction-adapters";
import { useMemo } from "react";

export function RecentTransactionsTableSection() {
  const t = useTranslations("main-dashboard.dashboard-page");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();

  const {
    data: domainTransactions,
    isLoading: transactionLoading,
    error: transactionError,
  } = useQuery<TransactionWithDetails[]>({
    queryKey: transactionKeys.recent(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getRecentTransactions(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch recent transactions");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const transactions = useMemo(() => {
    if (!domainTransactions) return undefined;
    return mapTransactionsToRows(domainTransactions);
  }, [domainTransactions]);

  const headings = [
    t("recent-transactions-table.table-headings.date"),
    t("recent-transactions-table.table-headings.recipient.title"),
    t("recent-transactions-table.table-headings.category.title"),
    t("recent-transactions-table.table-headings.note.title"),
    t("recent-transactions-table.table-headings.amount"),
  ];

  return (
    <section className="grid auto-rows-min grid-cols-6">
      <Card className="bg-blue-background dark:border-border-blue col-span-full">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("upcoming-cards.last-transaction")}</CardTitle>
          <Badge
            variant="outline"
            className="bg-badge-background rounded-full px-2 py-1"
          >
            {t("upcoming-cards.button")}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="overflow-x-auto">
          {transactionError ? (
            <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: transactionKeys.recent(hubId) })} />
          ) : transactionLoading || !transactions ? (
            <p className="text-muted-foreground px-6 text-sm">
              {t("upcoming-cards.loading")}
            </p>
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="dark:border-border-blue">
                  {headings.map((heading) => (
                    <TableHead
                      className="font-bold text-gray-500 uppercase dark:text-gray-400/80"
                      key={heading}
                    >
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <TableRow className="dark:border-border-blue" key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>{tx.recipient}</TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell>{tx.note}</TableCell>
                      <TableCell>{`CHF ${tx.amount}`}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500"
                    >
                      {t("upcoming-cards.no-transactions")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
