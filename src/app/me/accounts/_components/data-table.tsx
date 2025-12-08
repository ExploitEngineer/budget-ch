"use client";

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
import { useQuery } from "@tanstack/react-query";
import { getFinancialAccounts } from "@/lib/api";
import { accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { useExportCSV } from "@/hooks/use-export-csv";
import type { AccountRow } from "@/lib/types/row-types";

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

  const { exportAccounts } = useExportCSV();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const {
    data: accounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useQuery<AccountRow[]>({
    queryKey: accountKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getFinancialAccounts(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch accounts");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const totalBalance = (accounts ?? []).reduce((sum, acc) => {
    const amount =
      parseFloat(acc.formattedBalance.replace(/[^\d.-]/g, "")) || 0;
    return sum + amount;
  }, 0);

  const accountTableHeadings: string[] = [
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
              onClick={() => exportAccounts({ accounts: accounts ?? null })}
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
                {accountTableHeadings.map((heading) => (
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
              {accountsError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-red-500">
                    {accountsError instanceof Error
                      ? accountsError.message
                      : "Failed to load accounts"}
                  </TableCell>
                </TableRow>
              ) : accountsLoading || !accounts ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {t("loading")}
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400">
                    No Accounts Yet
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {accounts.map((data) => (
                    <TableRow
                      className="dark:border-border-blue"
                      key={data.name}
                    >
                      <TableCell>{data.name}</TableCell>
                      <TableCell>{data.type}</TableCell>
                      <TableCell>{data.iban || data.note}</TableCell>
                      <TableCell>{data.formattedBalance}</TableCell>
                      <TableCell>
                        <EditAccountDialog
                          variant="outline"
                          accountData={data}
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
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
