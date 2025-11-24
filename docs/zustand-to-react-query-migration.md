# Zustand to React Query Migration Guide

## Overview

This guide documents the migration from Zustand stores (used for server data fetching) to React Query (TanStack Query). This migration follows React Query's philosophy of minimal abstraction and letting components compose hooks directly.

## Why Migrate?

### Problems with Zustand for Data Fetching

1. **Anti-pattern**: Zustand is designed for client-side state management, not server data fetching
2. **Manual state management**: You have to manually manage loading, error, and data states
3. **No automatic refetching**: Changes in dependencies (like hub ID) don't automatically trigger refetches
4. **No request deduplication**: Multiple components calling `fetchAccounts()` result in duplicate requests
5. **No caching**: Data is refetched on every component mount
6. **Boilerplate**: Lots of repetitive code for loading/error states

### Benefits of React Query

1. **Automatic caching**: Data is cached and shared across components
2. **Request deduplication**: Multiple components requesting the same data = single request
3. **Automatic refetching**: When query keys change (e.g., hub ID), data automatically refetches
4. **Built-in loading/error states**: No manual state management needed
5. **Background refetching**: Keeps data fresh automatically
6. **Less code**: No need for wrapper hooks or manual state management

## React Query Philosophy

**Key Principle**: Keep abstraction minimal. Let components compose React Query hooks directly.

### ❌ Don't Do This (Old Pattern)

```typescript
// ❌ Creating wrapper hooks that hide React Query
export function useAccounts() {
  return useQuery({ ... });
}

export function useCreateAccount() {
  return useMutation({ ... });
}
```

### ✅ Do This (React Query Philosophy)

```typescript
// ✅ Components use React Query directly
function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: accountKeys.list(hubId),
    queryFn: getFinancialAccounts,
  });
  
  const createAccount = useMutation({
    mutationFn: createFinancialAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
    },
  });
}
```

## File Structure

After migration, your file structure should follow these conventions:

```
src/
├── lib/
│   ├── query-keys.ts          # All query keys (centralized)
│   └── types/
│       └── row-types.ts        # All row types (centralized)
├── components/
│   └── providers/
│       └── query-provider.tsx  # React Query provider
└── store/                      # Only for client-side state (not server data)
```

## Step-by-Step Migration Process

### Step 1: Add Query Keys

Add your query keys to `src/lib/query-keys.ts`:

```typescript
// src/lib/query-keys.ts

/**
 * Query key factory for budgets
 */
export const budgetKeys = {
  all: ["budgets"] as const,
  lists: () => [...budgetKeys.all, "list"] as const,
  list: (hubId: string | null) => [...budgetKeys.lists(), hubId] as const,
  amounts: (hubId: string | null) => [...budgetKeys.all, "amounts", hubId] as const,
  categoriesCount: (hubId: string | null) => [...budgetKeys.all, "categories-count", hubId] as const,
};
```

**Important**: 
- Include `hubId` in query keys so data refetches when hub changes!
- Use hierarchical structure for easy invalidation (see Query Key Patterns section)

### Step 2: Move Row Types (if needed)

If your store exports row types, move them to `src/lib/types/row-types.ts`:

```typescript
// src/lib/types/row-types.ts

import type { AccountType } from "@/db/queries";

/**
 * Budget row type for budgets table
 */
export interface BudgetRow {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  progress: number;
}

// Future row types can be added here:
// export interface TransactionRow { ... }
// export interface SavingGoalRow { ... }
// etc.
```

**Note**: If row types are already in service files (like `BudgetRow` in `src/lib/services/budget.ts`), you can keep them there or move them to `row-types.ts` for consistency.

### Step 3: Update Components to Use `useQuery` Directly

Replace Zustand store usage with React Query in your components.

#### Before (Zustand):

```typescript
// ❌ Old pattern with Zustand
import { useBudgetStore } from "@/store/budget-store";

function BudgetTable() {
  const { budgets, budgetsLoading, budgetsError, fetchBudgets } = useBudgetStore();

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  if (budgetsLoading) return <div>Loading...</div>;
  if (budgetsError) return <div>Error: {budgetsError}</div>;
  
  return <div>{/* render budgets */}</div>;
}
```

#### After (React Query):

