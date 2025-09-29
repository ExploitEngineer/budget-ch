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

interface UpcomingTables {
  name: string;
  account: string;
  amount: string;
}

interface WarningCards {
  title: string;
  badge?: string;
}

export function WarningSection() {
  const t = useTranslations("main-dashboard.dashboard-page");

  const upcomingTableHeading: string[] = [
    t("upcoming-cards.table-data.table-heading.date"),
    t("upcoming-cards.table-data.table-heading.name.title"),
    t("upcoming-cards.table-data.table-heading.account.title"),
    t("upcoming-cards.table-data.table-heading.amount"),
  ];

  const upcomingTables: UpcomingTables[] = [
    {
      name: t("upcoming-cards.table-data.table-heading.name.data.insurance"),
      account: t(
        "upcoming-cards.table-data.table-heading.account.data.checking",
      ),
      amount: "CHF 420.00",
    },
    {
      name: t(
        "upcoming-cards.table-data.table-heading.name.data.insurance-bill",
      ),
      account: t(
        "upcoming-cards.table-data.table-heading.account.data.credit-card",
      ),
      amount: "CHF 880.00",
    },
    {
      name: t("upcoming-cards.table-data.table-heading.name.data.rent"),
      account: t(
        "upcoming-cards.table-data.table-heading.account.data.checking",
      ),
      amount: "CHF 1’920.00",
    },
  ];

  const warningCards: WarningCards[] = [
    {
      title: t("warning-cards.card-1.title"),
      badge: t("warning-cards.card-1.badge"),
    },
    {
      title: t("warning-cards.card-2.title"),
      badge: t("warning-cards.card-2.badge"),
    },
    {
      title: t("warning-cards.card-2.title"),
    },
  ];
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
                {upcomingTableHeading.map((heading) => (
                  <TableHead>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingTables.map((data) => (
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
            <div className="flex items-center gap-2 rounded-full border px-4 py-3">
              <p>{card.title}</p>
              {card.badge && <Badge>{card.badge}</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
