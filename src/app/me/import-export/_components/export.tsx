import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function Export() {
  const t = useTranslations("main-dashboard.import-export-page.export-section");

  const buttons: string[] = [
    t("export-card.buttons.transactions"),
    t("export-card.buttons.budgets"),
    t("export-card.buttons.savings-goals"),
    t("export-card.buttons.accounts"),
    t("export-card.buttons.transfers"),
  ];

  return (
    <section>
      <Card className="bg-blue-background dark:border-[#1A2441]">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant="outline" className="rounded-full px-3 py-2">
            {t("badge")}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-[#1A2441]" />
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <Card className="bg-blue-background dark:border-[#1A2441]">
            <CardHeader>
              <CardTitle>{t("export-card.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {buttons.map((title) => (
                <Button variant="outline" key={title}>
                  {title}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="bg-blue-background dark:border-[#1A2441]">
            <CardHeader>
              <CardTitle>{t("export-json-card.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p>{t("export-json-card.content")}</p>
              <Button variant="outline">{t("export-json-card.button")}</Button>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="bg-blue-background dark:border-[#1A2441]">
            <CardHeader>
              <CardTitle>{t("csv-template-card.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {buttons.map((title) => (
                <Button variant="outline" key={title}>
                  {title}
                </Button>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  );
}
