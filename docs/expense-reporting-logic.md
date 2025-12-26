# Expense Reporting Logic

## Overview
The dashboard reports (Monthly Bar Chart, Summary Cards, and Analysis Tables) follow a strict **"Gross Metrics"** logic with enhanced filtering capabilities.

## Calculation Rules

### Income & Expenses
*   **Income**: The sum of all transactions with `type = 'income'`. Transfers are explicitly EXCLUDED.
*   **Expenses**: The sum of all transactions with `type = 'expense'`. Transfers are explicitly EXCLUDED.
*   **Balance**: Calculated as `Income - Expenses`. Transfers are IGNORED.
*   **Saving Rate**: Calculated as `(Balance / Income) * 100`. Only positive income is considered.

### Date Filtering
*   All reporting components (Cards, Trend Charts, Detailed Tables) support dynamic date filtering via `startDate` and `endDate` parameters.
*   If no date range is provided, components show all-time data or default period summaries.

### Inclusions/Exclusions
*   **Uncategorized transactions** are INCLUDED in totals if they match the type.
*   **Transfers**: ALWAYS excluded from Income and Expense sums to prevent double-counting or inflating financial activity.

## Data Sources
*   **Database**: Optimized aggregations via `getReportSummaryDB`, `getMonthlyReportDB`, and `getTransactionCategoriesWithAmountsDB` in `src/db/queries.ts`.
*   **Service**: `getReportSummaryAction` in `src/lib/services/report.ts` provides a high-performance backend aggregate.
*   **Frontend**: `useReportSummary`, `useMonthlyReports`, and `useDetailedCategories` hooks (via React Query) fetch date-filtered data from `/api/me/reports/*`.

## Testing
To verify the logic:
1.  Add an expense of 100. Check report cards; total expense should increase by 100.
2.  Add a transfer of 500 between accounts. Total income and expense should **remain unchanged**.
3.  Select a date filter that excludes a specific transaction. Check if totals update accordingly.
