"use server";

import { auth } from "@/lib/auth/auth";
import db from "@/db/db";
import { eq } from "drizzle-orm";
import { financial_accounts, hubs } from "@/db/schema";

export async function getContext(headersObj: Headers, requireAccount = true) {
  const session = await auth.api.getSession({ headers: headersObj });

  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;

  const hub = await db.query.hubs.findFirst({
    where: eq(hubs.userId, userId),
  });

  if (!hub) throw new Error("Hub not found");

  let financialAccount = null;

  if (requireAccount) {
    financialAccount = await db.query.financial_accounts.findFirst({
      where: eq(financial_accounts.userId, userId),
    });

    if (!financialAccount) throw new Error("Financial account not found");
  }

  return {
    userId,
    hubId: hub.id,
    financialAccountId: financialAccount?.id ?? null,
  };
}
