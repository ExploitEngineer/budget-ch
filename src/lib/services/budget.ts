"use server";

import { createBudgetDB } from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";
import { getBudgetsDB, updateBudgetDB, deleteBudgetDB } from "@/db/queries";
import { requireAdminRole } from "@/lib/auth/permissions";
import type {
  BudgetWithCategory,
  BudgetAmounts,
} from "@/lib/types/domain-types";

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
    const { userId, userRole, hubId, financialAccountId } = await getContext(
      hdrs,
      true,
    );
    requireAdminRole(userRole);

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
  BudgetResponse<BudgetAmounts>
> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await getBudgetsDB(hubId);

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch budgets.",
      };
    }

    const budgetsArray = res.data;

    const totalAllocated = budgetsArray.reduce(
      (acc, item) => acc + Number(item.allocatedAmount ?? 0),
      0,
    );
    const totalSpent = budgetsArray.reduce(
      (acc, item) => acc + Number(item.spentAmount ?? 0),
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

// GET Budgets [Action] - Returns canonical domain type BudgetWithCategory[]
export async function getBudgets(): Promise<
  BudgetResponse<BudgetWithCategory[]>
> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await getBudgetsDB(hubId);

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch budgets.",
      };
    }

    // Normalize DB output (ensure numbers are properly typed)
    const budgets: BudgetWithCategory[] = res.data.map((b) => ({
      id: b.id,
      hubId: b.hubId,
      userId: b.userId,
      transactionCategoryId: b.transactionCategoryId,
      allocatedAmount: Number(b.allocatedAmount ?? 0),
      spentAmount: Number(b.spentAmount ?? 0),
      warningPercentage: b.warningPercentage,
      markerColor: b.markerColor,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      categoryName: b.categoryName,
    }));

    return {
      success: true,
      message: "Successfully fetched budgets",
      data: budgets,
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

    const res = await getBudgetsDB(hubId, 4);

    if (!res.success || !res.data) {
      return { success: false, message: res.message || "No budgets found" };
    }

    const topCategories = res.data.map((b) => {
      const allocated = Number(b.allocatedAmount ?? 0);
      const spent = Number(b.spentAmount ?? 0);

      return {
        title: b.categoryName ?? "Uncategorized",
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
    const { hubId, userRole } = await getContext(hdrs, true);

    requireAdminRole(userRole);

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
    const { hubId, userRole } = await getContext(hdrs, true);

    requireAdminRole(userRole);

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
