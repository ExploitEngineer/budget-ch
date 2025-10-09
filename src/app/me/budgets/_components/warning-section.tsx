import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export function WarningSection() {
  const t = useTranslations("main-dashboard.budgets-page.warning-section");
  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Button
            variant="outline"
            className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
          >
            {t("button")}
          </Button>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge
            className="bg-badge-background rounded-full border-[#996E41] px-3 py-2"
            variant="outline"
          >
            {t("badges.restaurant")}
          </Badge>
          <Badge
            className="bg-badge-background rounded-full border-[#996E41] px-3 py-2"
            variant="outline"
          >
            {t("badges.health")}
          </Badge>
        </CardContent>
      </Card>
    </section>
  );
}
