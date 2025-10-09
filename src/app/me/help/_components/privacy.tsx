import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

export function Privacy() {
  const t = useTranslations("main-dashboard.help-page.privary-section");
  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          <p className="opacity-60">{t("content")}</p>
        </CardContent>
      </Card>
    </section>
  );
}