```typescript
// ✅ New pattern with React Query
import { useQuery } from "@tanstack/react-query";
import { getBudgets } from "@/lib/services/budget";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { BudgetRow } from "@/lib/types/row-types";

function BudgetTable() {
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const {
    data: budgets,
    isLoading: budgetsLoading,
    error: budgetsError,
  } = useQuery<BudgetRow[]>({
    queryKey: budgetKeys.list(hubId),
    queryFn: async () => {
      const res = await getBudgets();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budgets");
      }
      return res.data ?? [];
    },
  });

  if (budgetsLoading) return <div>Loading...</div>;
  if (budgetsError) return <div>Error: {budgetsError.message}</div>;
  
  return <div>{/* render budgets */}</div>;
}
```

**Key Points**:
- ✅ No `useEffect` needed - React Query handles fetching automatically
- ✅ Get `hubId` from URL using `useSearchParams()`
- ✅ Use query keys from `query-keys.ts`
- ✅ Handle service function response format (check `res.success` or `res.status`)
- ✅ Throw errors so React Query can handle them properly

### Step 4: Update Mutations

Replace mutation methods with `useMutation`.

#### Before (Zustand):

```typescript
// ❌ Old pattern with Zustand
import { useBudgetStore } from "@/store/budget-store";

function CreateBudgetDialog() {
  const { createBudgetAndSync, createLoading } = useBudgetStore();

  const handleSubmit = async (data) => {
    try {
      await createBudgetAndSync(data);
      // Dialog closes, data refreshes
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createLoading}>
        {createLoading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

#### After (React Query):

```typescript
// ✅ New pattern with React Query
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBudget } from "@/lib/services/budget";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function CreateBudgetDialog() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const createBudgetMutation = useMutation({
    mutationFn: async (data: CreateBudgetInput) => {
      const result = await createBudget(data);
      if (!result.success) {
        throw new Error(result.message || "Failed to create budget");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.list(hubId) });
      toast.success("Budget created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create budget");
    },
  });

  const handleSubmit = async (data) => {
    try {
      await createBudgetMutation.mutateAsync(data);
      // Dialog closes, data automatically refreshes
    } catch (err) {
      // Error already handled in onError (toast shown)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createBudgetMutation.isPending}>
        {createBudgetMutation.isPending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

**Key Points**:
- ✅ Use `useQueryClient()` for cache invalidation
- ✅ Invalidate queries in `onSuccess` to refetch data automatically
- ✅ Handle errors in `onError` (show toast notifications)
- ✅ Check service function response and throw errors if needed
- ✅ Use `isPending` instead of custom loading state

### Step 5: Handle Multiple Queries

If your store has multiple related queries (e.g., budgets, amounts, categories count), use multiple `useQuery` hooks:

```typescript
import { useQuery } from "@tanstack/react-query";
import { getBudgets, getBudgetsAmounts, getCategoriesCount } from "@/lib/services/budget";
import { budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";

function BudgetDashboard() {
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  // Multiple queries in the same component
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: budgetKeys.list(hubId),
    queryFn: async () => {
      const res = await getBudgets();
      if (!res.success) throw new Error(res.message || "Failed to fetch budgets");
      return res.data ?? [];
    },
  });

  const { data: amounts, isLoading: amountsLoading } = useQuery({
    queryKey: budgetKeys.amounts(hubId),
    queryFn: async () => {
      const res = await getBudgetsAmounts();
      if (!res.success) throw new Error(res.message || "Failed to fetch amounts");
      return res.data;
    },
  });

  const { data: categoriesCount, isLoading: countLoading } = useQuery({
    queryKey: budgetKeys.categoriesCount(hubId),
    queryFn: async () => {
      const res = await getCategoriesCount();
      if (!res.success) throw new Error(res.message || "Failed to fetch count");
      return res.data;
    },
  });

  const isLoading = budgetsLoading || amountsLoading || countLoading;

  // Use the data...
}
```

### Step 6: Update All Component Imports

Search for all usages of the store and update imports:

```bash
# Find all usages
grep -r "useBudgetStore" src/
```

Update imports in all files:
- Remove: `import { useBudgetStore } from "@/store/budget-store";`
- Add: `import { useQuery } from "@tanstack/react-query";`
- Add: `import { budgetKeys } from "@/lib/query-keys";`
- Add: `import { useSearchParams } from "next/navigation";`

### Step 7: Delete the Zustand Store

Once all components are migrated:
1. Verify no remaining references: `grep -r "useBudgetStore" src/`
2. Delete `src/store/budget-store.ts`
3. If the store exported types, ensure they're moved to `row-types.ts`

## Common Mistakes & Challenges

### Mistake 1: Creating Wrapper Hooks

**❌ Wrong Approach**:
```typescript
// Don't create wrapper hooks - this adds unnecessary abstraction
export function useBudgets() {
  return useQuery({ ... });
}

export function useCreateBudget() {
  return useMutation({ ... });
}
```

**Why it's wrong**: Adds unnecessary abstraction. Components should use React Query directly.

**✅ Correct Approach**:
```typescript
// Components use React Query directly
const { data: budgets } = useQuery({
  queryKey: budgetKeys.list(hubId),
  queryFn: getBudgets,
});
```

### Mistake 2: Forgetting Hub ID in Query Keys

**❌ Wrong**:
```typescript
queryKey: ["budgets"] // Won't refetch when hub changes!
```

**✅ Correct**:
```typescript
queryKey: budgetKeys.list(hubId) // Automatically refetches when hub changes
```

**Why**: The hub ID is part of the query key, so when it changes, React Query automatically refetches the data.

### Mistake 3: Not Handling Service Function Response Format

Service functions return different formats. Always check and throw errors:

**For services returning `{ success: boolean, data?: T, message?: string }`**:
```typescript
queryFn: async () => {
  const res = await getBudgets();
  if (!res.success) {
    throw new Error(res.message || "Failed to fetch budgets");
  }
  return res.data ?? [];
},
```

**For services returning `{ status: boolean, tableData?: T }`**:
```typescript
queryFn: async () => {
  const res = await getFinancialAccounts();
  if (!res.status) {
    throw new Error("Failed to fetch accounts");
  }
  return res.tableData ?? [];
},
```

### Mistake 4: Not Invalidating Queries After Mutations

**❌ Wrong**:
```typescript
const mutation = useMutation({
  mutationFn: createBudget,
  // Missing invalidation - data won't refresh!
});
```

**✅ Correct**:
```typescript
const mutation = useMutation({
  mutationFn: createBudget,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: budgetKeys.list(hubId) });
  },
});
```

**Why**: After creating/updating/deleting, you need to tell React Query to refetch the affected queries.

### Mistake 5: Using `useEffect` to Fetch Data

**❌ Wrong**:
```typescript
useEffect(() => {
  fetchBudgets();
}, [fetchBudgets]);
```

**✅ Correct**:
```typescript
// React Query handles fetching automatically - no useEffect needed!
const { data: budgets } = useQuery({
  queryKey: budgetKeys.list(hubId),
  queryFn: getBudgets,
});
```

**Why**: React Query automatically fetches when the component mounts and when query keys change.

### Mistake 6: Not Including Dependencies in Query Keys

**❌ Wrong**:
```typescript
// If data depends on filters, but filters aren't in query key
queryKey: budgetKeys.list(hubId),
queryFn: () => getBudgets(filters), // filters change but query doesn't refetch!
```

**✅ Correct**:
```typescript
// Include all dependencies in query key
queryKey: budgetKeys.list(hubId, filters),
queryFn: () => getBudgets(filters), // Query refetches when filters change
```

## Query Key Patterns

### Hierarchical Structure

Use a hierarchical structure for easy invalidation:

```typescript
export const budgetKeys = {
  all: ["budgets"] as const,
  lists: () => [...budgetKeys.all, "list"] as const,
  list: (hubId: string | null) => [...budgetKeys.lists(), hubId] as const,
  detail: (hubId: string | null, id: string) => [...budgetKeys.all, "detail", hubId, id] as const,
};
```

**Benefits**:
- `invalidateQueries({ queryKey: budgetKeys.all })` → invalidates all budget queries
- `invalidateQueries({ queryKey: budgetKeys.lists() })` → invalidates all list queries
- `invalidateQueries({ queryKey: budgetKeys.list(hubId) })` → invalidates specific list

### Including Dependencies

Always include dependencies that affect the data:
- `hubId` - Required for hub-scoped data
- `date` - For date-filtered queries
- `filters` - For filtered queries

```typescript
list: (hubId: string | null, filters?: FilterOptions) => 
  [...budgetKeys.lists(), hubId, filters] as const,
```

## Real Examples from Accounts Migration

### Example 1: Simple Query Component

**File**: `src/app/me/accounts/_components/data-table.tsx`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { getFinancialAccounts } from "@/lib/services/financial-account";
import { accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { AccountRow } from "@/lib/types/row-types";

export function ContentDataTable() {
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const {
    data: accounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useQuery<AccountRow[]>({
    queryKey: accountKeys.list(hubId),
    queryFn: async () => {
      const res = await getFinancialAccounts();
      if (!res.status) {
        throw new Error("Failed to fetch accounts");
      }
      return res.tableData ?? [];
    },
  });

  // Use accounts, accountsLoading, accountsError...
}
```

### Example 2: Mutation with Invalidation

**File**: `src/app/me/accounts/_components/new-account-dialog.tsx`

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFinancialAccount } from "@/lib/services/financial-account";
import { accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function NewAccountDialog() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const createAccount = useMutation({
    mutationFn: async (data: Parameters<typeof createFinancialAccount>[0]) => {
      const result = await createFinancialAccount(data);
      if (!result.status) {
        throw new Error(result.message || "Failed to create account");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success("Account created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create account");
    },
  });

  const onSubmit = async (values) => {
    try {
      await createAccount.mutateAsync({
        name: values.name,
        type: values.type,
        initialBalance: values.balance,
        iban: values.iban,
        note: values.note,
      });
      // Close dialog, data automatically refreshes
    } catch (err) {
      // Error already handled in onError
    }
  };

  return (
    // Form with createAccount.isPending for loading state
  );
}
```

### Example 3: Multiple Mutations in One Component

**File**: `src/app/me/accounts/_components/edit-account-dialog.tsx`

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateFinancialAccount, deleteFinancialAccount } from "@/lib/services/financial-account";
import { accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function EditAccountDialog({ accountData }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const updateAccount = useMutation({
    mutationFn: async ({ accountId, updatedData }) => {
      const result = await updateFinancialAccount(accountId, updatedData);
      if (!result.status) {
        throw new Error(result.message || "Failed to update account");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success("Account updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update account");
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (accountId: string) => {
      const result = await deleteFinancialAccount(accountId);
      if (!result.status) {
        throw new Error(result.message || "Failed to delete account");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success("Account deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });

  // Use updateAccount and deleteAccount mutations...
}
```

## Checklist for Migration

Use this checklist when migrating each store:

- [ ] **Add query keys** to `src/lib/query-keys.ts` (include `hubId`!)
- [ ] **Move row types** to `src/lib/types/row-types.ts` (if applicable)
- [ ] **Replace `useStore()` calls** with `useQuery()` in components
- [ ] **Replace mutation methods** with `useMutation()`
- [ ] **Add query invalidation** in mutation `onSuccess`
- [ ] **Add toast notifications** in mutation `onSuccess`/`onError`
- [ ] **Remove `useEffect` hooks** used for fetching
- [ ] **Remove manual loading/error state** management
- [ ] **Update all imports** to use new locations
- [ ] **Verify hub ID changes** trigger refetches
- [ ] **Test all CRUD operations** (Create, Read, Update, Delete)
- [ ] **Search for remaining references**: `grep -r "useXStore" src/`
- [ ] **Delete the Zustand store** file

## Testing Your Migration

After migration, verify the following:

1. **Hub Switching**: Switch hubs and verify data refetches automatically
2. **Create**: Create a new item and verify it appears in the list immediately
3. **Update**: Update an item and verify changes are reflected
4. **Delete**: Delete an item and verify it's removed from the list
5. **Multiple Components**: Open multiple components using the same data - should only see one request in Network tab (request deduplication)
6. **Error Handling**: Verify error states display correctly
7. **Loading States**: Verify loading indicators show/hide correctly
8. **Cache**: Navigate away and back - data should load from cache instantly

## Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Query Key Factories](https://tkdodo.eu/blog/effective-react-query-keys)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)

## Questions?

If you encounter issues during migration:

1. **Check the accounts migration** as a reference (`src/app/me/accounts/`)
2. **Verify query keys** include `hubId` and all dependencies
3. **Ensure mutations** invalidate queries in `onSuccess`
4. **Check service function** response format matches your handling
5. **Review React Query DevTools** to see what queries are running

---

**Remember**: Follow React Query's philosophy - minimal abstraction, let components compose hooks directly!

