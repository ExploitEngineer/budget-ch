"use server";

import type { savingGoalArgs } from "@/db/queries";
import { createSavingGoalDB, getSavingGoalsDB } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import type { SavingGoal } from "@/db/queries";

export interface SavingGoalsSummary {
  totalTarget: number;
  totalSaved: number;
  remainingToSave: number;
  totalGoals: number;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

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
export async function getSavingGoalsSummary(): Promise<
  ActionResponse<SavingGoalsSummary>
> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Hub not found" };
    }
    const res = await getSavingGoalsDB(hubId, { summaryOnly: true });

    if (!res.success || !res.data) {
      return { success: false, message: res.message || "No data found" };
    }

    return {
      success: true,
      data: res.data as SavingGoalsSummary,
    };
  } catch (err: any) {
    console.error("Error fetching saving goals summary:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch saving goals summary",
    };
  }
}

// READ Saving Goals [Action]
export async function getSavingGoals(
  limit?: number,
): Promise<ActionResponse<SavingGoal[]>> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Hub not found" };
    }

    const result = await getSavingGoalsDB(hubId, { limit });

    if (!result.success) {
      return {
        success: false,
        message: result.message ?? "Failed to fetch saving goals",
      };
    }

    return { success: true, data: result.data as SavingGoal[] };
  } catch (err: any) {
    console.error("Server action error (getSavingGoals):", err);
    return {
      success: false,
      message: err.message || "Unexpected server error",
    };
  }
}
