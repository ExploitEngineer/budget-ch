"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function AboutSection() {
  const t = useTranslations("main-dashboard.settings-page.about-section");

  const Badges: string[] = [
    t("legal.links.terms"),
    t("legal.links.privacy"),
    t("legal.links.imprint"),
  ];

  return (
    <Card className="bg-blue-background dark:border-border-blue">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <Separator className="dark:bg-border-blue" />
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("version.title")}</h3>
            <Badge
              variant="outline"
              className="bg-badge-background dark:border-border-blue rounded-full px-3 py-1"
            >
              {t("version.label")}
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("legal.title")}</h3>
            <div className="flex flex-wrap gap-2">
              {Badges.map((badge) => (
                <Badge
                  key={badge}
                  variant="outline"
                  className="bg-badge-background dark:border-border-blue rounded-full px-3 py-1"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("support.title")}</h3>
          <Textarea
            className="!bg-dark-blue-background"
            placeholder={t("support.placeholder")}
          />
        </div>

        <div className="flex justify-end">
          <Button variant="outline" className="btn-gradient cursor-pointer">
            {t("support.button")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
