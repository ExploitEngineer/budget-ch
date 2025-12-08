# Data Fetching and Mutations Architecture

This document describes the architectural patterns for data fetching and mutations in the application.

## Core Principles

1. **All data fetching (GET/reads) must go through HTTP API routes** - No server actions or direct service/db calls should be used as a data source for client components.
2. **All mutations (writes) use server actions** - Server actions are imported into client components and wrapped with React Query `useMutation`.
3. **Service layer rule** - API routes call service-layer functions in `src/lib/services/**`, which in turn call query functions (Drizzle) in `queries.ts`. API routes should be thin: auth + input parsing + calling service + mapping to `apiSuccess` / `apiError`.
4. **Hub rule** - For hub-scoped data, derive `hubId` from the current request context (URL/search params) and validate membership, never from the auth context alone.

## Data Fetching Pattern

### API Routes

All GET endpoints are implemented as API routes under `src/app/api/...`:

```typescript
// src/app/api/me/transactions/route.ts
import { getTransactions } from "@/lib/services/transaction";
import { apiError, apiSuccess } from "@/lib/api-response";
import { validateHubAccess } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hubId = searchParams.get("hub");
  
  if (!hubId) {
    return apiError({ message: "Hub ID is required", status: 400 });
  }
  
  const access = await validateHubAccess(hubId);
  if (!access.success) {
    return apiError({ message: access.message ?? "Access denied", status: 403 });
  }
  
  const transactions = await getTransactions(hubId);
  
  if (!transactions.success) {
    return apiError({ message: transactions.message ?? "Failed to fetch transactions", status: 500 });
  }
  
  return apiSuccess({ data: transactions.data, status: 200 });
}
```

### Client-Side API Functions

All API routes have corresponding client-side functions in `src/lib/api.ts`:

```typescript
// src/lib/api.ts
export async function getTransactions(hubId: string) {
  const response = await apiInstance.get(`/api/me/transactions`, {
    searchParams: {
      hub: hubId
    }
  });
  const data = await response.json();
  return data as ApiResponse<Transaction[]>;
}
```

### React Query Usage in Client Components

Client components use React Query `useQuery` with API functions:

```typescript
// src/app/me/transactions/_components/transactions-client.tsx
const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
  queryKey: transactionKeys.list(hubId),
  queryFn: async () => {
    if (!hubId) {
      throw new Error("Hub ID is required");
    }
    const res = await getTransactions(hubId);
    if (!res.success) {
      throw new Error(res.message || "Failed to fetch transactions");
    }
    return res.data ?? [];
  },
  enabled: !!hubId,
});
```

### SSR Prefetching Pattern

Server pages prefetch data and hydrate client components:

```typescript
// src/app/me/transactions/page.tsx
export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const { hub: hubId } = await searchParams;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: transactionKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getTransactions(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch transactions");
      }
      return res.data ?? [];
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionsClient />
    </HydrationBoundary>
  );
}
```

## Mutation Pattern

### Server Actions

Server actions handle all write operations:

```typescript
// src/lib/services/transaction.ts
"use server";

export async function createTransaction({ ... }) {
  // Validation, business logic, database operations
  return { success: true };
}
```

### React Query Mutations

Client components wrap server actions with `useMutation`:

```typescript
// src/app/me/transactions/_components/create-transaction-dialog.tsx
const createTransactionMutation = useMutation({
  mutationFn: async (data) => {
    const result = await createTransaction(data);
    if (!result.success) {
      throw new Error(result.message || "Failed to create transaction");
    }
    return result;
  },
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
    queryClient.invalidateQueries({ queryKey: transactionKeys.recent(hubId) });
    queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
    toast.success("Transaction created successfully!");
  },
  onError: (error: Error) => {
    toast.error(error.message || "Failed to create transaction");
  },
});
```

## Query Keys

All query keys are centralized in `src/lib/query-keys.ts`:

```typescript
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (hubId: string | null) => [...transactionKeys.lists(), hubId] as const,
  recent: (hubId: string | null) => [...transactionKeys.all, "recent", hubId] as const,
};
```

## Hub Validation

All hub-scoped API routes validate hub access using `validateHubAccess`:

```typescript
// src/lib/api-helpers.ts
export async function validateHubAccess(hubId: string): Promise<{
  success: boolean;
  userId?: string;
  message?: string;
}> {
  // Validates user has access to the hub
  // Checks hub membership and ownership
}
```

## Adding a New Resource

To add a new resource (e.g., "invoices"):

1. **Create service function** in `src/lib/services/invoice.ts`:
   ```typescript
   "use server";
   export async function getInvoices(hubId: string) { ... }
   ```

2. **Create API route** in `src/app/api/me/invoices/route.ts`:
   ```typescript
   export async function GET(request: Request) {
     const hubId = searchParams.get("hub");
     const access = await validateHubAccess(hubId);
     // ... validation and call service
   }
   ```

3. **Add client function** in `src/lib/api.ts`:
   ```typescript
   export async function getInvoices(hubId: string) {
     const response = await apiInstance.get(`/api/me/invoices`, {
       searchParams: { hub: hubId }
     });
     return await response.json() as ApiResponse<Invoice[]>;
   }
   ```

4. **Add query keys** in `src/lib/query-keys.ts`:
   ```typescript
   export const invoiceKeys = {
     all: ["invoices"] as const,
     lists: () => [...invoiceKeys.all, "list"] as const,
     list: (hubId: string | null) => [...invoiceKeys.lists(), hubId] as const,
   };
   ```

5. **Use in components**:
   ```typescript
   const { data } = useQuery({
     queryKey: invoiceKeys.list(hubId),
     queryFn: () => getInvoices(hubId).then(res => res.data ?? []),
   });
   ```

6. **Add SSR prefetch** in server page if needed:
   ```typescript
   await queryClient.prefetchQuery({
     queryKey: invoiceKeys.list(hubId),
     queryFn: async () => {
       const res = await getInvoices(hubId);
       return res.data ?? [];
     },
   });
   ```

## Common Mistakes to Avoid

1. **Don't call service functions directly from client components** - Always use API routes via `@/lib/api` functions.
2. **Don't use server actions for reads** - Server actions are only for mutations.
3. **Don't forget to invalidate queries** - After mutations, invalidate related query keys to refresh the UI.
4. **Don't skip hub validation** - Always validate hub access in API routes.
5. **Don't forget SSR prefetching** - For pages with data-heavy components, prefetch on the server for better performance.
