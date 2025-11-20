"use server";

import { getContext } from "../auth/actions";
import { headers } from "next/headers";
import { getSubscriptionByUserId } from "@/db/queries";

export type Feature = "reports" | "collaborative";

export interface FeatureAccessResult {
  canAccess: boolean;
  subscriptionPlan: string | null;
}

export async function canAccessFeature(
  feature: Feature,
): Promise<FeatureAccessResult> {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    const subscription = await getSubscriptionByUserId(userId);
    const subscriptionPlan = subscription?.subscriptionPlan ?? null;

    if (!subscription) {
      const restrictedFeatures: Feature[] = ["reports", "collaborative"];
      if (restrictedFeatures.includes(feature)) {
        return { canAccess: false, subscriptionPlan };
      }
    }

    if (subscriptionPlan === "individual" && feature === "collaborative") {
      return { canAccess: false, subscriptionPlan };
    }

    return { canAccess: true, subscriptionPlan };
  } catch (err: any) {
    console.error(err.message);
    return { canAccess: false, subscriptionPlan: null };
  }
}
