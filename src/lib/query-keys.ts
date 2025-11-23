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

// Future query keys can be added here:
// export const budgetKeys = { ... }
// export const transactionKeys = { ... }
// etc.

