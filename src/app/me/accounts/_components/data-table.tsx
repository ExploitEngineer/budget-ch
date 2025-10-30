"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableRow,
  TableHeader,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import EditAccountDialog from "./edit-account-dialog";
import { getFinancialAccounts } from "@/lib/services/financial-account";

export interface AccountData {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit-card" | "cash";
  balance: number;
  formattedBalance: string;
  iban: string;
  note?: string | null;
}

export function ContentDataTable() {
  const t = useTranslations("main-dashboard.content-page.data-table");

  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      const { tableData, status } = await getFinancialAccounts();

      if (!status) throw new Error("Failed to fetch data");

      setAccounts(tableData);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Failed to load financial account data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="grid auto-rows-min grid-cols-6">
        <Card className="bg-blue-background dark:border-border-blue col-span-full">
          <CardHeader>
            <CardTitle className="text-gray-400">{t("loading")}</CardTitle>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="grid auto-rows-min grid-cols-6">
        <Card className="bg-blue-background dark:border-border-blue col-span-full">
          <CardHeader>
            <CardTitle className="text-red-500">
              {t("errorMessage") ?? error}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => {
    const amount =
      parseFloat(acc.formattedBalance.replace(/[^\d.-]/g, "")) || 0;
    return sum + amount;
  }, 0);

  const budgetDataTableHeadings: string[] = [
    t("headings.name"),
    t("headings.type"),
    t("headings.iban"),
    t("headings.balance"),
    t("headings.action"),
  ];

  return (
    <section className="grid auto-rows-min grid-cols-6">
      <Card className="bg-blue-background dark:border-border-blue col-span-full">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>{t("title")}</CardTitle>
            <Badge
              className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
              variant="outline"
            >
              {t("badge")}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
            >
              {t("buttons.export")}
            </Button>
            <Button
              variant="outline"
              className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
            >
              {t("buttons.reset")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow className="dark:border-border-blue">
                {budgetDataTableHeadings.map((heading) => (
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
              {accounts.map((data) => (
                <TableRow className="dark:border-border-blue" key={data.name}>
                  <TableCell>{data.name}</TableCell>
                  <TableCell>{data.type}</TableCell>
                  <TableCell>{data.iban}</TableCell>
                  <TableCell>{data.formattedBalance}</TableCell>
                  <TableCell>
                    <EditAccountDialog
                      variant="outline"
                      accountData={data}
                      fetchData={fetchData}
                    />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold opacity-60">
                  {t("total")}
                </TableCell>
                <TableCell colSpan={2} />
                <TableCell className="font-bold opacity-60">
                  CHF{" "}
                  {totalBalance.toLocaleString("de-CH", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
