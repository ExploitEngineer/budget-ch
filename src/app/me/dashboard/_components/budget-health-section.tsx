import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { useTranslations } from "next-intl";

interface Cards {
  title: string;
  value: string;
}

interface BudgetHealthSectionProps {
  cards: Cards[];
}

export function BudgetHealthSection({ cards }: BudgetHealthSectionProps) {
  const t = useTranslations("main-dashboard.dashboard-page.budget-health");

  return (
    <div className="w-full">
      <Card className="bg-blue-background dark:border-border-blue w-full">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <p className="text-gray-400/80">{t("secondary-title")}</p>
        </CardHeader>

        <Separator className="dark:bg-border-blue" />

        <CardContent>
          <div className="flex flex-wrap gap-4 lg:flex-nowrap">
            <Card className="bg-blue-background dark:border-border-blue flex-1 p-1 lg:flex-[0.2]">
              <CardContent className="flex items-center gap-3 p-4">
                <AnimatedCircularProgressBar className="h-20 w-20" value={33} />
                <div className="w-full">
                  <p className="text-xs font-light">
                    {t("warning-card.title")}
                  </p>
                  <h3 className="text-lg font-bold">33%</h3>
                  <p className="text-sm">{t("warning-card.warning")}</p>
                  <p className="text-muted-foreground text-xs">
                    {t("warning-card.spending")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-4 lg:flex-1">
              {cards.map((card) => (
                <Card
                  key={card.title}
                  className="bg-blue-background dark:border-border-blue my-auto min-w-[160px] flex-1 p-0 lg:flex-[1.2]"
                >
                  <CardContent className="flex flex-col gap-2 p-4">
                    <p className="text-xs font-light uppercase sm:text-sm">
                      {card.title}
                    </p>
                    <h2 className="text-lg font-bold">{card.value}</h2>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
