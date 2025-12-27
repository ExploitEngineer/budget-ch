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
  getRecurringTransactionTemplatesDB,
  getHubTotalExpensesDB,
} from "@/db/queries";
import { requireAdminRole } from "@/lib/auth/permissions";
import {
  startOfDay,
  endOfMonth,
  addDays,
  isBefore,
  isAfter,
  isSameDay,
  format
} from "date-fns";
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
  hubIdArg?: string,
): Promise<BudgetResponse<BudgetAmounts>> {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

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
    const totalSpentRes = await getHubTotalExpensesDB(
      hubId,
      targetMonth,
      targetYear,
    );
    const totalSpent = totalSpentRes.success ? Number(totalSpentRes.data || 0) : 0;

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

/**
 * GET Count of budgets over their warning threshold
 */
export async function getBudgetWarningsCount(
  month?: number,
  year?: number,
  hubIdArg?: string,
): Promise<BudgetResponse<{ count: number }>> {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const res = await getBudgetsByMonthDB(hubId, targetMonth, targetYear);
    if (!res.success || !res.data) {
      return { success: true, data: { count: 0 }, message: "No budgets found or error fetching budgets" };
    }

    const warnings = res.data.filter((b) => {
      const allocated = Number(b.allocatedAmount ?? 0);
      const carried = Number(b.carriedOverAmount ?? 0);
      const totalAllocated = allocated + (allocated > 0 ? carried : 0);

      const ist = Number(b.spentAmount ?? 0);
      const spent = Number(b.calculatedSpentAmount ?? 0);
      const totalSpent = ist + spent;

      const threshold = b.warningPercentage ?? 80;
      const percent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

      return percent >= threshold;
    });

    return {
      success: true,
      message: "Budget warnings count fetched",
      data: { count: warnings.length },
    };
  } catch (err: any) {
    console.error("Error in getBudgetWarningsCount:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch budget warnings count",
    };
  }
}

/**
 * GET Budget Forecast for the end of the month
 * Forecast = (Total Allocated - Total Spent) - (Upcoming Recurring Expenses this month)
 */
export async function getBudgetForecast(
  hubIdArg?: string,
): Promise<BudgetResponse<{
  forecastValue: number;
  forecastDate: string;
}>> {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const today = startOfDay(new Date());
    const monthEnd = endOfMonth(today);

    // 1. Get Budget Amounts
    const amountsRes = await getBudgetsAmounts(undefined, undefined, hubId);
    if (!amountsRes.success || !amountsRes.data) {
      return { success: false, message: "Failed to fetch budget amounts for forecast" };
    }

    const { totalAllocated, totalSpent } = amountsRes.data;
    const available = totalAllocated - totalSpent;

    // 2. Get Upcoming Recurring Transactions for the rest of this month
    const templates = await getRecurringTransactionTemplatesDB(hubId);
    let upcomingRecurringTotal = 0;

    for (const template of templates) {
      const startDate = startOfDay(new Date(template.startDate));
      let nextOccur = startDate;

      if (template.frequencyDays > 0) {
        while (isBefore(nextOccur, today)) {
          nextOccur = startOfDay(addDays(nextOccur, template.frequencyDays));
        }
      }

      // Sum all occurrences between today and monthEnd
      while (isBefore(nextOccur, monthEnd) || isSameDay(nextOccur, monthEnd)) {
        // Check end date
        if (template.endDate && isAfter(nextOccur, startOfDay(new Date(template.endDate)))) {
          break;
        }

        // Add to total (subtract expenses, add income)
        if (template.type === "expense" || template.type === "transfer") {
          upcomingRecurringTotal += Number(template.amount);
        } else if (template.type === "income") {
          upcomingRecurringTotal -= Number(template.amount);
        }

        nextOccur = startOfDay(addDays(nextOccur, template.frequencyDays));
      }
    }

    const forecast = available - upcomingRecurringTotal;

    return {
      success: true,
      message: "Forecast calculated",
      data: {
        forecastValue: forecast,
        forecastDate: format(monthEnd, "dd.MM.yyyy"),
      },
    };
  } catch (err: any) {
    console.error("Error calculating budget forecast:", err);
    return {
      success: false,
      message: err.message || "Failed to calculate forecast",
    };
  }
}

