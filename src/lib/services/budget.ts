"use server";

import { createBudgetDB } from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";
import { getBudgetsDB, updateBudgetDB, deleteBudgetDB } from "@/db/queries";

export interface BaseBudgetFields {
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  warningPercentage: number;
  markerColor: string;
}

export interface CreateBudgetInput extends BaseBudgetFields {
  hubId: string;
  userId: string;
}

export interface UpdateBudgetInput {
  hubId: string;
  budgetId: string;
  updatedData: Partial<BaseBudgetFields>;
}

export interface BudgetRow {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  progress: number;
}

export interface BudgetResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// CREATE Budget [Action]
export async function createBudget(
  input: Omit<CreateBudgetInput, "hubId" | "userId">,
): Promise<BudgetResponse> {
  try {
    const hdrs = await headers();
    const { userId, hubId, financialAccountId } = await getContext(hdrs, true);

    if (!financialAccountId) {
      return { success: false, message: "No financial account found" };
    }

    const result = await createBudgetDB({
      ...input,
      hubId,
      userId,
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

// GET Budgets Allocated & Spent Amount [Action]
export async function getBudgetsAmounts(): Promise<
  BudgetResponse<{ totalAllocated: number; totalSpent: number }>
> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await getBudgetsDB(hubId, { allocated: true, spent: true });

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch budgets.",
      };
    }

    const budgetsArray = res.data;

    const totalAllocated = budgetsArray.reduce(
      (acc, item) => acc + (item.allocated ?? 0),
      0,
    );
    const totalSpent = budgetsArray.reduce(
      (acc, item) => acc + (item.spent ?? 0),
      0,
    );

    return {
      success: true,
      message: "Successfully got total budget amounts",
      data: { totalAllocated, totalSpent },
    };
  } catch (err: any) {
    console.error("Server action error in getBudgetsAmounts:", err);
    return {
      success: false,
      message: err.message || "Unexpected server error.",
    };
  }
}

// GET Budgets [Action]
export async function getBudgets(): Promise<BudgetResponse<BudgetRow[]>> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await getBudgetsDB(hubId, {
      id: true,
      category: true,
      allocated: true,
      spent: true,
    });

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch budgets.",
      };
    }

    const formattedBudgets: BudgetRow[] = res.data.map((b) => {
      const allocated = Number(b.allocated ?? 0);
      const spent = Number(b.spent ?? 0);

      return {
        id: b.id,
        category: b.category ?? "Uncategorized",
        allocated,
        spent,
        remaining: allocated - spent,
        progress: allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0,
      };
    });

    return {
      success: true,
      message: "Successfully fetched budgets",
      data: formattedBudgets,
    };
  } catch (err: any) {
    console.error("Server action error in getBudgets:", err);
    return {
      success: false,
      message: err.message || "Unexpected server error.",
    };
  }
}

// GET Top Categories
export async function getTopCategories(): Promise<BudgetResponse<any[]>> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await getBudgetsDB(
      hubId,
      {
        category: true,
        allocated: true,
        spent: true,
      },
      4,
    );

    if (!res.success || !res.data || res.data.length === 0) {
      return { success: false, message: res.message || "No budgets found" };
    }

    const topCategories = res.data.map((b) => {
      const allocated = Number(b.allocated ?? 0);
      const spent = Number(b.spent ?? 0);

      return {
        title: b.category ?? "Uncategorized",
        content: `CHF ${spent.toLocaleString()} / ${allocated.toLocaleString()}`,
        value: allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0,
      };
    });

    return {
      success: true,
      message: "Top Categories fetched",
      data: topCategories,
    };
  } catch (err: any) {
    console.error("Server action error in getTopCategories:", err);
    return {
      success: false,
      message: err.message || "Unexpected server error",
    };
  }
}

// UPDATE Budget [Action]
export async function updateBudget({
  budgetId,
  updatedData,
}: Omit<UpdateBudgetInput, "hubId">): Promise<BudgetResponse> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, true);

    const result = await updateBudgetDB({
      hubId,
      budgetId,
      updatedData,
    });

    return result;
  } catch (err: any) {
    console.error("Error in updateBudget action:", err);
    return {
      success: false,
      message: err.message || "Unexpected error while updating budget.",
    };
  }
}

// DELETE Budget
export async function deleteBudget(budgetId: string) {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, true);

    const result = await deleteBudgetDB({ hubId, budgetId });

    if (!result.success) {
      return {
        success: false,
        message: result.message || "Failed to delete budget.",
      };
    }

    return {
      success: true,
      message: "Budget deleted successfully.",
    };
  } catch (err: any) {
    console.error("Error in deleteBudget:", err);
    return {
      success: false,
      message: err.message || "Unexpected error while deleting budget.",
    };
  }
}
