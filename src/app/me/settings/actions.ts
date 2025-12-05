"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { createCustomerPortalSession } from "@/lib/stripe/stripe-utils";
import { updateProfileHousehold } from "@/lib/services/user";
import {
  enableTwoFactor,
  verifyTotpCode,
  disableTwoFactor,
  getTotpUri,
  viewBackupCodes,
  regenerateBackupCodes,
  getTwoFactorStatus,
} from "@/lib/services/security";

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

export async function updateProfileHouseholdAction(data: {
  name: string;
  householdSize?: string | null;
  address?: string | null;
}) {
  return await updateProfileHousehold(data);
}

// Two-Factor Authentication Actions
export async function enableTwoFactorAction(password: string) {
  return await enableTwoFactor(password);
}

export async function verifyTotpCodeAction(code: string) {
  return await verifyTotpCode(code);
}

export async function disableTwoFactorAction(password: string) {
  return await disableTwoFactor(password);
}

export async function getTotpUriAction(password: string) {
  return await getTotpUri(password);
}

export async function viewBackupCodesAction() {
  return await viewBackupCodes();
}

export async function regenerateBackupCodesAction(password: string) {
  return await regenerateBackupCodes(password);
}

export async function getTwoFactorStatusAction() {
  return await getTwoFactorStatus();
}

