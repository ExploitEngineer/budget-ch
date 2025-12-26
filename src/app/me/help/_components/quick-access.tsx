"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

interface QuickAccessProps {
  onOpenAll?: () => void;
  onCloseAll?: () => void;
}

export function QuickAccess({ onOpenAll, onCloseAll }: QuickAccessProps) {
  const t = useTranslations("main-dashboard.help-page");

  const handleScrollToContactForm = () => {
    const element = document.getElementById("contact-support-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

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
          {/* Hidden for now
          <Button
            variant="outline"
            className="!bg-dark-blue-background dark:border-border-blue"
          >
            {t("buttons.tour")}
          </Button>
          */}
          <Button
            variant="outline"
            className="!bg-dark-blue-background dark:border-border-blue"
            onClick={onOpenAll}
          >
            {t("buttons.faqs")}
          </Button>
          <Button
            variant="outline"
            className="!bg-dark-blue-background dark:border-border-blue"
            onClick={onCloseAll}
          >
            {t("buttons.close-all")}
          </Button>
          {/* Hidden for now
          <Button
            variant="outline"
            className="!bg-dark-blue-background dark:border-border-blue"
          >
            {t("buttons.attach")}
          </Button>
          */}
          <Button
            variant="outline"
            className="btn-gradient"
            onClick={handleScrollToContactForm}
          >
            {t("buttons.contact-support")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
