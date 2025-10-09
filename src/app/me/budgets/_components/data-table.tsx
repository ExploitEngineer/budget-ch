import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableRow,
  TableHeader,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import BudgetDialog from "./budget-dialog";

interface TableData {
  category: string;
  budget: string;
  ist: string;
  rest: string;
  value: number;
  action: string;
}

interface BudgetDataTableProps {
  tableData: TableData[];
}

export function BudgetDataTable({ tableData }: BudgetDataTableProps) {
  const t = useTranslations("main-dashboard.budgets-page");

  const budgetDataTableHeadings: string[] = [
    t("data-table.headings.category"),
    t("data-table.headings.budget"),
    t("data-table.headings.ist"),
    t("data-table.headings.rest"),
    t("data-table.headings.progress"),
    t("data-table.headings.action"),
  ];

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{t("data-table.title")}</CardTitle>{" "}
            <Badge
              className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
              variant="outline"
            >
              {t("data-table.badge")}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
            >
              {t("data-table.buttons.export")}
            </Button>
            <Button
              variant="outline"
              className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
            >
              {t("data-table.buttons.reset")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="dark:border-border-blue">
                {budgetDataTableHeadings.map((heading) => (
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
              {tableData.map((data) => (
                <TableRow
                  className="dark:border-border-blue"
                  key={data.category}
                >
                  <TableCell>{data.category}</TableCell>
                  <TableCell>{data.budget}</TableCell>
                  <TableCell>{data.ist}</TableCell>
                  <TableCell>{data.rest}</TableCell>
                  <TableCell>
                    <Progress value={data.value} />
                  </TableCell>
                  <TableCell>
                    <BudgetDialog variant="outline" text={data.action} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="bg-border-blue mt-2" />
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            className="dark:border-border-blue bg-dark-blue-background border"
            type="single"
          >
            <ToggleGroupItem value="month" aria-label="toggle-month">
              {t("data-table.toggle-groups.month")}
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="toggle-week">
              {t("data-table.toggle-groups.week")}
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            className="dark:border-border-blue bg-dark-blue-background border"
            type="single"
          >
            <ToggleGroupItem value="warn-80" aria-label="toggle-warn-80">
              {t("data-table.toggle-groups.warn-80")}
            </ToggleGroupItem>
            <ToggleGroupItem value="warn-90" aria-label="toggle-warn-90">
              {t("data-table.toggle-groups.warn-90")}
            </ToggleGroupItem>
            <ToggleGroupItem value="warn-100" aria-label="toggle-warn-100">
              {t("data-table.toggle-groups.warn-100")}
            </ToggleGroupItem>
          </ToggleGroup>
        </CardFooter>
      </Card>
    </section>
  );
}
