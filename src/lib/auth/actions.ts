"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { verifyTotpForOAuth, verifyBackupCodeForOAuth } from "@/lib/services/security";
import {
  getHubByIdDB,
  getFirstHubMemberDB,
  getOwnedHubDB,
  getHubMemberRoleDB,
  getFinancialAccountDB,
  getSubscriptionByUserId,
} from "@/db/queries";
import { UserType } from "@/db/schema";
import { getDefaultHubId } from "@/lib/services/hub-logic";

export async function getContext(headersObj: Headers, requireAccount = false) {
  const session = await auth.api.getSession({ headers: headersObj });
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;
  const user = session.user as UserType;

  // Read hub ID from cookie (which middleware syncs from URL query param)
  const cookieHeader = headersObj.get("cookie");
  let activeHubId =
    cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("activeHubId="))
      ?.split("=")[1] ?? null;

  // Validate cookie hub exists in DB and user has access
  if (activeHubId) {
    const hubExists = await getHubByIdDB(activeHubId);
    if (!hubExists) {
      activeHubId = null; // reset if invalid
    } else {
      // Verify user has access to this hub
      const hubMember = await getHubMemberRoleDB(userId, activeHubId);
      const ownedHub = await getOwnedHubDB(userId);

      if (!hubMember && ownedHub?.id !== activeHubId) {
        // User doesn't have access, reset to default
        activeHubId = null;
      }
    }
  }

  // Fallback: get user's default hub (owned hub or first member hub)
  if (!activeHubId) {
    activeHubId = await getDefaultHubId(userId);
  }

  if (!activeHubId) throw new Error("No hub selected for this user");

  // Get role in this hub
  const hubMember = await getHubMemberRoleDB(userId, activeHubId);

  const userRole = hubMember?.accessRole ?? "admin"; // owner fallback to admin

  // Financial account check
  let financialAccountId: string | null = null;
  if (requireAccount) {
    const account = await getFinancialAccountDB(userId, activeHubId);
    if (!account) throw new Error("No financial account found. Please create a financial account in the settings to continue.");
    financialAccountId = account.id;
  }

  const subscription = await getSubscriptionByUserId(userId);

  return { userId, hubId: activeHubId, userRole, financialAccountId, user, subscription: subscription ?? null };
}

export async function clearPending2fa() {
  const cookieStore = await cookies();
  cookieStore.delete("pending_2fa");
}

export async function verifyTotpForOAuthAction(code: string) {
  const result = await verifyTotpForOAuth(code);
  if (result.success) {
    const cookieStore = await cookies();
    cookieStore.delete("pending_2fa");
  }
  return result;
}

export async function verifyBackupCodeForOAuthAction(code: string) {
  const result = await verifyBackupCodeForOAuth(code);
  if (result.success) {
    const cookieStore = await cookies();
    cookieStore.delete("pending_2fa");
  }
  return result;
}
