"use server";
import { User } from "better-auth";
import { stripe } from "./stripe";
import { subscriptionLookupKeys } from "./stripe-constants";

export async function loadStripePrices() {
  try {
    const prices = await stripe.prices.list({
      // Use the lookup_keys filter for precise fetching
      lookup_keys: subscriptionLookupKeys,
      active: true,
      // Expand the product to get display names/descriptions
      // expand: ['data.product'],
    });

    return { success: true, prices };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function createStripeCustomer(email: string) {
  try {
    const customer = await stripe.customers.create(
      {
        email: email,
      },
      {
        idempotencyKey: `create-stripe-customer-${email}`,
      },
    );
    return {
      success: true,
      message: "Stripe customer created successfully",
      data: customer,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating stripe customer: ${(error as Error).message}`,
      data: null,
    };
  }
}

export async function createCheckoutSession({
  lookupKey,
  priceId,
  userId,
  customerId,
  returnUrlOnly,
}: {
  lookupKey?: string;
  priceId?: string;
  customerId: string;
  userId: string;
  returnUrlOnly?: boolean;
}) {
  try {
    if (!lookupKey && !priceId) {
      return {
        success: false,
        message: "Lookup key or price id is required",
        data: null,
      };
    }

    let priceFilter;

    if (priceId) {
      priceFilter = { price: priceId };
    } else {
      const priceResult = await getPriceByLookupKey(lookupKey!);

      if (!priceResult.success || !priceResult.data) {
        return {
          success: false,
          message:
            priceResult.message ||
            "No price found for the provided lookup key",
          data: null,
        };
      }

      priceFilter = { price: priceResult.data.id };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customerId,
      mode: "subscription",
      line_items: [{ ...priceFilter, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/me/settings`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/me/settings`,
      metadata: {
        app_user_id: userId
      }
    });
    return {
      success: true,
      message: "Checkout session created successfully",
      data: returnUrlOnly ? { url: session.url } : session,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating checkout session: ${(error as Error).message}`,
      data: null,
    };
  }
}

export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl?: string;
}) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/me/settings`,
    });

    if (!session.url) {
      return {
        success: false,
        message: "Failed to create Stripe portal session",
        data: null,
      };
    }

    return {
      success: true,
      message: "Stripe customer portal session created successfully",
      data: { url: session.url },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating portal session: ${(error as Error).message}`,
      data: null,
    };
  }
}

export async function getPriceByLookupKey(lookupKey: string) {
  try {
    const result = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });

    const price = result.data[0];

    if (!price) {
      return {
        success: false,
        message: "No price found for the provided lookup key",
        data: null,
      };
    }

    return {
      success: true,
      data: price,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error fetching price: ${(error as Error).message}`,
      data: null,
    };
  }
}
