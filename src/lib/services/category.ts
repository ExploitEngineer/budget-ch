"use server";

import { countDistinct } from "drizzle-orm";
import db from "@/db/db";
import { transactionCategories } from "@/db/schema";

export async function getCategoriesCount() {
  try {
    const result = await db
      .select({ count: countDistinct(transactionCategories.id) })
      .from(transactionCategories);

    return { success: true, data: { count: result[0].count } };
  } catch (error) {
    console.error("Error fetching category count:", error);
    return { success: false, message: "Failed to fetch category count" };
  }
}
