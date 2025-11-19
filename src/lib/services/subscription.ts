import {
  FAMILY_TIER_MONTHLY_LOOKUP_KEY,
  FAMILY_TIER_YEARLY_LOOKUP_KEY,
  INDIVIDUAL_TIER_MONTHLY_LOOKUP_KEY,
  INDIVIDUAL_TIER_YEARLY_LOOKUP_KEY,
} from "@/lib/stripe";
import {
  createSubscriptionRecord,
  getSubscriptionByStripeSubscriptionId,
  getSubscriptionByUserId,
  updateSubscriptionRecord,
} from "@/db/queries";
import type { SubscriptionType } from "@/db/schema";
import {
  subscriptionStatusValues,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/db/schema";
import type Stripe from "stripe";

const lookupKeyPlanMap: Record<string, SubscriptionPlan> = {
  [INDIVIDUAL_TIER_MONTHLY_LOOKUP_KEY]: "individual",
  [INDIVIDUAL_TIER_YEARLY_LOOKUP_KEY]: "individual",
  [FAMILY_TIER_MONTHLY_LOOKUP_KEY]: "family",
  [FAMILY_TIER_YEARLY_LOOKUP_KEY]: "family",
};

type StripeSubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
};

const periodFieldFromSubscription = (
  subscription: StripeSubscriptionWithPeriod,
): { start: number; end: number } | null => {
  const start =
    subscription.current_period_start ??
    subscription.items?.data?.[0]?.current_period_start;
  const end =
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end;

  if (typeof start !== "number" || typeof end !== "number") {
    return null;
  }

  return { start, end };
};

const resolvePlanFromLookupKey = (
  lookupKey?: string | null,
): SubscriptionPlan | null => {
  if (!lookupKey) {
    return null;
  }

  if (lookupKeyPlanMap[lookupKey]) {
    return lookupKeyPlanMap[lookupKey];
  }

  const normalized = lookupKey.toLowerCase();
  if (normalized.includes("family")) {
    return "family";
  }

  if (normalized.includes("individual")) {
    return "individual";
  }

  return null;
};

const normalizeStatus = (
  status?: string | null,
): SubscriptionStatus | null => {
  if (!status) {
    return null;
  }

  if (subscriptionStatusValues.includes(status as SubscriptionStatus)) {
    return status as SubscriptionStatus;
  }

  return null;
};

export interface StripeSubscriptionPayload {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  subscriptionPlan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt: Date | null;
  cancelAtPeriodEnd: boolean;
}

export const buildSubscriptionPayload = (
  stripeSubscription: Stripe.Subscription,
): StripeSubscriptionPayload | null => {
  const item = stripeSubscription.items?.data?.[0];
  const price = item?.price;

  if (!price?.id) {
    return null;
  }

  const plan = resolvePlanFromLookupKey(price.lookup_key ?? null);
  if (!plan) {
    return null;
  }

  const status = normalizeStatus(stripeSubscription.status);
  if (!status) {
    return null;
  }

  const period = periodFieldFromSubscription(stripeSubscription);
  if (!period) {
    return null;
  }

  let customerId: string | undefined;
  if (typeof stripeSubscription.customer === "string") {
    customerId = stripeSubscription.customer;
  } else {
    customerId = stripeSubscription.customer?.id ?? undefined;
  }

  if (!customerId) {
    return null;
  }

  return {
    stripeCustomerId: customerId,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: price.id,
    subscriptionPlan: plan,
    status,
    currentPeriodStart: new Date(period.start * 1000),
    currentPeriodEnd: new Date(period.end * 1000),
    canceledAt: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000)
      : null,
    cancelAtPeriodEnd: !!stripeSubscription.cancel_at_period_end,
  };
};

export async function syncStripeSubscription(
  userId: string,
  stripeSubscription: Stripe.Subscription,
): Promise<SubscriptionType> {
  const payload = buildSubscriptionPayload(stripeSubscription);

  if (!payload) {
    throw new Error("Could not build subscription payload from Stripe data");
  }

  const existingSubscription = await getSubscriptionByUserId(userId);

  if (existingSubscription) {
    const updated = await updateSubscriptionRecord(existingSubscription.id, {
      ...payload,
      canceledAt: payload.canceledAt,
    });

    if (!updated) {
      throw new Error("Failed to update existing subscription record");
    }

    return updated;
  }

  const created = await createSubscriptionRecord({
    userId,
    ...payload,
  });

  return created;
}

type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

export async function refreshSubscriptionPeriodFromInvoice(
  invoice: StripeInvoiceWithSubscription,
): Promise<SubscriptionType | null> {
  const stripeSubscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;

  if (!stripeSubscriptionId) {
    return null;
  }

  const period = invoice.lines?.data?.[0]?.period;
  if (
    !period ||
    typeof period.start !== "number" ||
    typeof period.end !== "number"
  ) {
    return null;
  }

  const subscription = await getSubscriptionByStripeSubscriptionId(
    stripeSubscriptionId,
  );

  if (!subscription) {
    return null;
  }

  const updated = await updateSubscriptionRecord(subscription.id, {
    currentPeriodStart: new Date(period.start * 1000),
    currentPeriodEnd: new Date(period.end * 1000),
  });

  return updated;
}

