"use server";

import { createBudgetDB } from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";
import { getBudgetsAmountsDB } from "@/db/queries";

export interface BudgetsAmountsResponse {
  success: boolean;
  message?: string;
  data?: {
    totalAllocated: number;
    totalSpent: number;
  };
}

export async function createBudget({
  categoryName,
  allocatedAmount,
  spentAmount,
  warningPercentage,
  markerColor,
}: {
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  warningPercentage: number;
  markerColor: string;
}) {
  try {
    const hdrs = await headers();
    const { userId, hubId, financialAccountId } = await getContext(hdrs, true);

    if (!financialAccountId) {
      return { success: false, message: "No financial account found" };
    }

    const result = await createBudgetDB({
      hubId,
      userId,
      categoryName,
      allocatedAmount,
      spentAmount,
      warningPercentage,
      markerColor,
    });

    return result;
  } catch (err: any) {
    console.error("Server action error:", err);
    return {
      success: false,
      message: err.message || "Unexpected server error",
    };
  }
}

export async function getBudgetsAmounts(): Promise<BudgetsAmountsResponse> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return {
        success: false,
        message: "Missing hubId parameter.",
      };
    }

    const data = await getBudgetsAmountsDB(hubId);

    if (!data.success) {
      return {
        success: false,
        message: data.message || "Failed to fetch budget amounts.",
      };
    }

    const budgetsArray = data.data ?? [];

    const totalAllocated = budgetsArray.reduce(
      (acc, item) => acc + (item.allocatedAmount || 0),
      0,
    );
    const totalSpent = budgetsArray.reduce(
      (acc, item) => acc + (item.spentAmount || 0),
      0,
    );

    return {
      success: true,
      message: "Successfully got total budget amounts",
      data: {
        totalAllocated,
        totalSpent,
      },
    };
  } catch (err: any) {
    console.error("Server action error in getBudgetsAmounts:", err);
    return {
      success: false,
      message: err?.message || "Unexpected server error.",
    };
  }
}
