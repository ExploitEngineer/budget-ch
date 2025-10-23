"use server";

import type { savingGoalArgs } from "@/db/queries";
import { createSavingGoalDB } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";

export async function createSavingGoal({
  name,
  goalAmount,
  amountSaved,
  monthlyAllocation,
  accountType,
}: Omit<savingGoalArgs, "financialAccountId" | "hubId" | "userId">) {
  try {
    const hdrs = await headers();
    const { userId, hubId, financialAccountId } = await getContext(hdrs, true);

    if (!financialAccountId) {
      return { success: false, message: "No financial account found" };
    }

    const result = await createSavingGoalDB({
      hubId,
      userId,
      name,
      goalAmount,
      amountSaved,
      monthlyAllocation,
      accountType,
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
