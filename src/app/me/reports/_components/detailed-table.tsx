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

export function DetailedTable({
  detailedTableData,
}: {
  detailedTableData: string[];
}) {
  const t = useTranslations("main-dashboard.report-page.detailed-table");

  const tableHeadings: string[] = [
    t("data-table.headings.category"),
    t("data-table.headings.amount"),
  ];

  return (
    <section>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>{" "}
          <div className="flex items-center gap-2">
            <Button variant="outline">{t("buttons.categories-csv")}</Button>
            <Button variant="outline">{t("buttons.trend-csv")}</Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {tableHeadings.map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedTableData.map((data, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{data}</TableCell>
                  <TableCell>CHF 1’920.00</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold opacity-60">
                  {t("data-table.data.total")}
                </TableCell>
                <TableCell className="font-bold opacity-60">
                  CHF 3’990.00
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
