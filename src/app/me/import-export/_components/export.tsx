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
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge
            variant="outline"
            className="dark:border-border-blue bg-badge-background rounded-full px-3 py-2"
          >
            {t("badge")}
          </Badge>
        </CardHeader>

        <Separator className="dark:bg-border-blue" />

        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-blue-background dark:border-border-blue">
            <CardHeader className="m-0">
              <CardTitle>{t("export-card.title")}</CardTitle>
            </CardHeader>
            <Separator className="dark:bg-border-blue" />
            <CardContent className="mt-3 grid grid-cols-2 gap-3">
              {buttons.map((title) => (
                <Button
                  key={title}
                  variant="outline"
                  className="!bg-dark-blue-background dark:border-border-blue text-foreground"
                >
                  {title}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-blue-background dark:border-border-blue">
            <CardHeader>
              <CardTitle>{t("export-json-card.title")}</CardTitle>
            </CardHeader>
            <Separator className="dark:bg-border-blue" />
            <CardContent className="mt-3 flex flex-col gap-3">
              <p>{t("export-json-card.content")}</p>
              <Button
                variant="outline"
                className="btn-gradient dark:text-foreground w-[30%]"
              >
                {t("export-json-card.button")}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-blue-background dark:border-border-blue">
            <CardHeader>
              <CardTitle>{t("csv-template-card.title")}</CardTitle>
            </CardHeader>
            <Separator className="dark:bg-border-blue" />
            <CardContent className="mt-3 grid grid-cols-2 gap-3">
              {buttons.map((title) => (
                <Button
                  key={title}
                  variant="outline"
                  className="!bg-dark-blue-background shadow-dark-blue-background dark:border-border-blue text-foreground shadow-4xl border-dashed"
                >
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
