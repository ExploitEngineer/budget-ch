"use server";

import { auth } from "@/lib/auth/auth";
import db from "@/db/db";
import { eq, and } from "drizzle-orm";
import { hubs, hubMembers, financialAccounts } from "@/db/schema";

export async function getContext(headersObj: Headers, requireAccount = true) {
  const session = await auth.api.getSession({ headers: headersObj });
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;

  const cookieHeader = headersObj.get("cookie");
  const activeHubId =
    cookieHeader
      ?.split("; ")
      .find((c: string): boolean => c.startsWith("activeHubId="))
      ?.split("=")[1] ?? null;

  if (!activeHubId) throw new Error("No hub selected");

  // Fetch membership info
  const member = await db.query.hubMembers.findFirst({
    where: and(
      eq(hubMembers.hubId, activeHubId),
      eq(hubMembers.userId, userId),
    ),
  });

  if (!member) throw new Error("Access denied to this hub");

  const hub = await db.query.hubs.findFirst({
    where: eq(hubs.id, activeHubId),
  });
  if (!hub) throw new Error("Hub not found");

  // Fetch financial account
  let financialAccount = null;
  if (requireAccount) {
    financialAccount = await db.query.financialAccounts.findFirst({
      where: eq(financialAccounts.hubId, activeHubId),
    });

    if (!financialAccount) throw new Error("Financial account not found");
  }

  return {
    userId,
    hubId: hub.id,
    role: member.accessRole,
    isOwner: member.isOwner,
    financialAccountId: financialAccount?.id ?? null,
  };
}
