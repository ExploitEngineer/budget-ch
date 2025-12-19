"use server";

import db from "@/db/db";
import { eq, and, lte, sql, desc } from "drizzle-orm";
import { sendNotification } from "./index";
import {
  SUBSCRIPTION_EXPIRING_3_DAYS,
  SUBSCRIPTION_EXPIRING_1_DAY,
  SUBSCRIPTION_EXPIRED,
  BUDGET_THRESHOLD_80,
  BUDGET_THRESHOLD_100,
} from "./types";
import { addDays, startOfDay, differenceInDays, format } from "date-fns";
import { subscriptions, hubs, notifications } from "@/db/schema";
import { getBudgetsDB } from "@/db/queries";

/**
 * Checks for subscriptions that are about to expire and sends notifications.
 * Typically runs daily.
 */
export async function checkSubscriptionExpiry(): Promise<{
  success: boolean;
  message?: string;
  processed?: number;
}> {
  try {
    const today = startOfDay(new Date());
    const threeDaysFromNow = addDays(today, 3);
    const oneDayFromNow = addDays(today, 1);

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

      if (daysUntilExpiry === 3) {
        await sendNotification({
          typeKey: SUBSCRIPTION_EXPIRING_3_DAYS,
          hubId: hub.id,
          userId: subscription.userId,
          metadata,
        });
        processed++;
      } else if (daysUntilExpiry === 1) {
        await sendNotification({
          typeKey: SUBSCRIPTION_EXPIRING_1_DAY,
          hubId: hub.id,
          userId: subscription.userId,
          metadata,
        });
        processed++;
      } else if (daysUntilExpiry <= 0) {
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
    console.error("Error in checkSubscriptionExpiry:", err);
    return {
      success: false,
      message: err.message || "Failed to process subscription notifications",
    };
  }
}

/**
 * Checks budget thresholds (80% and 100%) and sends notifications if needed.
 * Typically runs more frequently (e.g., every 30 minutes).
 */
export async function checkBudgetThresholds(): Promise<{
  success: boolean;
  message?: string;
  processed?: number;
}> {
  try {
    const allHubs = await db.select().from(hubs);
    const currentMonth = format(new Date(), "yyyy-MM");
    let processed = 0;

    for (const hub of allHubs) {
      if (!hub.budgetEmailWarnings) continue;

      const budgetsResult = await getBudgetsDB(hub.id);
      if (!budgetsResult.success || !budgetsResult.data) continue;

      for (const budget of budgetsResult.data) {
        const allocated =
          budget.allocatedAmount !== null ? Number(budget.allocatedAmount) : 0;
        if (allocated <= 0) continue;

        const ist = budget.spentAmount !== null ? Number(budget.spentAmount) : 0;
        const spent = Number(budget.calculatedSpentAmount ?? 0);
        const totalSpent = ist + spent;
        const percentage = (totalSpent / allocated) * 100;

        let thresholdType:
          | typeof BUDGET_THRESHOLD_80
          | typeof BUDGET_THRESHOLD_100
          | null = null;
        if (percentage >= 100) {
          thresholdType = BUDGET_THRESHOLD_100;
        } else if (percentage >= 80) {
          thresholdType = BUDGET_THRESHOLD_80;
        }

        if (thresholdType) {
          const existingNotification = await db.query.notifications.findFirst({
            where: (n, { and, eq, sql }) =>
              and(
                eq(n.hubId, hub.id),
                eq(
                  n.type,
                  thresholdType === BUDGET_THRESHOLD_100 ? "error" : "warning",
                ),
                sql`${n.metadata}->>'budgetId' = ${budget.id}`,
                sql`${n.metadata}->>'period' = ${currentMonth}`,
              ),
          });

          if (!existingNotification) {
            await sendNotification({
              typeKey: thresholdType,
              hubId: hub.id,
              userId: null,
              metadata: {
                budgetId: budget.id,
                categoryName: budget.categoryName,
                spentAmount: totalSpent,
                allocatedAmount: allocated,
                period: currentMonth,
              },
            });
            processed++;
          }
        }
      }
    }

    return {
      success: true,
      message: `Processed ${processed} budget threshold notifications`,
      processed,
    };
  } catch (err: any) {
    console.error("Error in checkBudgetThresholds:", err);
    return {
      success: false,
      message: err.message || "Failed to process budget notifications",
    };
  }
}
