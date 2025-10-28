"use server";

import type { savingGoalArgs } from "@/db/queries";
import { createSavingGoalDB, getSavingGoalsSummaryDB, getLatestSavingGoalsDB } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";

// CREATE Saving Goal [Action]
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

// READ Saving Goals Summary [Action]
export async function getSavingGoalsSummary() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, true);

    if (!hubId) {
      return { success: false, message: "Hub not found" };
    }

    const result = await getSavingGoalsSummaryDB(hubId);
    return result;
  } catch (err: any) {
    console.error("Server action error:", err);
    return {
      success: false,
      message: err.message || "Unexpected server error",
    };
  }
}

// READ Latest Saving Goals
export async function getLatestSavingGoals() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, true);

    if (!hubId) {
      return { success: false, message: "Hub not found" };
    }

    const result = await getLatestSavingGoalsDB(hubId);
    return result;
  } catch (err: any) {
    console.error("Server action error:", err);
    return {
      success: false,
      message: err.message || "Unexpected server error",
    };
  }
}
