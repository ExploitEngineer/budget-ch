import type { SubscriptionPlan, SubscriptionStatus } from "@/db/schema";

export interface SubscriptionDetails {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
}

