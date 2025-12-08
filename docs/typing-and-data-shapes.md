# Typing and Data Shapes

This document describes the type system architecture and data flow patterns used in the codebase to maintain a Single Source of Truth (SSOT) for data types and decouple data fetching from UI presentation.

## Overview

The codebase follows a clear separation between **domain types** (canonical data structures) and **UI types** (presentation-specific shapes). This separation ensures:

- **Type safety**: All types derive from the database schema, preventing drift
- **Maintainability**: Changes to the schema automatically propagate through the type system
- **Flexibility**: UI components can transform domain data without affecting backend logic
- **Testability**: Adapters can be tested independently

## Type System Architecture

### 1. Schema-Derived Types (`src/db/schema.ts`)

All core table types are derived directly from Drizzle schema definitions using `InferSelectModel`:

```typescript
export type Budget = InferSelectModel<typeof budgets>;
export type FinancialAccount = InferSelectModel<typeof financialAccounts>;
export type Transaction = InferSelectModel<typeof transactions>;
// ... etc
```

Enum types are also defined here:
```typescript
export type AccessRole = "admin" | "member";
export type TransactionType = "income" | "expense" | "transfer";
export type AccountType = "checking" | "savings" | "credit-card" | "cash";
```

**Rule**: Never redefine these types elsewhere. Always import from `schema.ts`.

### 2. Domain Types (`src/lib/types/domain-types.ts`)

Domain types represent canonical data structures used across services, API routes, and business logic. They include:

- **Re-exports** of schema-derived base types
- **Domain view models** for cross-table joins (e.g., `BudgetWithCategory`)
- **Domain aggregates** for summaries (e.g., `BudgetAmounts`)

Example:
```typescript
export interface BudgetWithCategory {
  id: string;
  hubId: string;
  userId: string | null;
  transactionCategoryId: string | null;
  allocatedAmount: number;
  spentAmount: number;
  warningPercentage: number;
  markerColor: string;
  createdAt: Date;
  updatedAt: Date;
  categoryName: string | null; // From joined TransactionCategory
}
```

**Rule**: Domain types should NOT include UI-specific fields (formatted values, computed display metrics, etc.).

### 3. UI Types (`src/lib/types/ui-types.ts`)

UI types represent how data is displayed or manipulated in components. They:

- Derive from domain types using TypeScript utility types (`Pick`, `Omit`, etc.)
- Include computed/derived fields (e.g., `progress`, `remaining`)
- Use UI-friendly field names (e.g., `allocated` instead of `allocatedAmount`)

Example:
```typescript
export interface BudgetRow {
  id: BudgetWithCategory["id"];
  category: string; // Maps from categoryName
  allocated: BudgetWithCategory["allocatedAmount"];
  spent: BudgetWithCategory["spentAmount"];
  remaining: number; // Computed: allocated - spent
  progress: number; // Computed: (spent / allocated) * 100
}
```

**Rule**: Always derive UI types from domain types. Never redefine core structures from scratch.

## Data Flow Pattern

### Backend Layer (DB → Services → API Routes)

1. **Database queries** (`src/db/queries.ts`):
   - Return canonical domain types (e.g., `BudgetWithCategory[]`)
   - Never return UI-shaped data
   - Example: `getBudgetsDB()` returns `BudgetWithCategory[]`

2. **Service functions** (`src/lib/services/*.ts`):
   - Return domain types only
   - Perform normalization (e.g., `Number()` coercion)
   - Do NOT compute UI-specific fields (progress, formatted values, etc.)
   - Example: `getBudgets()` returns `BudgetResponse<BudgetWithCategory[]>`

3. **API routes** (`src/app/api/**/route.ts`):
   - Thin wrappers over service functions
   - Forward domain types unchanged
   - Example: `/api/me/budgets` returns `BudgetWithCategory[]`

### Frontend Layer (API → Adapters → Components)

1. **API client** (`src/lib/api.ts`):
   - Returns domain types from API responses
   - Example: `getBudgets()` returns `ApiResponse<BudgetWithCategory[]>`

2. **UI Adapters** (colocated with features, e.g., `src/app/me/budgets/budget-adapters.ts`):
   - Convert domain types to UI types
   - Compute derived values (progress, remaining, etc.)
   - Handle display formatting
   - Example: `mapBudgetToBudgetRow()` converts `BudgetWithCategory` → `BudgetRow`

3. **Components**:
   - Query for domain types via API client
   - Immediately transform to UI types using adapters
   - Use UI types for rendering and filtering

## Example: Budgets Feature

### Backend Flow

