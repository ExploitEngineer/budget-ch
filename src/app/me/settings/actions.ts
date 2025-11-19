"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { createCustomerPortalSession } from "@/lib/stripe/stripe-utils";

export async function createStripePortalSession() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });

  const stripeCustomerId = session?.user?.stripeCustomerId;
  if (!stripeCustomerId) {
    return {
      success: false,
      message: "Stripe customer is not configured for this account",
      data: null,
    };
  }

  return createCustomerPortalSession({
    customerId: stripeCustomerId,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/me/settings`,
  });
}

