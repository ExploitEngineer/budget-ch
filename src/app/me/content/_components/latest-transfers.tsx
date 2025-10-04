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
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Button>{t("button")}</Button>
        </CardHeader>
        <Separator />
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