```typescript
// 1. DB Query (queries.ts)
export async function getBudgetsDB(hubId: string) {
  // Returns BudgetWithCategory[]
  return { success: true, data: budgets };
}

// 2. Service (services/budget.ts)
export async function getBudgets(): Promise<BudgetResponse<BudgetWithCategory[]>> {
  const res = await getBudgetsDB(hubId);
  // Normalize, but don't compute UI fields
  return { success: true, data: res.data };
}

// 3. API Route (api/me/budgets/route.ts)
export async function GET(request: Request) {
  const budgets = await getBudgets();
  // Forward domain type unchanged
  return apiSuccess({ data: budgets.data });
}
```

### Frontend Flow

```typescript
// 1. API Client (lib/api.ts)
export async function getBudgets(hubId: string) {
  const response = await apiInstance.get(`/api/me/budgets`, { searchParams: { hub: hubId } });
  return response.json() as ApiResponse<BudgetWithCategory[]>;
}

// 2. Adapter (app/me/budgets/budget-adapters.ts)
export function mapBudgetToBudgetRow(budget: BudgetWithCategory): BudgetRow {
  const allocated = Number(budget.allocatedAmount ?? 0);
  const spent = Number(budget.spentAmount ?? 0);
  return {
    id: budget.id,
    category: budget.categoryName ?? "Uncategorized",
    allocated,
    spent,
    remaining: allocated - spent,
    progress: allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0,
  };
}

// 3. Component (app/me/budgets/_components/data-table.tsx)
const { data: domainBudgets } = useQuery<BudgetWithCategory[]>({
  queryFn: () => getBudgets(hubId),
});

const budgets = useMemo(() => {
  if (!domainBudgets) return undefined;
  return mapBudgetsToRows(domainBudgets);
}, [domainBudgets]);
```

## Rules and Best Practices

### ✅ DO

- **Derive types from schema**: Always use `InferSelectModel` for table types
- **Use domain types in services/APIs**: Services and API routes should return domain types
- **Create adapters for UI transformation**: Use colocated adapters to convert domain → UI types
- **Use utility types**: Prefer `Pick`, `Omit`, `Partial` over redefining structures
- **Keep adapters close to consumers**: Place adapters in the same folder as the feature

### ❌ DON'T

- **Redefine core types**: Never create a new `Budget` type from scratch
- **Return UI types from services**: Services should return domain types only
- **Compute UI fields in backend**: Leave progress, formatting, etc. to adapters
- **Modify API routes for UI needs**: API routes should forward domain types unchanged
- **Mix domain and UI concerns**: Keep domain types free of UI-specific fields

## Migration Strategy

When refactoring existing features:

1. **Add domain types**: Create schema-derived types and domain view models
2. **Refactor backend**: Update DB queries, services, and API routes to return domain types
3. **Create adapters**: Add UI adapters colocated with the feature
4. **Update components**: Modify components to use adapters for transformation
5. **Test thoroughly**: Verify behavior remains identical after refactoring

## File Locations

- **Schema types**: `src/db/schema.ts`
- **Domain types**: `src/lib/types/domain-types.ts`
- **UI types**: `src/lib/types/ui-types.ts`
- **Backward compatibility**: `src/lib/types/row-types.ts` (re-exports from `ui-types.ts`)
- **Adapters**: Colocated with features (e.g., `src/app/me/budgets/budget-adapters.ts`)

## Implemented Features

The SSOT and adapter pattern has been applied to all major features:

### ✅ Accounts
- **Domain type**: `FinancialAccount` (from schema)
- **UI type**: `AccountRow` (with `formattedBalance`)
- **Adapter**: `src/app/me/accounts/account-adapters.ts`
- **DB query**: Returns full `FinancialAccount[]`
- **Service**: Returns `FinancialAccount[]` without formatting

### ✅ Transactions
- **Domain type**: `TransactionWithDetails` (transaction + category + account info)
- **UI type**: `TransactionRow` (with formatted dates and `isRecurring`)
- **Adapter**: `src/app/me/transactions/transaction-adapters.ts`
- **DB query**: Returns full joined `TransactionWithDetails[]`
- **Service**: Returns `TransactionWithDetails[]` without date formatting

### ✅ Saving Goals
- **Domain type**: `SavingGoal` (from schema)
- **UI type**: `SavingGoalRow` (with computed `value` progress and `remaining`)
- **Adapter**: `src/app/me/saving-goals/saving-goal-adapters.ts`
- **DB query**: Returns full `SavingGoal[]` without progress computation
- **Service**: Returns `SavingGoal[]` without UI calculations

### ✅ Budgets
- **Domain type**: `BudgetWithCategory` (budget + category name)
- **UI type**: `BudgetRow` (with computed `remaining` and `progress`)
- **Adapter**: `src/app/me/budgets/budget-adapters.ts`
- **DB query**: Returns full `BudgetWithCategory[]`
- **Service**: Returns `BudgetWithCategory[]` without UI calculations

### ✅ Reports
- Reports use domain types from transactions and other entities
- All report components use adapters to transform domain data for display

Each feature follows the same pattern: domain types in backend, adapters for UI transformation, components using adapters.
