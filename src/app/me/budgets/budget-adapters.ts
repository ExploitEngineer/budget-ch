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
  const allocated = Number(budget.allocatedAmount ?? 0);
  const ist = Number(budget.spentAmount ?? 0); // Initial stored spent amount
  const spent = Number(budget.calculatedSpentAmount ?? 0); // Calculated from transactions
  const remaining = allocated - spent; // Use calculated spent for remaining
  const progress =
    allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0; // Use calculated spent for progress

  return {
    id: budget.id,
    category: budget.categoryName ?? "Uncategorized",
    allocated,
    ist,
    spent,
    remaining,
    progress,
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
