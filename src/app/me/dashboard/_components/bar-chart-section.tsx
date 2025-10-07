import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HighlightedBarChart } from "@/components/ui/highlighted-bar-chart";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

interface CircleProgressCards {
  title: string;
  value: number;
}

interface BarChartSectionProps {
  circleProgressCards: CircleProgressCards[];
}

export function BarChartSection({ circleProgressCards }: BarChartSectionProps) {
  const t = useTranslations("main-dashboard.dashboard-page");
  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <HighlightedBarChart />
      </div>
      <Card className="flex w-full gap-4 lg:col-span-2 lg:flex-col">
        <CardHeader>
          <CardTitle>{t("progress-cards.title")}</CardTitle>
        </CardHeader>
        <Separator />
        {circleProgressCards.map((card) => (
          <CardContent key={card.title}>
            <Card key={card.title} className="w-full flex-1">
              <CardContent className="flex items-center gap-3">
                <AnimatedCircularProgressBar
                  className="h-20 w-20"
                  // Below two props don't exist in the component
                  // gaugePrimaryColor="gray"
                  // gaugeSecondaryColor="blue"
                  value={card.value}
                />
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-sm font-light">
                    {card.title}
                  </CardTitle>
                  <p className="text-2xl font-bold">{card.value + "%"}</p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        ))}
      </Card>
    </div>
  );
}
