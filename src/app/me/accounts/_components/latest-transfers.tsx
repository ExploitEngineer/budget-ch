"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { getAccountTransfers } from "@/lib/services/latest-transfers";

interface TransferData {
  date: string;
  source: string;
  destination: string;
  note: string;
  amount: number;
}

export function LatestTransfers() {
  const t = useTranslations(
    "main-dashboard.content-page.latest-tranfers-section",
  );

  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTransfers() {
    try {
      const result = await getAccountTransfers();

      if (!result || !result.status) {
        throw new Error(result?.message || "Unknown error");
      }

      setTransfers((result.data as TransferData[]) || []);
    } catch (err: any) {
      console.error("Error fetching transfers:", err);
      setError("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransfers();
  }, []);

  const tableHeadings: string[] = [
    t("data-table.headings.date"),
    t("data-table.headings.from"),
    t("data-table.headings.to"),
    t("data-table.headings.note"),
    t("data-table.headings.amount"),
  ];

  const exportToCSV = () => {
    const headers = tableHeadings.map((heading) => heading);

    const csvData = (transfers ?? []).map((transfer) => [
      new Date(transfer.date),
      transfer.source,
      transfer.destination,
      transfer.note,
      transfer.amount.toFixed(2),
      ,
    ]);

    csvData.unshift(headers);

    const csvString = csvData
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transfers-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  if (loading) {
    return (
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle>Loading Data...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle className="text-red-500">{error}</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Button
            variant="outline"
            className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
            onClick={exportToCSV}
          >
            {t("button")}
          </Button>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-border-blue">
                {tableHeadings.map((heading) => (
                  <TableHead
                    className="font-bold text-gray-500 dark:text-gray-400/80"
                    key={heading}
                  >
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((tx, index) => (
                <TableRow key={index} className="dark:border-border-blue">
                  <TableCell>
                    {new Date(tx.date).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell>{tx.source}</TableCell>
                  <TableCell>{tx.destination}</TableCell>
                  <TableCell>{tx.note || "-"}</TableCell>
                  <TableCell>CHF {tx.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {transfers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center opacity-60">
                    {t("no-transfers")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
