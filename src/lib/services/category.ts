"use server";

import { countDistinct, eq } from "drizzle-orm";
import db from "@/db/db";
import { transactionCategories } from "@/db/schema";
import {
  getTransactionCategoriesDB,
  getHubMemberRoleDB,
  getOwnedHubDB,
} from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";

export async function getCategoriesCount(hubId: string) {
  try {
    const result = await db
      .select({ count: countDistinct(transactionCategories.id) })
      .from(transactionCategories)
      .where(eq(transactionCategories.hubId, hubId));

    return { success: true, data: { count: result[0].count } };
  } catch (error) {
    console.error("Error fetching category count:", error);
    return { success: false, message: "Failed to fetch category count" };
  }
}

// GET All Transaction Categories for a Hub
export async function getCategories(hubId: string) {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    // Verify user has access to this hub
    const hubMember = await getHubMemberRoleDB(userId, hubId);
    const ownedHub = await getOwnedHubDB(userId);

    if (!hubMember && ownedHub?.id !== hubId) {
      return {
        success: false,
        message: "You don't have access to this hub",
      };
    }

    const res = await getTransactionCategoriesDB(hubId);
    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch categories.",
      };
    }

    return {
      success: true,
      message: "Fetched categories successfully.",
      data: res.data,
    };
  } catch (err: any) {
    console.error("Server Action Error (getCategories):", err);
    return {
      success: false,
      message: err.message || "Unexpected server error.",
    };
  }
}
