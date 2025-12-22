import ky from "ky";
import { ApiResponse } from "./api-response";
import { Transaction } from "./types/dashboard-types";
import type { AccountRow } from "./types/row-types";
import type { SavingGoal } from "./types/domain-types";
import type { QuickTask } from "@/db/schema";
import type { DashboardSavingsGoalsCards } from "./types/dashboard-types";
import type {
  BudgetWithCategory,
  BudgetAmounts,
  FinancialAccount,
  TransactionWithDetails,
} from "./types/domain-types";

export const apiInstance = ky.create({
  // prefixUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api`,
});

// Transactions
export async function getTransactions(hubId: string) {
  const response = await apiInstance.get(`/api/me/transactions`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<TransactionWithDetails[]>;
}

export async function getRecentTransactions(hubId: string) {
  const response = await apiInstance.get(`/api/me/transactions/recent`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<TransactionWithDetails[]>;
}

// Budgets
export async function getBudgets(
  hubId: string,
  month?: number,
  year?: number,
) {
  const response = await apiInstance.get(`/api/me/budgets`, {
    searchParams: {
      hub: hubId,
      ...(month && { month: month.toString() }),
      ...(year && { year: year.toString() }),
    },
  });
  const data = await response.json();
  return data as ApiResponse<BudgetWithCategory[]>;
}

export async function getBudgetsAmounts(
  hubId: string,
  month?: number,
  year?: number,
) {
  const response = await apiInstance.get(`/api/me/budgets/amounts`, {
    searchParams: {
      hub: hubId,
      ...(month && { month: month.toString() }),
      ...(year && { year: year.toString() }),
    },
  });
  const data = await response.json();
  return data as ApiResponse<BudgetAmounts>;
}

export async function getTopCategories(hubId: string) {
  const response = await apiInstance.get(`/api/me/budgets/top-categories`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<DashboardSavingsGoalsCards[]>;
}

// Accounts
export async function getFinancialAccounts(hubId: string) {
  const response = await apiInstance.get(`/api/me/accounts`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<FinancialAccount[]>;
}

// Saving Goals
export async function getSavingGoals(hubId: string, limit?: number) {
  const response = await apiInstance.get(`/api/me/saving-goals`, {
    searchParams: {
      hub: hubId,
      ...(limit && { limit: limit.toString() })
    }
  });
  const data = await response.json();
  return data as ApiResponse<SavingGoal[]>;
}

export async function getSavingGoalsSummary(hubId: string) {
  const response = await apiInstance.get(`/api/me/saving-goals/summary`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<{ totalTarget: number; totalSaved: number; remainingToSave: number; totalGoals: number }>;
}

// Tasks
export async function getTasks(hubId: string) {
  const response = await apiInstance.get(`/api/me/tasks`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<QuickTask[]>;
}

// Categories
export async function getCategories(hubId: string) {
  const response = await apiInstance.get(`/api/me/categories`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<Array<{ id: string; name: string }>>;
}

// Reports
export interface CategoryDetail {
  id: string;
  name: string;
  totalAmount: number;
}

export interface MonthlyReport {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface ExpenseCategoryProgress {
  category: string;
  amount: number;
  accountBalance: number;
  percent: number;
}

export async function getDetailedCategories(hubId: string) {
  const response = await apiInstance.get(`/api/me/reports/detailed-categories`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<CategoryDetail[]>;
}

export async function getMonthlyReports(hubId: string) {
  const response = await apiInstance.get(`/api/me/reports/monthly`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<MonthlyReport[]>;
}

export async function getExpenseCategoriesProgress(hubId: string) {
  const response = await apiInstance.get(`/api/me/reports/expense-categories-progress`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<{ data: ExpenseCategoryProgress[] }>;
}

// Transfers
export async function getAccountTransfers(hubId: string) {
  const response = await apiInstance.get(`/api/me/transfers`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<any[]>;
}