import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
import BudgetDialog from "./budget-dialog";

export function Settings() {
  const t = useTranslations(
    "main-dashboard.budgets-page.warning-section.settings",
  );

  const title = t("button");
  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <BudgetDialog variant="outline" text={title} />
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="dark:border-border-blue bg-badge-background cursor-pointer rounded-full px-3 py-2"
            asChild
          >
            <label className="flex items-center gap-2">
              <Checkbox />
              <span>{t("checkboxes.carry")}</span>
            </label>
          </Badge>
          <Badge
            variant="outline"
            className="dark:border-border-blue bg-badge-background cursor-pointer rounded-full px-3 py-2"
            asChild
          >
            <label className="flex items-center gap-2">
              <Checkbox />
              <span>{t("checkboxes.e-mail")}</span>
            </label>
          </Badge>
        </CardContent>
      </Card>
    </section>
  );
}
