"use server";

import { auth } from "@/lib/auth/auth";
import {
  getHubByIdDB,
  getFirstHubMemberDB,
  getOwnedHubDB,
  getHubMemberRoleDB,
  getFinancialAccountDB,
  getSubscriptionByUserId,
} from "@/db/queries";
import { UserType } from "@/db/schema";

export async function getContext(headersObj: Headers, requireAccount = false) {
  const session = await auth.api.getSession({ headers: headersObj });
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;
  const user = session.user as UserType;

  const cookieHeader = headersObj.get("cookie");
  let activeHubId =
    cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("activeHubId="))
      ?.split("=")[1] ?? null;

  // Validate cookie hub exists in DB
  if (activeHubId) {
    const hubExists = await getHubByIdDB(activeHubId);
    if (!hubExists) activeHubId = null; // reset if invalid
  }

  // Fallback: first hub where user is member or owner
  if (!activeHubId) {
    const hubMemberRow = await getFirstHubMemberDB(userId);
    const ownedHub = await getOwnedHubDB(userId);

    // Prefer member hub first, then owned hub
    activeHubId = hubMemberRow?.hubId ?? ownedHub?.id ?? null;
  }

  if (!activeHubId) throw new Error("No hub selected for this user");

  // Get role in this hub
  const hubMember = await getHubMemberRoleDB(userId, activeHubId);

  const userRole = hubMember?.accessRole ?? "admin"; // owner fallback to admin

  // Financial account check
  let financialAccountId: string | null = null;
  if (requireAccount) {
    const account = await getFinancialAccountDB(userId);
    if (!account) throw new Error("Financial account not found");
    financialAccountId = account.id;
  }

  const subscription = await getSubscriptionByUserId(userId);

  return { userId, hubId: activeHubId, userRole, financialAccountId, user, subscription: subscription ?? null };
}
