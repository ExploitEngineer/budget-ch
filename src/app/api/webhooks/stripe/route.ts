import { NextRequest } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe/stripe";
import {
  deleteSubscriptionRecord,
  getSubscriptionByStripeSubscriptionId,
  getUserByStripeCustomerId,
} from "@/db/queries";
import {
  refreshSubscriptionPeriodFromInvoice,
  syncStripeSubscription,
} from "@/lib/services/subscription";

interface HandlerResult {
  status: number;
  message: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("Stripe webhook secret is not configured", {
      status: 500,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe/webhook] Webhook verification failed", error);
    return new Response("Webhook error", { status: 400 });
  }

  let result: HandlerResult | undefined;

  switch (event.type) {
    case "invoice.created": {
      const invoice = event.data.object as Stripe.Invoice;
      result = await handleInvoiceCreated(invoice);
      console.log(
        `[stripe/webhook] Invoice created:\n${JSON.stringify(result, null, 2)}`,
      );
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      result = await handleCheckoutSessionCompleted(session);
      console.log(
        `[stripe/webhook:${event.type}] Checkout session completed:\n${JSON.stringify(result, null, 2)}`,
      );
      break;
    }
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      result = await handleSubscriptionLifecycleEvent(subscription);
      console.log(
        `[stripe/webhook:${event.type}] Subscription created:\n${JSON.stringify(result, null, 2)}`,
      );
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      result = await handleSubscriptionLifecycleEvent(subscription);
      console.log(
        `[stripe/webhook:${event.type}] Subscription updated:\n${JSON.stringify(result, null, 2)}`,
      );
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      result = await handleSubscriptionDeleted(subscription);
      console.log(
        `[stripe/webhook:${event.type}] Subscription deleted:\n${JSON.stringify(result, null, 2)}`,
      );
      break;
    }
    default:
      console.log(`[stripe/webhook:${event.type}] Unhandled event type`);
      return new Response("Event type not handled", { status: 200 });
  }

  if (result?.error) {
    return new Response(result.error, { status: result.status });
  }

  return new Response(result?.message ?? "OK", {
    status: result?.status ?? 200,
  });
}

const extractCustomerIdFromSubscription = (
  subscription: Stripe.Subscription,
): string | null => {
  if (typeof subscription.customer === "string") {
    return subscription.customer;
  }

  return subscription.customer?.id ?? null;
};

async function handleSubscriptionLifecycleEvent(
  stripeSubscription: Stripe.Subscription,
): Promise<HandlerResult> {
  const customerId = extractCustomerIdFromSubscription(stripeSubscription);

  if (!customerId) {
    console.error("[stripe/webhook] Subscription event missing customer ID");
    return {
      status: 400,
      message: "Missing customer identifier",
      error: "Missing customer identifier",
    };
  }

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error("[stripe/webhook] User not found for customer", customerId);
    return {
      status: 404,
      message: "User not found",
      error: "User not found",
    };
  }

  try {
    await syncStripeSubscription(user.id, stripeSubscription);
    return {
      status: 200,
      message: "Processed subscription event",
    };
  } catch (error) {
    console.error("[stripe/webhook] Failed to sync stripe subscription", error);
    return {
      status: 500,
      message: "Failed to sync subscription record",
      error: (error as Error).message,
    };
  }
}

async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription,
): Promise<HandlerResult> {
  const customerId = extractCustomerIdFromSubscription(stripeSubscription);

  if (!customerId) {
    console.error("[stripe/webhook] Subscription deletion missing customer ID");
    return {
      status: 400,
      message: "Missing customer identifier",
      error: "Missing customer identifier",
    };
  }

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error("[stripe/webhook] User not found for customer", customerId);
    return {
      status: 404,
      message: "User not found",
      error: "User not found",
    };
  }

  const subscription = await getSubscriptionByStripeSubscriptionId(
    stripeSubscription.id,
  );

  if (!subscription) {
    console.log(
      "[stripe/webhook] Subscription deleted but no record exists, skipping",
    );
    return {
      status: 200,
      message: "No subscription record to delete",
    };
  }

  try {
    await deleteSubscriptionRecord(subscription.id);
    return {
      status: 200,
      message: "Deleted subscription record",
    };
  } catch (error) {
    console.error(
      "[stripe/webhook] Failed to delete subscription record",
      error,
    );
    return {
      status: 500,
      message: "Failed to delete subscription record",
      error: (error as Error).message,
    };
  }
}

async function handleInvoiceCreated(
  invoice: Stripe.Invoice,
): Promise<HandlerResult> {
  try {
    const updated = await refreshSubscriptionPeriodFromInvoice(invoice);

    if (!updated) {
      return {
        status: 200,
        message: "Invoice processed with no subscription updates required",
      };
    }

    return {
      status: 200,
      message: "Subscription period refreshed from invoice",
    };
  } catch (error) {
    console.error("[stripe/webhook] Failed to refresh invoice period", error);
    return {
      status: 500,
      message: "Failed to refresh invoice period",
      error: (error as Error).message,
    };
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<HandlerResult> {
  const appUserId = session.metadata?.app_user_id;

  return {
    status: 200,
    message: appUserId
      ? `Checkout session completed for ${appUserId}`
      : "Checkout session completed",
  };
}
