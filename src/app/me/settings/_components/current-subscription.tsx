"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SubscriptionPlan, SubscriptionStatus } from "@/db/schema";
import { differenceInCalendarDays, format } from "date-fns";
import { useTranslations } from "next-intl";

interface CurrentSubscriptionProps {
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
}

function getStatusLabel(status: SubscriptionStatus) {
  return status
    .split("_")
    .map((segment) =>
      segment ? `${segment[0].toUpperCase()}${segment.slice(1)}` : ""
    )
    .join(" ");
}

export function CurrentSubscription({ subscription }: CurrentSubscriptionProps) {
  const t = useTranslations("main-dashboard.settings-page.subscription-section");
  const startDate = new Date(subscription.currentPeriodStart);
  const endDate = new Date(subscription.currentPeriodEnd);
  const today = new Date();
  const daysRemaining = Math.max(differenceInCalendarDays(endDate, today), 0);
  const planLabel = t(`plan-labels.${subscription.plan}`);
  const statusLabel = getStatusLabel(subscription.status);

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("plan-label")}: {planLabel}
            </p>
          </div>
          <Badge
            variant="outline"
            className="dark:border-border-blue rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide"
          >
            {statusLabel}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("started-label")}
            </p>
            <p className="text-base font-semibold">{format(startDate, "PPP")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("renewal-label")}
            </p>
            <p className="text-base font-semibold">{format(endDate, "PPP")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("days-remaining-label")}
            </p>
            <p className="text-2xl font-bold">{daysRemaining}</p>
          </div>
        </CardContent>
        {/* <CardFooter className="flex justify-end">
          <Button
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          >
            {t("cancel-button")}
          </Button>
        </CardFooter> */}
      </Card>
    </section>
  );
}

