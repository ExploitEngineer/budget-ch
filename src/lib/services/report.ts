"use server";

import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import { getTransactionCategoriesWithAmountsDB } from "@/db/queries";

export async function getDetailedCategories() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await getTransactionCategoriesWithAmountsDB(hubId);
    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch category data.",
      };
    }

    return {
      success: true,
      message: "Fetched detailed category data successfully.",
      data: res.data,
    };
  } catch (err: any) {
    console.error("Server Action Error (getDetailedCategories):", err);
    return {
      success: false,
      message: err.message || "Unexpected server error.",
    };
  }
}
