"use client";

import { useEffect, useState } from "react";
import { getRecentTransactions } from "@/lib/services/transaction";
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

interface Transaction {
  id: string;
  date: string;
  recipient: string;
  account: string;
  category: string;
  note: string;
  amount: string;
}

export function RecentTransactionsTableSection() {
  const t = useTranslations("main-dashboard.dashboard-page");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await getRecentTransactions();

        if (!res.success) {
          setError(res.message || "Failed to fetch transactions.");
          return;
        }

        setTransactions(res.data || []);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError("Unexpected error fetching transactions.");
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const headings = [
    t("recent-transactions-table.table-headings.date"),
    t("recent-transactions-table.table-headings.recipient.title"),
    t("recent-transactions-table.table-headings.account.title"),
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
          {loading ? (
            <p className="py-4 text-center text-gray-500">Loading...</p>
          ) : error ? (
            <p className="py-4 text-center text-red-500">{error}</p>
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
                      <TableCell className="whitespace-nowrap">
                        {tx.account}
                      </TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell>{tx.note}</TableCell>
                      <TableCell>{`CHF ${tx.amount}`}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-500"
                    >
                      No recent transactions
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
