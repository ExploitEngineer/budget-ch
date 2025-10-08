import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

export function Privacy() {
  const t = useTranslations("main-dashboard.help-page.privary-section");
  return (
    <section>
      <Card className="bg-blue-background dark:border-[#1A2441]">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-[#1A2441]" />
        <CardContent>
          <p className="opacity-60">{t("content")}</p>
        </CardContent>
      </Card>
    </section>
  );
}
