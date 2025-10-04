"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function AboutSection() {
  const t = useTranslations("main-dashboard.settings-page.about-section");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("version.title")}</h3>
            <Badge variant="outline">{t("version.label")}</Badge>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("legal.title")}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{t("legal.links.terms")}</Badge>
              <Badge variant="secondary">{t("legal.links.privacy")}</Badge>
              <Badge variant="secondary">{t("legal.links.imprint")}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("support.title")}</h3>
          <Textarea placeholder={t("support.placeholder")} />
        </div>

        <div className="flex justify-end">
          <Button className="cursor-pointer">{t("support.button")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
