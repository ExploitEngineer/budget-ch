import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface ProgressCards {
  title: string;
  content: string;
  value: number;
}

export function BudgetProgressSection() {
  const t = useTranslations("main-dashboard.dashboard-page");

  const progressCards: ProgressCards[] = [
    {
      title: t("line-progress-cards.card-1.title"),
      content: "CHF 520 / 800",
      value: 70,
    },
    {
      title: t("line-progress-cards.card-2.title"),
      content: "CHF 410 / 500",
      value: 60,
    },
    {
      title: t("line-progress-cards.card-3.title"),
      content: "CHF 190 / 300",
      value: 50,
    },
    {
      title: t("line-progress-cards.card-4.title"),
      content: "CHF 260 / 400",
      value: 40,
    },
  ];
  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("line-progress-cards.title")}</CardTitle>
          <Button>{t("line-progress-cards.button")}</Button>
        </CardHeader>
        <Separator />
        <div className="grid grid-cols-2 gap-4 pb-10">
          {progressCards.map((card) => (
            <CardContent key={card.title} className="flex flex-col">
              <div className="flex items-center justify-between">
                <h3>{card.title}</h3>
                <h3>{card.content}</h3>
              </div>
              <Progress value={card.value} />
            </CardContent>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col justify-between lg:col-span-2">
        <div className="flex flex-col gap-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{t("todos.title")}</CardTitle>
            <Badge>{t("todos.button")}</Badge>
          </CardHeader>
          <Separator />
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox />
                <h3>new todo</h3>
              </div>
              <Button>
                <X />
              </Button>
            </div>
          </CardContent>
        </div>
        <CardContent className="flex items-center justify-between gap-2">
          <Input type="text" placeholder={t("todos.placeholder")} />
          <Button>
            <Plus />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
