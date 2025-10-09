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

interface BudgetProgressSectionProps {
  progressCards: ProgressCards[];
}

export function BudgetProgressSection({
  progressCards,
}: BudgetProgressSectionProps) {
  const t = useTranslations("main-dashboard.dashboard-page");

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-5">
      <Card className="bg-blue-background dark:border-border-blue lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("line-progress-cards.title")}</CardTitle>
          <Button
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          >
            {t("line-progress-cards.button")}
          </Button>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <div className="grid grid-cols-2 gap-4 pb-10">
          {progressCards.map((card) => (
            <CardContent key={card.title} className="flex flex-col">
              <div className="mb-3 flex flex-wrap items-center justify-between sm:mb-1">
                <h3 className="text-sm sm:text-base">{card.title}</h3>
                <h3 className="text-sm sm:text-base">{card.content}</h3>
              </div>
              <Progress value={card.value} />
            </CardContent>
          ))}
        </div>
      </Card>
      <Card className="bg-blue-background dark:border-border-blue flex flex-col justify-between lg:col-span-2">
        <div className="flex flex-col gap-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{t("todos.title")}</CardTitle>
            <Badge
              variant="outline"
              className="bg-badge-background dark:border-border-blue rounded-full px-2 py-1"
            >
              {t("todos.button")}
            </Badge>
          </CardHeader>
          <Separator className="dark:bg-border-blue" />
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox />
                <h3>new todo</h3>
              </div>
              <Button
                variant="outline"
                className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
              >
                <X />
              </Button>
            </div>
          </CardContent>
        </div>
        <CardContent className="flex items-center justify-between gap-2">
          <Input
            type="text"
            className="!bg-dark-blue-background dark:border-border-blue"
            placeholder={t("todos.placeholder")}
          />
          <Button
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          >
            <Plus />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
