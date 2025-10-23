"use server";

import { createBudgetDB } from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";

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
