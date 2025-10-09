import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function QuickAccess() {
  const t = useTranslations("main-dashboard.help-page");

  const Buttons: string[] = [
    t("buttons.tour"),
    t("buttons.faqs"),
    t("buttons.close-all"),
    t("buttons.attach"),
    t("buttons.contact-support"),
  ];

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge
            variant="outline"
            className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
          >
            {t("badge")}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="flex flex-wrap items-center gap-2">
          {Buttons.map((button, idx: number) => (
            <Button
              variant="outline"
              key={button}
              className={cn(
                idx === Buttons.length - 1
                  ? "btn-gradient"
                  : "!bg-dark-blue-background dark:border-border-blue",
              )}
            >
              {button}
            </Button>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
