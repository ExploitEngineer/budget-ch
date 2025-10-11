"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function DataPrivacy() {
  const t = useTranslations(
    "main-dashboard.settings-page.data-privacy-section",
  );

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm">{t("labels.data-export.title")}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="dark:border-border-blue !bg-dark-blue-background"
              >
                {t("labels.data-export.buttons.json")}
              </Button>
              <Button variant="outline" className="!bg-[#EF4444] text-white">
                {t("labels.data-export.buttons.delete-account")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
