/**
 * Saving goal adapters - Transform domain types to UI types for saving goals
 * 
 * These functions convert SavingGoal (domain type) to SavingGoalRow (UI type)
 * by adding UI-specific computed values like progress percentage.
 */

import type { SavingGoal } from "@/lib/types/domain-types";
import type { SavingGoalRow } from "@/lib/types/ui-types";

/**
 * Maps a SavingGoal domain type to SavingGoalRow UI type
 * Computes progress percentage and remaining amount
 */
export function mapSavingGoalToSavingGoalRow(
  goal: SavingGoal,
): SavingGoalRow {
  const goalAmount = Number(goal.goalAmount ?? 0);
  const amountSaved = Number(goal.amountSaved ?? 0);
  const progress =
    goalAmount > 0
      ? Math.min(Math.round((amountSaved / goalAmount) * 100), 100)
      : 0;
  const remaining = goalAmount - amountSaved;

  return {
    id: goal.id,
    name: goal.name,
    goalAmount,
    amountSaved,
    monthlyAllocation: goal.monthlyAllocation ?? 0,
    financialAccountId: goal.financialAccountId ?? null,
    dueDate: goal.dueDate ?? null,
    value: progress,
    remaining,
  };
}

/**
 * Maps an array of SavingGoal domain types to SavingGoalRow UI types
 */
export function mapSavingGoalsToRows(
  goals: SavingGoal[],
): SavingGoalRow[] {
  return goals.map(mapSavingGoalToSavingGoalRow);
}
