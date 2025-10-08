import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableCell,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";

interface RecentTransactionsTables {
  recipient: string;
  account: string;
  category: string;
  note: string;
  amount: string;
}

interface RecentTransactionsTableSectionProps {
  recentTranasactionsTables: RecentTransactionsTables[];
}

export function RecentTransactionsTableSection({
  recentTranasactionsTables,
}: RecentTransactionsTableSectionProps) {
  const t = useTranslations("main-dashboard.dashboard-page");

  const recentTransactionsTableHeadings: string[] = [
    t("recent-transactions-table.table-headings.date"),
    t("recent-transactions-table.table-headings.recipient.title"),
    t("recent-transactions-table.table-headings.account.title"),
    t("recent-transactions-table.table-headings.category.title"),
    t("recent-transactions-table.table-headings.note.title"),
    t("recent-transactions-table.table-headings.amount"),
  ];

  return (
    <section className="grid auto-rows-min grid-cols-6">
      <Card className="bg-blue-background col-span-full dark:border-[#1A2441]">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("upcoming-cards.title")}</CardTitle>
          <Badge variant="outline">{t("upcoming-cards.button")}</Badge>
        </CardHeader>
        <Separator className="dark:bg-[#1A2441]" />
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                {recentTransactionsTableHeadings.map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTranasactionsTables.map((data) => (
                <TableRow key={data.recipient}>
                  <TableCell>25.9.2025</TableCell>
                  <TableCell>{data.recipient}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {data.account}
                  </TableCell>
                  <TableCell>{data.category}</TableCell>
                  <TableCell>{data.note}</TableCell>
                  <TableCell className="self-end">{data.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
