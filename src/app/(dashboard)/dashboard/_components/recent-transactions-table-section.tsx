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
  recentTransactionsTableHeadings: string[];
  recentTranasactionsTables: RecentTransactionsTables[];
}

export function RecentTransactionsTableSection({
  recentTransactionsTableHeadings,
  recentTranasactionsTables,
}: RecentTransactionsTableSectionProps) {
  const t = useTranslations("main-dashboard.dashboard-page");

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("upcoming-cards.title")}</CardTitle>
          <Badge>{t("upcoming-cards.button")}</Badge>
        </CardHeader>
        <Separator />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {recentTransactionsTableHeadings.map((heading) => (
                  <TableHead>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTranasactionsTables.map((data) => (
                <TableRow key={data.recipient}>
                  <TableCell>25.9.2025</TableCell>
                  <TableCell>{data.recipient}</TableCell>
                  <TableCell>{data.account}</TableCell>
                  <TableCell>{data.category}</TableCell>
                  <TableCell>{data.note}</TableCell>
                  <TableCell className="self-end">{data.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
