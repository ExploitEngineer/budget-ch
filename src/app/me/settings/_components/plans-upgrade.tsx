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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { usePricingCardsData, type PlanCard } from "@/hooks/use-pricing-cards-data";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/lib/stripe/stripe-utils";
import { useRouter } from "next/navigation";
import { UserType } from "@/db/schema";
import type { SubscriptionDetails } from "../types";
import { createStripePortalSession } from "../actions";

interface PlansUpgradeProps {
  subscriptionPrices: Record<string, number>;
  user: UserType;
  subscription?: SubscriptionDetails | null;
}

export function PlansUpgrade({
  subscriptionPrices,
  user,
  subscription,
}: PlansUpgradeProps) {
  const router = useRouter();
  const t = useTranslations(
    "main-dashboard.settings-page.plans-upgrade-section",
  );
  const { cards } = usePricingCardsData();
  const [planDuration, setPlanDuration] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [isPortalPending, startPortalTransition] = useTransition();
  const subscriptionPlanId = subscription?.plan;
  const hasSubscription = Boolean(subscription);

  async function handleNewSubscription(lookupKey: string) {
    const { success, data, message } = await createCheckoutSession({
      lookupKey,
      customerId: user.stripeCustomerId!,
      userId: user.id,
      returnUrlOnly: true,
    });
    if (data?.url) {
      router.push(data.url);
    } else {
      toast.error(message || "Failed to create checkout session");
    }
  }

  const openStripePortal = () => {
    startPortalTransition(() => {
      void (async () => {
        try {
          const result = await createStripePortalSession();
          if (result.success && result.data?.url) {
            router.push(result.data.url);
            return;
          }

          toast.error(
            result.message || t("plans-cards.errors.portal-failed"),
          );
        } catch (err) {
          const errorMessage =
            (err as Error).message || t("plans-cards.errors.portal-failed");
          toast.error(errorMessage);
        }
      })();
    });
  };

  const handlePlanCardAction = (card: PlanCard) => {
    if (card.planId === "free" || hasSubscription) {
      return;
    }

    const lookupKey =
      planDuration === "monthly"
        ? card.lookupKeyMonthly
        : card.lookupKeyYearly;

    if (!lookupKey) {
      toast.error(t("plans-cards.errors.no-price"));
      return;
    }

    handleNewSubscription(lookupKey);
  };

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
            {cards.map((card) => {
            const isFreePlan = card.planId === "free";
            const isCurrentPlan =
              hasSubscription &&
                !isFreePlan &&
              subscriptionPlanId === card.planId;
            const planButtonText = isCurrentPlan
              ? t("plans-cards.manage-plan-button")
              : card.button;
            const lookupKey =
              planDuration === "monthly"
                ? card.lookupKeyMonthly
                : card.lookupKeyYearly;
            const planPrice =
              lookupKey !== undefined
                ? subscriptionPrices[lookupKey]
                : undefined;

            return (
              <Card
                key={card.planId}
                className="bg-blue-background dark:border-border-blue flex flex-col justify-between gap-3"
              >
                <CardHeader className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col gap-2">
                    <CardTitle>{card.title}</CardTitle>
                    {isCurrentPlan && hasSubscription && (
                      <Badge
                        variant="outline"
                        className="uppercase tracking-wide text-xs font-bold text-muted-foreground"
                      >
                        {t("plans-cards.current-plan-badge")}
                      </Badge>
                    )}
                  </div>
                  {card.planId !== "free" && planPrice != null && (
                    <h1 className="text-lg font-bold">
                      CHF {planPrice} /{" "}
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
                {!hasSubscription && (
                  <CardFooter className="flex justify-end">
                    <Button
                      variant="outline"
                      className={cn(
                        "cursor-pointer",
                        isFreePlan
                          ? "!bg-dark-blue-background dark:border-border-blue"
                          : "btn-gradient",
                      )}
                      disabled={isFreePlan}
                      onClick={() => handlePlanCardAction(card)}
                    >
                      {planButtonText}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </CardContent>
        {hasSubscription && (
          <CardFooter className="mt-3 flex justify-end">
            <Button
              variant="outline"
              className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
              disabled={isPortalPending}
              onClick={openStripePortal}
            >
              {t("plans-cards.stripe-portal-button")}
            </Button>
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
