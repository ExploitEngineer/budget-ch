## Delete All Transactions

- **Query layer**: introduced `deleteAllTransactionsDB` which only removes rows from the `transactions` table for the current hub and returns a success/failure payload.
- **Service layer**: added `deleteAllTransactions` to fetch the request context, enforce admin access, and call the new query so that deleting every transaction no longer touches categories.
- **UI**: the transactions data table now exposes a red **Delete All** button guarded by a confirmation dialog (`main-dashboard.transactions-page.data-table.confirmation`). The dialog reuses the mutation that invalidates transaction/account queries after deletion and surfaces toasts for success/failure.

### Testing

1. Open the transactions page, trigger **Delete All**, and confirm the dialog.
2. Assert that only the transactions are removed (categories remain) and the dialog/toast close when the mutation succeeds.
