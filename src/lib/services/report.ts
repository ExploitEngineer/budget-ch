"use server";

import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import {
  getTransactionCategoriesWithAmountsDB,
  getMonthlyReportDB,
  getCategoriesByExpensesDB,
} from "@/db/queries";

// GET Transaction & Budget Categories with Amount [Action]
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

// GET Monthly Report [Action]
export async function getMonthlyReportAction(hubIdArg?: string) {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await getMonthlyReportDB(hubId);
    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch monthly reports",
      };
    }

    return {
      success: true,
      message: "Fetched monthly reports data successfully.",
      data: res.data,
    };
  } catch (err: any) {
    console.error("Server Action Error (getMonthlyReportAction)");
    return {
      success: false,
      message: err.message || "Unexpected server error.",
    };
  }
}

// GET Categories by Expenses
export async function getCategoriesByExpenses() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) throw new Error("No hubId");

    const data = await getCategoriesByExpensesDB(hubId);

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to fetch expense categories progress",
    };
  }
}
