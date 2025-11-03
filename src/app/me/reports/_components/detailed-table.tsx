"use client";

import { useEffect } from "react";
import { useReportStore } from "@/store/report-store";
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

export function DetailedTable() {
  const t = useTranslations("main-dashboard.report-page.detailed-table");
  const { categories, categoriesTotal, fetchCategories, loading } =
    useReportStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="!bg-dark-blue-background">
              {t("buttons.categories-csv")}
            </Button>
            <Button variant="outline" className="!bg-dark-blue-background">
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
