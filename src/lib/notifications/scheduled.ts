"use server";

import db from "@/db/db";
import { subscriptions, hubs } from "@/db/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";
import { sendNotification } from "./index";
import {
  SUBSCRIPTION_EXPIRING_3_DAYS,
  SUBSCRIPTION_EXPIRING_1_DAY,
  SUBSCRIPTION_EXPIRED,
} from "./types";
import { addDays, startOfDay, differenceInDays } from "date-fns";

/**
 * Scheduled notification function for subscription expiry checks
 * This function will be called by Lambda cron job daily at 9 AM UTC
 */
export async function scheduledNotifications(): Promise<{
  success: boolean;
  message?: string;
  processed?: number;
}> {
  try {
    const today = startOfDay(new Date());
    const threeDaysFromNow = addDays(today, 3);
    const oneDayFromNow = addDays(today, 1);

    // Get all active subscriptions
    const allSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          lte(subscriptions.currentPeriodEnd, threeDaysFromNow),
        ),
      );

    let processed = 0;

    for (const subscription of allSubscriptions) {
      const periodEnd = startOfDay(new Date(subscription.currentPeriodEnd));
      const daysUntilExpiry = differenceInDays(periodEnd, today);

      // Get user's hub (subscription is per user, and user owns a hub)
      const hub = await db.query.hubs.findFirst({
        where: eq(hubs.userId, subscription.userId),
        columns: { id: true },
      });

      if (!hub) {
        console.warn(
          `No hub found for user ${subscription.userId}, skipping notification`,
        );
        continue;
      }

      const metadata = {
        subscriptionId: subscription.id,
        expiresAt: subscription.currentPeriodEnd.toISOString(),
        daysRemaining: daysUntilExpiry,
      };

      // Check if we should send notification based on days remaining
      if (daysUntilExpiry === 3) {
        // Expiring in 3 days
        await sendNotification({
          typeKey: SUBSCRIPTION_EXPIRING_3_DAYS,
          hubId: hub.id,
          userId: subscription.userId,
          metadata,
        });
        processed++;
      } else if (daysUntilExpiry === 1) {
        // Expiring in 1 day
        await sendNotification({
          typeKey: SUBSCRIPTION_EXPIRING_1_DAY,
          hubId: hub.id,
          userId: subscription.userId,
          metadata,
        });
        processed++;
      } else if (daysUntilExpiry <= 0) {
        // Already expired
        await sendNotification({
          typeKey: SUBSCRIPTION_EXPIRED,
          hubId: hub.id,
          userId: subscription.userId,
          metadata,
        });
        processed++;
      }
    }

    return {
      success: true,
      message: `Processed ${processed} subscription notifications`,
      processed,
    };
  } catch (err: any) {
    console.error("Error in scheduledNotifications:", err);
    return {
      success: false,
      message: err.message || "Failed to process scheduled notifications",
    };
  }
}
