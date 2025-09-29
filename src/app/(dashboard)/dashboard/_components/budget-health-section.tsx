import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { useTranslations } from "next-intl";

interface Cards {
  title: string;
  value: string;
}

export function BudgetHealthSection() {
  const t = useTranslations("main-dashboard.dashboard-page.budget-health");

  const cards: Cards[] = [
    { title: t("card-1.title"), value: "CHF 4’703" },
    { title: t("card-2.title"), value: "CHF 2’456" },
    { title: t("card-3.title"), value: "3" },
  ];

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <p>{t("secondary-title")}</p>
        </CardHeader>

        <Separator />

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <AnimatedCircularProgressBar
                className="h-20 w-20"
                gaugePrimaryColor="gray"
                gaugeSecondaryColor="blue"
                value={33}
              />
              <div>
                <p className="text-xs font-light">{t("warning-card.title")}</p>
                <h3 className="text-lg font-bold">33%</h3>
                <p className="text-sm text-red-500">
                  {t("warning-card.warning")}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t("warning-card.spending")}
                </p>
              </div>
            </CardContent>
          </Card>

          {cards.map((card) => (
            <Card key={card.title}>
              <CardContent className="flex flex-col gap-2 p-4">
                <p className="text-xs font-light">{card.title}</p>
                <h2 className="text-lg font-bold">{card.value}</h2>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
