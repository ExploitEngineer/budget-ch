import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { TableData } from "./data";
import { useTranslations } from "next-intl";

interface ProgressChart {
  title: string;
  amount: string;
  value: number;
}

interface AnalysisTableProps {
  tableData: TableData[];
}

export function AnalysisTable({ tableData }: AnalysisTableProps) {
  const t = useTranslations("main-dashboard.report-page");

  const progressChart: ProgressChart[] = [
    {
      title: t("analysis-table-data.exp-by-cat.progress.groceries"),
      amount: "CHF 820.00",
      value: 40,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.rent"),
      amount: "CHF 1’920.00",
      value: 100,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.transportation"),
      amount: "CHF 320.00",
      value: 20,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.restaurant"),
      amount: "CHF 460.00",
      value: 30,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.household"),
      amount: "CHF 280.00",
      value: 15,
    },
    {
      title: t("analysis-table-data.exp-by-cat.progress.leisure"),
      amount: "CHF 190.00",
      value: 10,
    },
  ];

  const tableHeadings: string[] = [
    t("income-exp.data-table.headings.month"),
    t("income-exp.data-table.headings.income"),
    t("income-exp.data-table.headings.expenses"),
    t("income-exp.data-table.headings.balance"),
  ];

  return (
    <section>
      <Card className="bg-blue-background dark:border-[#1A2441]">
        <CardHeader className="flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{t("analysis-table-data.title")}</CardTitle>{" "}
            <Badge
              className="rounded-full px-3 py-2 whitespace-pre-wrap"
              variant="outline"
            >
              {t("analysis-table-data.badge")}
            </Badge>
          </div>
          <ToggleGroup className="border" type="single">
            <ToggleGroupItem
              className="px-3"
              value="month"
              aria-label="toggle-month"
            >
              {t("analysis-table-data.toggle-groups.month")}
            </ToggleGroupItem>
            <ToggleGroupItem
              className="px-3"
              value="quarter"
              aria-label="toggle-quarter"
            >
              {t("analysis-table-data.toggle-groups.quarter")}
            </ToggleGroupItem>
            <ToggleGroupItem
              className="px-3"
              value="year"
              aria-label="toggle-year"
            >
              {t("analysis-table-data.toggle-groups.year")}
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <Separator className="dark:bg-[#1A2441]" />
        <CardContent className="grid gap-10 lg:grid-cols-2 lg:gap-3">
          <div>
            <h2 className="mb-4 font-bold">
              {t("analysis-table-data.exp-by-cat.title")}
            </h2>
            <div className="flex flex-col gap-3">
              {progressChart.map((data) => (
                <div key={data.title} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3>{data.title}</h3>
                    <h3>{data.amount}</h3>
                  </div>
                  <Progress value={data.value} />
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <h2 className="mb-4 font-bold">{t("income-exp.title")}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  {tableHeadings.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((data) => (
                  <TableRow key={data.month}>
                    <TableCell>{data.month}</TableCell>
                    <TableCell>{data.income}</TableCell>
                    <TableCell>{data.expenses}</TableCell>
                    <TableCell>{data.balance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
