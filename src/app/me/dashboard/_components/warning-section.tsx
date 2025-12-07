"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import DashboardTableAdjustDialog from "./dashboard-table-dialog";
import type { WarningCards } from "./data";
import { useQuery } from "@tanstack/react-query";
import { getUpcomingRecurringTransactions } from "@/lib/services/transaction";
import { transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";

interface WarningSectionProps {
  warningCards: WarningCards[];
}

export function WarningSection({
  warningCards,
}: WarningSectionProps) {
  const t = useTranslations("main-dashboard.dashboard-page");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const {
    data: upcomingTransactions,
    isLoading: upcomingLoading,
    error: upcomingError,
  } = useQuery({
    queryKey: transactionKeys.upcomingRecurring(hubId),
    queryFn: async () => {
      const res = await getUpcomingRecurringTransactions();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch upcoming transactions");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const upComingTableHeadings: string[] = [
    t("upcoming-cards.table-data.table-heading.date"),
    t("upcoming-cards.table-data.table-heading.name.title"),
    t("upcoming-cards.table-data.table-heading.account.title"),
    t("upcoming-cards.table-data.table-heading.amount"),
  ];

  return (
    <section className="grid auto-rows-min grid-cols-7 gap-4">
      <Card className="bg-blue-background dark:border-border-blue col-span-full lg:col-span-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("upcoming-cards.title")}</CardTitle>
          <Badge
            variant="outline"
            className="bg-badge-background dark:border-border-blue rounded-full px-2 py-1"
          >
            {t("upcoming-cards.button")}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="overflow-x-auto">
          {upcomingError ? (
            <p className="px-6 text-sm text-red-500">
              {upcomingError instanceof Error
                ? upcomingError.message
                : String(upcomingError)}
            </p>
          ) : upcomingLoading || !upcomingTransactions ? (
            <p className="text-muted-foreground px-6 text-sm">
              {t("upcoming-cards.loading")}
            </p>
          ) : (
          <div className="min-w-full">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="dark:border-border-blue">
                  {upComingTableHeadings.map((heading) => (
                    <TableHead
                      className="font-bold text-gray-500 dark:text-gray-400/80"
                      key={heading}
                    >
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-x-scroll">
                  {upcomingTransactions.length > 0 ? (
                    upcomingTransactions.map((data) => (
                      <TableRow className="dark:border-border-blue" key={data.id}>
                        <TableCell>{data.date}</TableCell>
                        <TableCell>{data.name}</TableCell>
                        <TableCell>{data.account}</TableCell>
                        <TableCell>{data.amount}</TableCell>
                        <TableCell>
                          <DashboardTableAdjustDialog templateId={data.templateId} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-gray-500"
                      >
                        {t("upcoming-cards.no-transactions")}
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>
      <Card className="bg-blue-background dark:border-border-blue col-span-full lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("warning-cards.title")}</CardTitle>
          <Button
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          >
            {t("warning-cards.button")}
          </Button>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="space-y-3">
          {warningCards.map((card, idx) => (
            <div
              key={card.title}
              className={cn(
                "bg-badge-background flex items-center gap-2 rounded-full border px-4 py-2",
                idx === 0 && "border-[#9A6F42]",
                idx === 1 && "border-[#9A4249]",
              )}
            >
              <p className="text-sm">{card.title}</p>
              {card.badge && (
                <Badge
                  variant="outline"
                  className="bg-dark-blue-background rounded-full px-2 py-1"
                >
                  {card.badge}
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
