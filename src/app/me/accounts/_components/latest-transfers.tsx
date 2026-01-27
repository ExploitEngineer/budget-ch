"use client";

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
import { getAccountTransfers } from "@/lib/api";
import { transferKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useSearchParams } from "next/navigation";
import { formatInAppTimezone } from "@/lib/timezone";

export interface TransferData {
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
  const commonT = useTranslations("common");

  const { exportTransfers } = useExportCSV();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useQuery<{ data: TransferData[]; message?: string }>({
    queryKey: transferKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) return { data: [] };
      const res = await getAccountTransfers(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch transfers");
      }
      return { data: res.data ?? [], message: res.message };
    },
    enabled: !!hubId,
  });

  const transfers = data?.data;
  const apiMessage = data?.message;

  const error = queryError ? (queryError instanceof Error ? queryError.message : t("error-loading")) : null;

  const tableHeadings: string[] = [
    t("data-table.headings.date"),
    t("data-table.headings.from"),
    t("data-table.headings.to"),
    t("data-table.headings.note"),
    t("data-table.headings.amount"),
  ];

  if (loading) {
    return (
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle>{commonT("loading")}</CardTitle>
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
            onClick={() => exportTransfers({ transfers: transfers ?? null })}
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
              {(transfers ?? []).map((tx, index) => (
                <TableRow key={index} className="dark:border-border-blue">
                  <TableCell>
                    {formatInAppTimezone(new Date(tx.date), "dd.MM.yyyy")}
                  </TableCell>
                  <TableCell>{tx.source}</TableCell>
                  <TableCell>{tx.destination}</TableCell>
                  <TableCell>{tx.note || "-"}</TableCell>
                  <TableCell>{commonT("currency")} {tx.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {(transfers ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center opacity-60 italic">
                    {apiMessage || t("no-transfers")}
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
