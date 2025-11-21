"use server";

import { createStripeCustomer } from "@/lib/stripe";
import {
  getUserByEmailDB,
  completeUserOnboardingDB,
  getUserEmailDB,
} from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";

export async function ensureUserOnboarding(email: string) {
  try {
    // Get user by email
    const user = await getUserByEmailDB(email);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeResult = await createStripeCustomer(email);
      if (!stripeResult.success || !stripeResult.data?.id) {
        return {
          success: false,
          message: `Failed to create Stripe customer: ${stripeResult.message}`,
        };
      }
      stripeCustomerId = stripeResult.data.id;
    }

    // Complete onboarding (DB operations only)
    const onboardingResult = await completeUserOnboardingDB({
      userId: user.id,
      userName: user.name,
      stripeCustomerId,
    });

    return onboardingResult;
  } catch (err) {
    console.error("Error creating user onboarding: ", err);
    return {
      success: false,
      message: `Failed to create user onboarding: ${(err as Error).message}`,
    };
  }
}

// GET user email
export async function getUserEmail() {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    const res = await getUserEmailDB(userId);

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Error fetching user email",
      };
    }

    return { success: true, data: res.data };
  } catch (err: any) {
    console.error("Error fetching user email: ", err);
    return {
      success: false,
      message: `Failed to fetch user email: ${err.message}`,
    };
  }
}
