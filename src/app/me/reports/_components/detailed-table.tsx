"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useQuery } from "@tanstack/react-query";
import { getDetailedCategories, type CategoryDetail } from "@/lib/api";
import { reportKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";

export function DetailedTable() {
  const t = useTranslations("main-dashboard.report-page.detailed-table");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const { exportCategories } = useExportCSV();

  const {
    data: categories,
    isLoading: loading,
  } = useQuery<CategoryDetail[]>({
    queryKey: reportKeys.detailedCategories(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getDetailedCategories(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch categories");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const categoriesTotal = categories?.reduce((sum, cat) => sum + cat.totalAmount, 0) ?? 0;

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportCategories({ categories: categories ?? null })}
              className="!bg-dark-blue-background cursor-pointer"
            >
              {t("buttons.categories-csv")}
            </Button>
            <Button
              variant="outline"
              className="!bg-dark-blue-background cursor-pointer"
            >
              {t("buttons.trend-csv")}
            </Button>
          </div>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground px-6 text-sm">{t("loading")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="dark:border-border-blue">
                  <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
                    {t("data-table.headings.category")}
                  </TableHead>
                  <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
                    {t("data-table.headings.amount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat) => (
                  <TableRow key={cat.id} className="dark:border-border-blue">
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>
                      CHF {cat.totalAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="dark:border-border-blue">
                  <TableCell className="font-bold opacity-60">
                    {t("data-table.data.total")}
                  </TableCell>
                  <TableCell className="font-bold opacity-60">
                    CHF {categoriesTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
