"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

interface QuickAccessProps {}

export function QuickAccess({}: QuickAccessProps) {
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
            className="btn-gradient"
            asChild
          >
            <a
              href="https://budgethub.ch/guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("buttons.guide")}
            </a>
          </Button>
          <Button
            variant="outline"
            className="!bg-dark-blue-background dark:border-border-blue"
            onClick={handleScrollToContactForm}
          >
            {t("buttons.contact-support")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
