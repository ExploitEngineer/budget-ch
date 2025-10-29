"use server";

import { createBudgetDB } from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";
import {
  getBudgetsAmountsDB,
  getBudgetsDB,
  updateBudgetDB,
  deleteBudgetDB,
} from "@/db/queries";

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
      (acc: number, item): number => acc + (item.allocatedAmount || 0),
      0,
    );
    const totalSpent = budgetsArray.reduce(
      (acc: number, item): number => acc + (item.spentAmount || 0),
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

// GET Budgets [Action]
export async function getBudgets(): Promise<BudgetResponse<BudgetRow[]>> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const res = await getBudgetsDB(hubId);

    if (!res.success || !res.data) {
      return { success: false, message: res.message || "No budgets found" };
    }

    const budgetsArray = res.data;

    const formattedBudgets: BudgetRow[] = budgetsArray.map((b) => ({
      id: b.id,
      category: b.category || "",
      allocated: b.allocated,
      spent: b.spent,
      remaining: b.allocated - b.spent,
      progress:
        b.allocated > 0 ? Math.min((b.spent / b.allocated) * 100, 100) : 0,
    }));

    return {
      success: true,
      message: "Successfully fetched budgets table",
      data: formattedBudgets,
    };
  } catch (err: any) {
    console.error("Server action error in getBudgetsTableAction:", err);
    return {
      success: false,
      message: err.message || "Unexpected server error",
    };
  }
}

// GET Top Categories
export async function getTopCategories() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const res = await getBudgetsDB(hubId, 4);

    if (!res.success || !res.data) {
      return { success: false, message: res.message || "No budgets found" };
    }

    const topCategories = res.data.map((b) => ({
      title: b.category,
      content: `CHF ${b.spent.toLocaleString()} / ${b.allocated.toLocaleString()}`,
      value: b.value,
      remaining: b.remaining,
    }));

    return { success: true, data: topCategories };
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
