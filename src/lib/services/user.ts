"use server";

import { createStripeCustomer } from "@/lib/stripe";
import {
  getUserByEmailDB,
  completeUserOnboardingDB,
  getUserEmailDB,
  getUserSettingsDB,
  upsertUserSettingsDB,
  updateUser,
  updateUserNotificationsEnabledDB,
  updateUserReportFrequencyDB,
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

// GET user settings
export async function getUserSettings() {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    const res = await getUserSettingsDB(userId);

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Error fetching user settings",
      };
    }

    return { success: true, data: res.data };
  } catch (err: any) {
    console.error("Error fetching user settings: ", err);
    return {
      success: false,
      message: `Failed to fetch user settings: ${err.message}`,
    };
  }
}

// UPDATE profile and household settings
export async function updateProfileHousehold(data: {
  name: string;
  householdSize?: string | null;
  address?: string | null;
}) {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    // Update user name
    const userUpdateResult = await updateUser(userId, { name: data.name });

    if (!userUpdateResult.success) {
      return {
        success: false,
        message: userUpdateResult.message || "Error updating user name",
      };
    }

    // Update or create user settings
    const settingsUpdateResult = await upsertUserSettingsDB(userId, {
      householdSize: data.householdSize ?? null,
      address: data.address ?? null,
    });

    if (!settingsUpdateResult.success) {
      return {
        success: false,
        message: settingsUpdateResult.message || "Error updating user settings",
      };
    }

    return {
      success: true,
      message: "Profile and household settings updated successfully",
    };
  } catch (err: any) {
    console.error("Error updating profile and household: ", err);
    return {
      success: false,
      message: `Failed to update profile and household: ${err.message}`,
    };
  }
}

// UPDATE user notifications enabled
export async function updateUserNotificationsEnabled(enabled: boolean) {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    const res = await updateUserNotificationsEnabledDB(userId, enabled);

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Error updating notification preference",
      };
    }

    return { success: true, message: "Notification preference updated successfully" };
  } catch (err: any) {
    console.error("Error updating user notifications enabled: ", err);
    return {
      success: false,
      message: `Failed to update notification preference: ${err.message}`,
    };
  }
}

// UPDATE user report frequency
export async function updateUserReportFrequency(frequency: string) {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    const res = await updateUserReportFrequencyDB(userId, frequency);

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Error updating report preference",
      };
    }

    return { success: true, message: "Report preference updated successfully" };
  } catch (err: any) {
    console.error("Error updating user report frequency: ", err);
    return {
      success: false,
      message: `Failed to update report preference: ${err.message}`,
    };
  }
}
