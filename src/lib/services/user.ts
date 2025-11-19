"use server";

import { createStripeCustomer } from "@/lib/stripe";
import {
  getUserByEmailDB,
  completeUserOnboardingDB,
} from "@/db/queries";

export async function ensureUserOnboarding(
  email: string,
) {
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

