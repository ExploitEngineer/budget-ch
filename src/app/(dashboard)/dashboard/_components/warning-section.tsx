import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface UpComingTables {
  name: string;
  account: string;
  amount: string;
}

interface WarningCards {
  title: string;
  badge?: string;
}

interface WarningSectionProps {
  upComingTableHeadings: string[];
  upComingTables: UpComingTables[];
  warningCards: WarningCards[];
}

export function WarningSection({
  warningCards,
  upComingTableHeadings,
  upComingTables,
}: WarningSectionProps) {
  const t = useTranslations("main-dashboard.dashboard-page");

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-6">
      <Card className="lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("upcoming-cards.title")}</CardTitle>
          <Badge>{t("upcoming-cards.button")}</Badge>
        </CardHeader>
        <Separator />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {upComingTableHeadings.map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {upComingTables.map((data) => (
                <TableRow key={data.name}>
                  <TableCell>25.9.2025</TableCell>
                  <TableCell>{data.name}</TableCell>
                  <TableCell>{data.account}</TableCell>
                  <TableCell>{data.amount}</TableCell>
                  <TableCell>
                    <Button className="text-xs">
                      {t("upcoming-cards.table-data.button")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("warning-cards.title")}</CardTitle>
          <Button>{t("warning-cards.button")}</Button>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3">
          {warningCards.map((card) => (
            <div
              key={card.badge}
              className="flex items-center gap-2 rounded-full border px-4 py-3"
            >
              <p>{card.title}</p>
              {card.badge && <Badge>{card.badge}</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