// GET Budgets [Action] - Returns canonical domain type BudgetWithCategory[]
// GET Budgets [Action] - Returns canonical domain type BudgetWithCategory[]
export async function getBudgets(
  month?: number,
  year?: number,
  hubIdArg?: string,
): Promise<BudgetResponse<BudgetWithCategory[]>> {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const targetMonth = month || currentMonth;
    const targetYear = year || currentYear;

    // Check if this is a future month
    const isFutureMonth = targetYear > currentYear ||
      (targetYear === currentYear && targetMonth > currentMonth);

    // Ensure instances exist for non-future months
    if (!isFutureMonth) {
      await ensureBudgetInstances(hubId, targetMonth, targetYear);
    }

    const res = await getBudgetsByMonthDB(hubId, targetMonth, targetYear);

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch budgets.",
      };
    }

    // For future months, calculate simulated IST values if carry-over is enabled
    let dynamicIST: Map<string, number> | null = null;

    if (isFutureMonth) {
      const settingsRes = await getHubSettingsDB(hubId);
      const carryOverEnabled = settingsRes.data?.budgetCarryOver ?? false;

      if (carryOverEnabled) {
        dynamicIST = await calculateFutureIST(
          hubId,
          currentMonth,
          currentYear,
          targetMonth,
          targetYear
        );
      }
    }

    // Normalize DB output (ensure numbers are properly typed)
    const budgets: BudgetWithCategory[] = res.data.map((b) => {
      // Base IST is always the template's spentAmount (user-set value)
      const spentAmount = b.spentAmount !== null ? Number(b.spentAmount) : null;

      // Carry-over amount: for future months with carry-over ON, use dynamic calculation
      // Otherwise use database value (which is 0 for future months without instances)
      let carriedOverAmount = b.carriedOverAmount ? Number(b.carriedOverAmount) : 0;

      if (isFutureMonth && dynamicIST && b.id) {
        // For future months with carry-over enabled:
        // dynamicIST contains the simulated IST value (which is baseIST - cumulative carryOver)
        // We need to extract the carry-over: carryOver = baseIST - simulatedIST
        const baseIST = spentAmount ?? 0;
        const simulatedIST = dynamicIST.get(b.id) ?? 0;
        carriedOverAmount = baseIST - simulatedIST;
      }

      return {
        id: b.id,
        hubId: b.hubId,
        userId: b.userId,
        transactionCategoryId: b.transactionCategoryId,
        allocatedAmount:
          b.allocatedAmount !== null ? Number(b.allocatedAmount) : null,
        spentAmount,
        calculatedSpentAmount: Number(b.calculatedSpentAmount ?? 0), // Calculated from transactions
        warningPercentage: b.warningPercentage,
        markerColor: b.markerColor,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        categoryName: b.categoryName,
        carriedOverAmount,
        isInstance: b.isInstance,
      };
    });

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

/**
 * Calculate simulated IST values for future months by chaining from current month
 * Returns a Map of budgetId -> IST value for the target month
 * Formula: nextIST = prevIST - prevREST, where REST = BUDGET - prevIST
 */
async function calculateFutureIST(
  hubId: string,
  startMonth: number,
  startYear: number,
  targetMonth: number,
  targetYear: number,
): Promise<Map<string, number>> {
  const istMap = new Map<string, number>();

  // Start from current month and chain forward
  let m = startMonth;
  let y = startYear;

  // Get current month's data as the starting point
  const currentMonthRes = await getBudgetsByMonthDB(hubId, m, y);
  if (!currentMonthRes.success || !currentMonthRes.data) {
    return istMap;
  }

  // Initialize IST for first future month based on current month's REST
  // Current month IST = spentAmount - carriedOver (from adapter formula)
  // Current month REST = BUDGET - IST - SPENT = allocated + carried - (spentAmount + calcSpent)
  // First future month IST = current IST - current REST
  for (const budget of currentMonthRes.data) {
    if (!budget.id) continue;

    const allocated = Number(budget.allocatedAmount ?? 0);
    const carried = Number(budget.carriedOverAmount ?? 0);
    const spentAmount = Number(budget.spentAmount ?? 0);
    const calcSpent = Number(budget.calculatedSpentAmount ?? 0);

    // Current month's REST = BUDGET + CARRIED - IST_BASE - SPENT
    const currentREST = allocated + carried - spentAmount - calcSpent;

    // First future month IST = baseIST - currentREST
    // (In future months, spentAmount is the base template IST)
    const firstFutureIST = spentAmount - currentREST;

    istMap.set(budget.id, firstFutureIST);
  }

  // Chain forward month by month
  // For future months: nextIST = prevIST - prevREST, where REST = BUDGET - prevIST
  while (true) {
    // Move to next month
    if (m === 12) {
      m = 1;
      y++;
    } else {
      m++;
    }

    // Stop when we reach target month
    if (m === targetMonth && y === targetYear) {
      break;
    }

    // For intermediate future months, calculate IST chain
    const intermediateRes = await getBudgetsByMonthDB(hubId, m, y);
    if (intermediateRes.success && intermediateRes.data) {
      for (const budget of intermediateRes.data) {
        if (!budget.id) continue;

        const prevIST = istMap.get(budget.id) ?? 0;
        const allocated = Number(budget.allocatedAmount ?? 0);
        const baseIST = Number(budget.spentAmount ?? 0);

        // prevCarried = baseIST - prevIST
        const prevCarried = baseIST - prevIST;
        // REST for this intermediate month = BUDGET + CARRIED - baseIST
        const monthREST = allocated + prevCarried - baseIST;

        // Next month's IST = baseIST - currentREST
        const nextIST = baseIST - monthREST;
        istMap.set(budget.id, nextIST);
      }
    }
  }

  return istMap;
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
    // Don't create instances for future months - they should use template values
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonth);

    if (isFutureMonth) {
      return; // Skip instance creation for future months
    }

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
