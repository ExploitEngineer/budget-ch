/**
 * Budget UI Adapters
 * 
 * Converts canonical domain types (BudgetWithCategory) into UI-specific types (BudgetRow).
 * These adapters handle:
 * - Field name mapping (allocatedAmount -> allocated)
 * - Computed values (remaining, progress)
 * - Display formatting (category name fallbacks)
 * 
 * Adapters are colocated with the budgets feature for easy discovery and maintenance.
 */

import type { BudgetWithCategory } from "@/lib/types/domain-types";
import type { BudgetRow } from "@/lib/types/ui-types";

/**
 * Maps a single BudgetWithCategory domain object to BudgetRow UI type
 * Computes remaining and progress fields for display
 */
export function mapBudgetToBudgetRow(budget: BudgetWithCategory): BudgetRow {
  const baseAllocated = budget.allocatedAmount !== null ? Number(budget.allocatedAmount) : null;
  const carriedOver = budget.carriedOverAmount ? Number(budget.carriedOverAmount) : 0;

  // Effective allocated = base + carry over
  // Only apply carry over if base allocated is set (budgeted)
  const allocated = baseAllocated !== null ? baseAllocated + carriedOver : null;

  const ist = budget.spentAmount !== null ? Number(budget.spentAmount) : 0; // Initial stored spent amount
  const spent = Number(budget.calculatedSpentAmount ?? 0); // Calculated from transactions

  const totalSpent = ist + spent;
  const remaining = allocated !== null ? allocated - totalSpent : 0;
  const progress =
    allocated !== null && allocated > 0 ? Math.min((totalSpent / allocated) * 100, 100) : 0;

  return {
    id: budget.id,
    category: budget.categoryName ?? "Uncategorized",
    allocated,
    ist,
    spent,
    carriedOver: carriedOver !== 0 ? carriedOver : null,
    remaining,
    progress,
    warningThreshold: budget.warningPercentage ?? null,
    colorMarker: budget.markerColor ?? null,
    month: budget.month,
    year: budget.year,
  };
}

/**
 * Maps an array of BudgetWithCategory domain objects to BudgetRow[] UI types
 */
export function mapBudgetsToRows(
  budgets: BudgetWithCategory[],
): BudgetRow[] {
  return budgets.map(mapBudgetToBudgetRow);
}
