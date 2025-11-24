/**
 * Query key factories for React Query
 * Centralized location for all query keys used across the application
 */

/**
 * Query key factory for accounts
 */
export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  list: (hubId: string | null) => [...accountKeys.lists(), hubId] as const,
};

/**
 * Query key factory for categories
 */
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (hubId: string | null) => [...categoryKeys.lists(), hubId] as const,
};

/**
 * Query key factory for transactions
 */
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (hubId: string | null) => [...transactionKeys.lists(), hubId] as const,
  recent: (hubId: string | null) => [...transactionKeys.all, "recent", hubId] as const,
};

/**
 * Query key factory for budgets
 */
export const budgetKeys = {
  all: ["budgets"] as const,
  lists: () => [...budgetKeys.all, "list"] as const,
  list: (hubId: string | null) => [...budgetKeys.lists(), hubId] as const,
  amounts: (hubId: string | null) => [...budgetKeys.all, "amounts", hubId] as const,
  topCategories: (hubId: string | null) => [...budgetKeys.all, "top-categories", hubId] as const,
  categoriesCount: (hubId: string | null) => [...budgetKeys.all, "categories-count", hubId] as const,
};

/**
 * Query key factory for tasks
 */
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (hubId: string | null) => [...taskKeys.lists(), hubId] as const,
};

/**
 * Query key factory for saving goals
 */
export const savingGoalKeys = {
  all: ["saving-goals"] as const,
  lists: () => [...savingGoalKeys.all, "list"] as const,
  list: (hubId: string | null, limit?: number) => [...savingGoalKeys.lists(), hubId, limit] as const,
};

