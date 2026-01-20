"use server";

import { stripe } from "@/lib/stripe/stripe";
import {
  INDIVIDUAL_TIER_MONTHLY_LOOKUP_KEY,
  FAMILY_TIER_MONTHLY_LOOKUP_KEY,
} from "@/lib/stripe/stripe-constants";
import { getPriceByLookupKey, createStripeCustomer } from "@/lib/stripe/stripe-utils";
import { syncStripeSubscription } from "./subscription";
import { createAuditLogDB, generateReferenceId } from "@/db/admin-queries";
import db from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface GrantSubscriptionParams {
  userId: string;
  plan: "individual" | "family";
  months: number;
  adminId: string;
}

export interface GrantSubscriptionResult {
  success: boolean;
  message: string;
  subscriptionId?: string;
}

/**
 * Grants a subscription to a user without requiring payment.
 * Creates a Stripe subscription with a trial period that matches the granted duration.
 */
export async function grantSubscription({
  userId,
  plan,
  months,
  adminId,
}: GrantSubscriptionParams): Promise<GrantSubscriptionResult> {
  try {
    // 1. Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // 2. Ensure user has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customerResult = await createStripeCustomer(user.email);
      if (!customerResult.success || !customerResult.data) {
        return {
          success: false,
          message: `Failed to create Stripe customer: ${customerResult.message}`,
        };
      }
      stripeCustomerId = customerResult.data.id;

      // Update user with Stripe customer ID
      await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, userId));
    }

    // 3. Get price ID for the plan
    const lookupKey =
      plan === "individual"
        ? INDIVIDUAL_TIER_MONTHLY_LOOKUP_KEY
        : FAMILY_TIER_MONTHLY_LOOKUP_KEY;

    const priceResult = await getPriceByLookupKey(lookupKey);

    if (!priceResult.success || !priceResult.data) {
      return {
        success: false,
        message: `Failed to get price: ${priceResult.message}`,
      };
    }

    const priceId = priceResult.data.id;

    // 4. Calculate trial end and cancel at timestamps
    const now = Math.floor(Date.now() / 1000);
    const durationSeconds = months * 30 * 24 * 60 * 60;
    const endTimestamp = now + durationSeconds;

    // 5. Create Stripe subscription
    // Using trial_end to give the user free access for the specified duration
    // Using cancel_at to automatically end the subscription after the period
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_end: endTimestamp,
      cancel_at: endTimestamp,
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "off",
      },
      metadata: {
        granted_by: "admin",
        admin_id: adminId,
        granted_months: months.toString(),
        grant_reason: "admin_invitation",
      },
    });

    // 6. Sync subscription to local database
    await syncStripeSubscription(userId, subscription);

    // 7. Create audit log
    const reference = generateReferenceId();
    await createAuditLogDB({
      action: "subscription_granted",
      affectedUserId: userId,
      adminId,
      reference,
      metadata: {
        plan,
        months,
        stripeSubscriptionId: subscription.id,
        endsAt: new Date(endTimestamp * 1000).toISOString(),
      },
    });

    return {
      success: true,
      message: `Successfully granted ${plan} subscription for ${months} months`,
      subscriptionId: subscription.id,
    };
  } catch (err) {
    console.error("Error granting subscription:", err);
    return {
      success: false,
      message: `Failed to grant subscription: ${(err as Error).message}`,
    };
  }
}
