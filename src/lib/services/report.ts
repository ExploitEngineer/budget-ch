"use server";

import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import {
  getTransactionCategoriesWithAmountsDB,
  getMonthlyReportDB,
  getCategoriesByExpensesDB,
  getReportSummaryDB,
} from "@/db/queries";

// GET Transaction & Budget Categories with Amount [Action]
export async function getDetailedCategories(
  hubIdArg?: string,
  from?: string,
  to?: string,
) {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const startDate = from ? new Date(from) : undefined;
    const endDate = to ? new Date(to) : undefined;

    const res = await getTransactionCategoriesWithAmountsDB(
      hubId,
      startDate,
      endDate,
    );
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
export async function getMonthlyReportAction(
  hubIdArg?: string,
  from?: string,
  to?: string,
  groupBy?: string,
) {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const startDate = from ? new Date(from) : undefined;
    const endDate = to ? new Date(to) : undefined;

    const res = await getMonthlyReportDB(hubId, startDate, endDate, groupBy as any);
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
export async function getCategoriesByExpenses(
  hubIdArg?: string,
  from?: string,
  to?: string,
) {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) throw new Error("No hubId");

    const startDate = from ? new Date(from) : undefined;
    const endDate = to ? new Date(to) : undefined;

    return await getCategoriesByExpensesDB(hubId, startDate, endDate);
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to fetch expense categories progress",
    };
  }
}

// GET Report Summary [Action]
export async function getReportSummaryAction(
  hubIdArg?: string,
  from?: string,
  to?: string,
) {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const startDate = from ? new Date(from) : undefined;
    const endDate = to ? new Date(to) : undefined;

    const res = await getReportSummaryDB(hubId, startDate, endDate);
    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch report summary",
      };
    }

    return {
      success: true,
      message: "Fetched report summary successfully.",
      data: res.data,
    };
  } catch (err: any) {
    console.error("Server Action Error (getReportSummaryAction)");
    return {
      success: false,
      message: err.message || "Unexpected server error.",
    };
  }
}
