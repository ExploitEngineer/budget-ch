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
  upComingTables: UpComingTables[];
  warningCards: WarningCards[];
}

export function WarningSection({
  warningCards,
  upComingTables,
}: WarningSectionProps) {
  const t = useTranslations("main-dashboard.dashboard-page");

  const upComingTableHeadings: string[] = [
    t("upcoming-cards.table-data.table-heading.date"),
    t("upcoming-cards.table-data.table-heading.name.title"),
    t("upcoming-cards.table-data.table-heading.account.title"),
    t("upcoming-cards.table-data.table-heading.amount"),
  ];

  return (
    <section className="grid auto-rows-min grid-cols-6 gap-4">
      <Card className="col-span-full lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("upcoming-cards.title")}</CardTitle>
          <Badge variant="outline">{t("upcoming-cards.button")}</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="overflow-x-auto">
          <div className="min-w-full">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  {upComingTableHeadings.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-x-scroll">
                {upComingTables.map((data) => (
                  <TableRow key={data.name}>
                    <TableCell>25.9.2025</TableCell>
                    <TableCell>{data.name}</TableCell>
                    <TableCell>{data.account}</TableCell>
                    <TableCell>{data.amount}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        className="cursor-pointer text-xs"
                      >
                        {t("upcoming-cards.table-data.button")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-full lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("warning-cards.title")}</CardTitle>
          <Button variant="outline" className="cursor-pointer">
            {t("warning-cards.button")}
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3">
          {warningCards.map((card) => (
            <div
              key={card.title}
              className="flex items-center gap-2 rounded-full border px-4 py-3"
            >
              <p>{card.title}</p>
              {card.badge && <Badge variant="outline">{card.badge}</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
