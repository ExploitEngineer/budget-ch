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
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>{" "}
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
              {detailedTableData.map((data, idx: number) => (
                <TableRow className="dark:border-border-blue" key={idx}>
                  <TableCell>{data}</TableCell>
                  <TableCell>CHF 1’920.00</TableCell>
                </TableRow>
              ))}
              <TableRow className="dark:border-border-blue">
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
