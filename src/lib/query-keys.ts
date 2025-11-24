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

// Future query keys can be added here:
// export const budgetKeys = { ... }
// etc.

