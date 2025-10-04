import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

export function QuickAccess() {
  const t = useTranslations("main-dashboard.help-page");

  return (
    <section>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant="outline" className="rounded-full px-3 py-2">
            {t("badge")}
          </Badge>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button>{t("buttons.tour")}</Button>
          <Button>{t("buttons.faqs")}</Button>
          <Button>{t("buttons.close-all")}</Button>
          <Button>{t("buttons.attach")}</Button>
          <Button className="cursor-pointer px-6 py-4 transition-all duration-300 hover:bg-blue-600 hover:text-white">
            {t("buttons.contact-support")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
