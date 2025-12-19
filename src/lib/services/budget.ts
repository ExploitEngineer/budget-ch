"use server";

import { createBudgetDB } from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";
import {
  getBudgetsDB,
  updateBudgetDB,
  deleteBudgetDB,
  getBudgetsByMonthDB,
  upsertBudgetInstanceDB,
  checkBudgetInstancesExistDB,
  createBudgetInstancesDB,
  getHubSettingsDB,
  getExistingBudgetInstancesDB,
} from "@/db/queries";
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
    const { userId, userRole, hubId } = await getContext(
      hdrs,
      false,
    );
    requireAdminRole(userRole);


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
// GET Budgets Allocated & Spent Amount [Action]
export async function getBudgetsAmounts(
  month?: number,
  year?: number,
): Promise<BudgetResponse<BudgetAmounts>> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const res = await getBudgetsByMonthDB(hubId, targetMonth, targetYear);

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch budgets.",
      };
    }

    const budgetsArray = res.data;

    const totalAllocated = budgetsArray.reduce(
      (acc, item) =>
        acc + (item.allocatedAmount !== null ? Number(item.allocatedAmount) : 0),
      0,
    );
    // Use calculated spent amount (from transactions) for totals, including IST
    const totalSpent = budgetsArray.reduce(
      (acc, item) =>
        acc +
        Number(item.calculatedSpentAmount ?? 0) +
        (item.spentAmount !== null ? Number(item.spentAmount) : 0),
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
} // End getBudgetsAmounts

// GET Budgets [Action] - Returns canonical domain type BudgetWithCategory[]
// GET Budgets [Action] - Returns canonical domain type BudgetWithCategory[]
export async function getBudgets(
  month?: number,
  year?: number,
): Promise<BudgetResponse<BudgetWithCategory[]>> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    // Ensure instances exist (snapshot/carry-over)
    await ensureBudgetInstances(hubId, targetMonth, targetYear);

    const res = await getBudgetsByMonthDB(hubId, targetMonth, targetYear);

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
      allocatedAmount:
        b.allocatedAmount !== null ? Number(b.allocatedAmount) : null,
      spentAmount: b.spentAmount !== null ? Number(b.spentAmount) : null, // IST - stored initial spent amount
      calculatedSpentAmount: Number(b.calculatedSpentAmount ?? 0), // Calculated from transactions
      warningPercentage: b.warningPercentage,
      markerColor: b.markerColor,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      categoryName: b.categoryName,
      carriedOverAmount: b.carriedOverAmount ? Number(b.carriedOverAmount) : 0,
      isInstance: b.isInstance,
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
// GET Top Categories
export async function getTopCategories(): Promise<BudgetResponse<any[]>> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const now = new Date();
    // Default to current month for dashboard top categories
    const res = await getBudgetsByMonthDB(
      hubId,
      now.getMonth() + 1,
      now.getFullYear(),
      4,
    );

    if (!res.success || !res.data) {
      return { success: false, message: res.message || "No budgets found" };
    }

    const topCategories = res.data.map((b) => {
      const allocated = Number(b.allocatedAmount ?? 0);
      const spent =
        Number(b.calculatedSpentAmount ?? 0) + Number(b.spentAmount ?? 0);

      return {
        title: b.categoryName ?? "Uncategorized",
        content: `CHF ${spent.toLocaleString()} / ${allocated.toLocaleString()}`,
        value: allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0,
        warningThreshold: b.warningPercentage ?? 80,
        markerColor: b.markerColor ?? "standard",
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
    const { hubId, userRole } = await getContext(hdrs, false);

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
    const { hubId, userRole } = await getContext(hdrs, false);

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

// UPSERT Budget Instance [Action]
export async function upsertBudgetInstance(input: {
  budgetId: string;
  month: number;
  year: number;
  allocatedAmount?: number;
  carriedOverAmount?: number;
}): Promise<BudgetResponse> {
  try {
    const hdrs = await headers();
    const { userRole } = await getContext(hdrs, false);
    requireAdminRole(userRole); // Assuming admin only for now

    const result = await upsertBudgetInstanceDB(input);

    return result;
  } catch (err: any) {
    console.error("Error in upsertBudgetInstance action:", err);
    return {
      success: false,
      message: err.message || "Unexpected error while updating budget instance.",
    };
  }
}

// Internal Helper: Ensure Budget Instances Exist (Lazy Rollover)
// Exported for use by budget-rollover service
export async function ensureBudgetInstances(
  hubId: string,
  month: number,
  year: number,
) {
  try {
    const exists = await checkBudgetInstancesExistDB(hubId, month, year);
    if (exists) return;

    // Get Settings
    const settingsRes = await getHubSettingsDB(hubId);
    const carryOverEnabled = settingsRes.data?.budgetCarryOver ?? false;

    // Get Previous Month Data if Carry Over Enabled
    let prevMonthBudgets: any[] = [];
    if (carryOverEnabled) {
      const prevDate = new Date(Date.UTC(year, month - 1, 1));
      prevDate.setMonth(prevDate.getMonth() - 1);
      const pm = prevDate.getMonth() + 1;
      const py = prevDate.getFullYear();

      const res = await getBudgetsByMonthDB(hubId, pm, py);
      if (res.success && res.data) {
        prevMonthBudgets = res.data;
      }
    }

    // Get Current Templates
    const currentBudgetsRes = await getBudgetsDB(hubId);
    if (!currentBudgetsRes.success || !currentBudgetsRes.data) return;

    const currentBudgets = currentBudgetsRes.data;

    // Fetch existing instances to avoid duplicates
    const existingInstances = await getExistingBudgetInstancesDB(hubId, month, year);
    const existingInstanceBudgetIds = new Set(existingInstances.map(i => i.budgetId));

    // Filter to find budgets that don't have an instance yet
    const missingBudgets = currentBudgets.filter(b => b.id !== null && !existingInstanceBudgetIds.has(b.id));

    if (missingBudgets.length === 0) return;

    const instances = missingBudgets.map((b) => {
      let carryOver = 0;
      if (carryOverEnabled) {
        const prev = prevMonthBudgets.find((p) => p.id === b.id);
        if (prev) {
          const allocated = prev.allocatedAmount ?? 0;
          const carried = prev.carriedOverAmount ?? 0;
          const spent =
            (prev.spentAmount ?? 0) + (prev.calculatedSpentAmount ?? 0);
          carryOver = allocated + carried - spent;
        }
      }

      return {
        budgetId: b.id!,
        month,
        year,
        allocatedAmount: b.allocatedAmount ?? 0,
        carriedOverAmount: carryOver,
      };
    });

    await createBudgetInstancesDB(instances);
  } catch (err) {
    console.error("Error ensuring budget instances:", err);
    // Non-blocking error, just continue
  }
}
