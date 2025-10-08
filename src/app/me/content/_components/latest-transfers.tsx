import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { useTranslations } from "next-intl";

export function LatestTransfers() {
  const t = useTranslations(
    "main-dashboard.content-page.latest-tranfers-section",
  );

  const tableHeadings: string[] = [
    t("data-table.headings.date"),
    t("data-table.headings.from"),
    t("data-table.headings.to"),
    t("data-table.headings.note"),
    t("data-table.headings.amount"),
  ];

  return (
    <section>
      <Card className="bg-blue-background dark:border-[#1A2441]">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Button variant="outline">{t("button")}</Button>
        </CardHeader>
        <Separator className="dark:bg-[#1A2441]" />
        <CardContent className="flex flex-wrap items-center gap-2">
          <Table>
            <TableHeader>
              <TableRow>
                {tableHeadings.map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
