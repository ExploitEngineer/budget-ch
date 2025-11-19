"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { differenceInCalendarDays, format } from "date-fns";
import { useTranslations } from "next-intl";
import type { SubscriptionDetails } from "../types";
import type { SubscriptionStatus } from "@/db/schema";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createStripePortalSession } from "../actions";

interface CurrentSubscriptionProps {
  subscription: SubscriptionDetails;
}

function getStatusLabel(status: SubscriptionStatus) {
  return status
    .split("_")
    .map((segment: string) =>
      segment ? `${segment[0].toUpperCase()}${segment.slice(1)}` : "",
    )
    .join(" ");
}

export function CurrentSubscription({
  subscription,
}: CurrentSubscriptionProps) {

  const t = useTranslations(
    "main-dashboard.settings-page.current-subscription-section",
  );
  const startDate = new Date(subscription.currentPeriodStart);
  const endDate = subscription.cancelAt
    ? new Date(subscription.cancelAt)
    : new Date(subscription.currentPeriodEnd);
  const today = new Date();
  const daysRemaining = Math.max(differenceInCalendarDays(endDate, today), 0);
  const planLabel = t(`plan-labels.${subscription.plan}`);
  const statusLabel = getStatusLabel(subscription.status);
  const [isPortalPending, startPortalTransition] = useTransition();
  const router = useRouter();
  const secondLabel = subscription.cancelAt
    ? t("cancels-at-label")
    : t("renews-label");

  const openStripePortal = () => {
    startPortalTransition(() => {
      void (async () => {
        try {
          const result = await createStripePortalSession();
          if (result.success && result.data?.url) {
            router.push(result.data.url);
            return;
          }
          toast.error(result.message || t("errors.portal-failed"));
        } catch (err) {
          const errorMessage =
            (err as Error).message || t("errors.portal-failed");
          toast.error(errorMessage);
        }
      })();
    });
  };

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("plan-label")}: {planLabel}
            </p>
          </div>
          <Badge
            variant="outline"
            className="dark:border-border-blue rounded-full px-3 py-2 text-xs font-semibold tracking-wide uppercase"
          >
            {statusLabel}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t("started-label")}
            </p>
            <p className="text-base font-semibold">
              {format(startDate, "PPP")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {secondLabel}
            </p>
            <p className="text-base font-semibold">{format(endDate, "PPP")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t("days-remaining-label")}
            </p>
            <p className="text-2xl font-bold">{daysRemaining}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
            disabled={isPortalPending}
            onClick={openStripePortal}
          >
            {t("manage-button")}
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
