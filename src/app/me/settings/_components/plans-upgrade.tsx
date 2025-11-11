"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { usePricingCardsData } from "@/hooks/use-pricing-cards-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
interface PlansUpgradeProps {
  subscriptionPrices: Record<string, number>;
}

export function PlansUpgrade({ subscriptionPrices }: PlansUpgradeProps) {
  const t = useTranslations(
    "main-dashboard.settings-page.plans-upgrade-section",
  );
  const { cards } = usePricingCardsData();
  const [planDuration, setPlanDuration] = useState<"monthly" | "yearly">(
    "monthly",
  );

  return (
    <section className="space-y-4">
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <ToggleGroup
            className="bg-dark-blue-background dark:border-border-blue inline-flex flex-none items-center gap-1 rounded-lg border"
            type="single"
            aria-label="view"
            value={planDuration}
            onValueChange={(value) =>
              setPlanDuration(value as "monthly" | "yearly")
            }
          >
            <ToggleGroupItem
              value="monthly"
              className="px-3 py-1 text-sm whitespace-nowrap"
            >
              {t("buttons.monthly")}
            </ToggleGroupItem>

            <ToggleGroupItem
              value="yearly"
              className="px-3 py-1 text-sm whitespace-nowrap"
            >
              {t("buttons.yearly")}
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, idx) => (
            <Card
              key={idx}
              className="bg-blue-background dark:border-border-blue flex flex-col justify-between gap-3"
            >
              <CardHeader className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{card.title}</CardTitle>
                {idx !== 0 && (
                  <h1 className="text-lg font-bold">
                    CHF{" "}
                    {planDuration === "monthly"
                      ? subscriptionPrices[card.lookupKeyMonthly!]
                      : subscriptionPrices[card.lookupKeyYearly!]}{" "}
                    /{" "}
                    {planDuration === "monthly"
                      ? t("plans-cards.individual-card.month")
                      : t("plans-cards.individual-card.year")}
                  </h1>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-5 text-sm">
                  👉 {card.subTitle}
                </p>
                <ul className="mb-4 list-disc space-y-1 ps-5 text-sm">
                  {Object.values(card.options).map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  className={cn(
                    idx === 0
                      ? "!bg-dark-blue-background dark:border-border-blue"
                      : "btn-gradient",
                  )}
                >
                  {card.button}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="mt-3 flex justify-end">
          <Button
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          >
            {t("plans-cards.stripe-portal-button")}
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
