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
import { usePlansData } from "./data";
import { Button } from "@/components/ui/button";

export function PlansUpgrade() {
  const t = useTranslations(
    "main-dashboard.settings-page.plans-upgrade-section",
  );
  const { cards } = usePlansData();

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <ToggleGroup
            className="inline-flex flex-none items-center gap-1 rounded-lg border"
            type="single"
            aria-label="view"
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

            <ToggleGroupItem value="2-months" className="px-3 py-1 text-sm">
              <span className="inline-block max-w-[10rem] truncate">
                {t("buttons.2-months")}
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <Separator />
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, idx) => (
            <Card key={idx} className="flex flex-col justify-between gap-3">
              <CardHeader className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{card.title}</CardTitle>
                <h1 className="text-lg font-bold">
                  {card.amount}{" "}
                  {idx === 0 ? null : t("plans-cards.individual-card.year")}
                </h1>
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
                <Button>{card.button}</Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="mt-3 flex justify-end">
          <Button className="cursor-pointer">
            {t("plans-cards.stripe-portal-button")}
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
