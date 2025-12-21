# Savings Goals Module Documentation

## 1. Overview
The Savings Goals module allows users to define financial targets and track their progress. It includes a "Real Auto-Allocation" system that automatically increments savings balances on a monthly basis without creating clutter in the transaction ledger.

## 2. Business Rules & Logic

### 2.1. Auto-Allocation (Backend)
The core automation logic is defined in `src/functions/savings-goal-allocation.ts`.

*   **Trigger:** Runs automatically on the **1st of every month at 01:00 UTC**.
*   **Condition:** Only processes goals where `autoAllocationEnabled` is `TRUE`.
*   **Operation:**
    *   `New Balance` = `Current Balance` + `Monthly Allocation`
*   **Constraints:**
    *   **Cap at Goal:** If `(Current + Monthly) > Goal Amount`, the balance is set exactly to `Goal Amount`. It does not overfund.
    *   **Zero Allocation:** Goals with `0` monthly allocation are skipped.
    *   **Fully Funded:** Goals already at or above 100% are skipped.
*   **Ledger Interaction:**
    *   **NO Transactions Created:** To keep the financial ledger clean, this process **only** updates the `amount_saved` column in the `saving_goals` table. It does **not** create a `Transaction` record.

### 2.2. Master Switch (Settings)
*   The "Monthly Auto-Allocation" toggle in the UI is a **Bulk Action**.
*   **Action:** `toggleHubAutoAllocation(enabled)`
*   **Effect:** Executes `UPDATE saving_goals SET auto_allocation_enabled = $enabled WHERE hub_id = $hub`.
*   **Result:** It enables or disables the automation for **ALL** goals in the current Hub simultaneously.

## 3. Architecture & Implementation

### 3.1. Database Schema (`saving_goals`)
| Column | Type | Purpose |
|Order|---|---|
| `id` | UUID | Primary Key |
| `hub_id` | UUID | Links to the user's workspace |
| `goal_amount` | Decimal | Target amount to save |
| `amount_saved` | Decimal | Current progress |
| `monthly_allocation` | Decimal | Amount added automatically each month |
| `auto_allocation_enabled` | Boolean | **Key Flag**: Determines if cron picks this up |
| `due_date` | Timestamp | Used for "Overdue" logic |

### 3.2. Infrastructure (SST)
The Cron job is defined in `sst.config.ts`:
```typescript
new sst.aws.Cron("SavingsGoalAutoAllocation", {
  schedule: "cron(0 1 1 * ? *)", // 1st of month, 01:00 UTC
  function: {
    handler: "src/functions/savings-goal-allocation.handler",
    // ...
  }
});
```

### 3.3. Frontend Logic (`/me/saving-goals`)

#### **ActiveGoalsSection** (`active-goals-section.tsx`)
*   **Sorting:**
    *   `Due`: Ascending by date (Earliest first).
    *   `Progress`: Descending by % (Highest first).
    *   `Remaining`: Descending by absolute value.
*   **Filtering (Show Overfunded):**
    *   Controlled by URL Param: `?showOverfunded=true`.
    *   If `false`, any goal with `value >= 100` is excluded from the list.
*   **State Integrity:** Uses `key={goal.id}` to ensure React preserves card state during sorting/filtering.

#### **WarningSection** (`warning-section.tsx`)
*   **Logic:** Filters goals where `DueDate < Now` AND `Progress < 100%`.
*   **UX Rule:** The "Show All" / "Hide All" toggle button is **only** visible if there are **more than 3** overdue items. Otherwise, it shows the full list by default.

## 4. How to Test Manually
Since the Cron runs monthly, a manual test script is provided for development/verification:
1.  Open Terminal.
2.  Run: `npx tsx scripts/test-auto-allocation.ts`.
3.  This script invokes the handler directly, processing allocations immediately.

---
*Last Updated: 2025-12-21*
