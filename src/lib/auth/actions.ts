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
  let activeHubId =
    cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("activeHubId="))
      ?.split("=")[1] ?? null;

  // Validate cookie hub exists in DB
  if (activeHubId) {
    const hubExists = await db.query.hubs.findFirst({
      where: eq(hubs.id, activeHubId),
      columns: { id: true },
    });
    if (!hubExists) activeHubId = null; // reset if invalid
  }

  // Fallback: first hub where user is member or owner
  if (!activeHubId) {
    const hubMemberRow = await db.query.hubMembers.findFirst({
      where: eq(hubMembers.userId, userId),
      columns: { hubId: true },
    });

    const ownedHub = await db.query.hubs.findFirst({
      where: eq(hubs.userId, userId),
      columns: { id: true },
    });

    // Prefer member hub first, then owned hub
    activeHubId = hubMemberRow?.hubId ?? ownedHub?.id ?? null;
  }

  if (!activeHubId) throw new Error("No hub selected for this user");

  // Get role in this hub
  const hubMember = await db.query.hubMembers.findFirst({
    where: and(
      eq(hubMembers.userId, userId),
      eq(hubMembers.hubId, activeHubId),
    ),
    columns: { accessRole: true },
  });

  const userRole = hubMember?.accessRole ?? "admin"; // owner fallback to admin

  // Financial account check
  let financialAccountId: string | null = null;
  if (requireAccount) {
    const account = await db.query.financialAccounts.findFirst({
      where: eq(financialAccounts.userId, userId),
    });
    if (!account) throw new Error("Financial account not found");
    financialAccountId = account.id;
  }

  return { userId, hubId: activeHubId, userRole, financialAccountId };
}
