import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export function WarningSection() {
  const t = useTranslations("main-dashboard.saving-goals-page.warning-section");
  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Button
            variant="outline"
            className="!bg-dark-blue-background dark:border-border-blue"
          >
            {t("button")}
          </Button>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          <Badge
            variant="outline"
            className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
          >
            {t("badge")}
          </Badge>
        </CardContent>
      </Card>
    </section>
  );
}
