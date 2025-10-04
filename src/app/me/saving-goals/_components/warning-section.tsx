import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export function WarningSection() {
  const t = useTranslations("main-dashboard.saving-goals-page.warning-section");
  return (
    <section>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Button>{t("button")}</Button>
        </CardHeader>
        <Separator />
        <CardContent>
          <Badge variant="outline" className="rounded-full px-3 py-2">
            {t("badge")}
          </Badge>
        </CardContent>
      </Card>
    </section>
  );
}
