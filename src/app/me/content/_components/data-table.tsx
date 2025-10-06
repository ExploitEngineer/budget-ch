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

interface TableData {
  name: string;
  type: string;
  iban: string;
  balance: string;
  action: string;
}

interface ContentDataTableProps {
  tableData: TableData[];
}

export function ContentDataTable({ tableData }: ContentDataTableProps) {
  const t = useTranslations("main-dashboard.content-page.data-table");

  const budgetDataTableHeadings: string[] = [
    t("headings.name"),
    t("headings.type"),
    t("headings.iban"),
    t("headings.balance"),
    t("headings.action"),
  ];

  return (
    <section className="grid auto-rows-min grid-cols-6">
      <Card className="col-span-full">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{t("title")}</CardTitle>{" "}
            <Badge className="rounded-full px-3 py-2" variant="outline">
              {t("badge")}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="cursor-pointer">
              {t("buttons.export")}
            </Button>
            <Button variant="outline" className="cursor-pointer">
              {t("buttons.reset")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow>
                {budgetDataTableHeadings.map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((data) => (
                <TableRow key={data.name}>
                  <TableCell>{data.name}</TableCell>
                  <TableCell>{data.type}</TableCell>
                  <TableCell>{data.iban}</TableCell>
                  <TableCell>{data.balance}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      className="cursor-pointer text-xs"
                    >
                      {data.action}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold opacity-60">
                  {t("total")}
                </TableCell>
                <TableCell colSpan={2} />
                <TableCell className="font-bold opacity-60">
                  CHF 15’500.00
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
