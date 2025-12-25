# Expense Reporting Logic

## Overview
The dashboard reports (Monthly Bar Chart and "Actual Spent" Card) follow a strict **"Gross Expenses"** logic.

## Calculation Rules

### Gross Expenses
*   **Definition**: The sum of all transactions with `type = 'expense'`.
*   **Inclusions**:
    *   All expenses for the selected month/period.
    *   **Uncategorized expenses** are INCLUDED.
    *   Expenses in categories without active budgets are INCLUDED.
*   **Exclusions**:
    *   **Income/Refunds**: Income transactions (even if categorized under an "Expense" category) are **IGNORED** for the total spent calculation. They do NOT reduce the total spent.
    *   **Transfers**: Transfer transactions are generally excluded from expense totals.

### Initial Spent (IST)
*   The "Actual Spent" card calculation for the Budget section does **not** include the "Initial Spent" (IST) buffer from budget templates when displaying the raw "Total Spent" for the hub. It focuses purely on actual transaction data.

## Data Sources
*   **Database**: Calculations are performed via `getHubTotalExpensesDB` in `src/db/queries.ts`.
*   **Service**: `getBudgetsAmounts` in `src/lib/services/budget.ts` aggregates this data.

## Testing
To verify the logic:
1.  Add an expense of 100 on "Category A". Total should be 100.
2.  Add an income (refund) of 50 on "Category A". Total should **remain 100** (not 50).
3.  Add an expense of 20 on a category with no budget. Total should be 120.
