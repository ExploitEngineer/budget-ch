import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";

export function Settings() {
  const t = useTranslations(
    "main-dashboard.budgets-page.warning-section.settings",
  );
  return (
    <section>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Button variant="outline" className="cursor-pointer">
            {t("button")}
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="cursor-pointer rounded-full px-3 py-2"
            asChild
          >
            <label className="flex items-center gap-2">
              <Checkbox />
              <span>{t("checkboxes.carry")}</span>
            </label>
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer rounded-full px-3 py-2"
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
