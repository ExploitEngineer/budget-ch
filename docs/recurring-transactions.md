# Recurring Transactions - Automatic Generation

## Overview

The recurring transactions feature automatically generates transactions from user-defined templates on a daily schedule. This eliminates the need for users to manually create repetitive transactions like rent, subscriptions, or regular bills.

## How It Works

### User Workflow

1. **Create Template**: User creates a recurring transaction template via the dashboard
   - Set transaction details (amount, category, account, etc.)
   - Define frequency (e.g., every 30 days)
   - Set start date and optional end date
   - Mark as "active" or "inactive"

2. **Automatic Generation**: System runs daily at 2 AM UTC
   - Checks all active templates across all users
   - Generates transactions for templates that are due
   - Updates account balances automatically
   - Sends in-app notifications

3. **View Results**: Users see generated transactions
   - Transactions appear in the transactions list
   - Marked with recurring template link
   - Can be filtered using "Recurring" filter
   - Notifications show success or failure

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS EventBridge                          │
│              (Cron: Daily at 2 AM UTC)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Lambda Function                                │
│    recurring-transactions-generator.handler()               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Service Layer                                       │
│    generateRecurringTransactions()                          │
│    ├─ Fetch active templates                               │
│    ├─ Check if each template is due                        │
│    ├─ Create transaction (reuses existing service)         │
│    ├─ Update template status                               │
│    └─ Send notifications                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Database Layer                                      │
│    ├─ recurring_transaction_templates (read)               │
│    ├─ transactions (insert)                                │
│    ├─ financial_accounts (update balances)                 │
│    └─ notifications (insert)                               │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### New Fields in `recurring_transaction_templates`

```sql
-- Tracking fields for generation status
lastGeneratedDate    TIMESTAMP WITH TIME ZONE  -- When last transaction was created
lastFailedDate       TIMESTAMP WITH TIME ZONE  -- When last failure occurred
failureReason        TEXT                      -- Error message from last failure
consecutiveFailures  INTEGER DEFAULT 0         -- Count of consecutive failures
```

### Updated `transactions` Table

```sql
-- Link to recurring template
recurringTemplateId  UUID REFERENCES recurring_transaction_templates(id)
```

## Key Components

### 1. Database Queries (`src/db/queries.ts`)

#### `getActiveRecurringTemplatesDB()`
Fetches all active templates that are within their date range:
- Status = "active"
- Start date ≤ today
- End date is null OR ≥ today

#### `updateTemplateLastGeneratedDB(templateId)`
Marks template as successfully generated:
- Sets `lastGeneratedDate` to current timestamp
- Resets `consecutiveFailures` to 0

#### `markTemplateFailureDB(templateId, reason)`
Records failure information:
- Sets `lastFailedDate` to current timestamp
- Stores `failureReason`
- Increments `consecutiveFailures`

#### `createTransactionDB(..., recurringTemplateId)`
Updated to accept optional `recurringTemplateId` parameter to link generated transactions to their templates.

### 2. Service Layer (`src/lib/services/transaction.ts`)

#### `generateRecurringTransactions()`
Main orchestration function:

```typescript
1. Fetch all active templates
2. For each template:
   a. Check if due using isTemplateDue()
   b. If not due → skip
   c. If due → create transaction via createTransaction()
   d. If success → update lastGeneratedDate
   e. If failure → mark failure + send notification
3. Return stats: {success, failed, skipped, errors}
```

#### `isTemplateDue(template, today)`
Smart due-date checking:

```typescript
if (never generated before) {
  return startDate <= today
} else {
  nextDueDate = lastGeneratedDate + frequencyDays
  return nextDueDate <= today
}
```

#### `createTransaction(..., userIdArg)`
Updated to support system operations:
- Added `userIdArg` parameter
- When `userIdArg` is provided → bypasses `headers()` call and auth checks
- Allows Lambda/cron context to create transactions without Next.js request context

### 3. Lambda Function (`src/functions/recurring-transactions-generator.ts`)

Simple handler that:
1. Calls `generateRecurringTransactions()`
2. Logs results with emojis for easy CloudWatch monitoring
3. Returns HTTP-style response with stats

### 4. Infrastructure (`sst.config.ts`)

Cron job configuration:
```typescript
new sst.aws.Cron("RecurringTransactionGeneration", {
  schedule: "cron(0 2 * * ? *)", // Daily at 2 AM UTC
  function: {
    handler: "src/functions/recurring-transactions-generator.handler",
    environment: {
      DATABASE_URL: process.env.DATABASE_URL!,
    },
  },
});
```

## Edge Cases Handled

### 1. Insufficient Funds
**Scenario**: Account doesn't have enough balance for expense/transfer

**Behavior**:
- Transaction creation fails
- Template marked with failure reason
- User receives warning notification
- Template remains active → will retry next day

### 2. Deleted Account
**Scenario**: Source or destination account was deleted

**Behavior**:
- Transaction creation fails
- Template marked with failure reason
- User receives warning notification
- Template remains active (user should manually deactivate)

### 3. Deleted Category
**Scenario**: Category was deleted

**Behavior**:
- Transaction created with `null` category
- Success notification sent
- User can edit transaction to assign new category

### 4. Duplicate Prevention
**Scenario**: Cron runs multiple times in same day

**Behavior**:
- `isTemplateDue()` checks `lastGeneratedDate`
- If already generated today → skips
- Idempotent operation

### 5. Timezone Handling
**Behavior**:
- All dates stored in UTC
- Cron runs at 2 AM UTC
- Date comparisons use `startOfDay()` for consistency

## Notifications

### Success Notification
- **Type**: `success` (green)
- **Title**: "Recurring Transaction Created"
- **Message**: Shows transaction name and amount
- **Channel**: `web` (in-app only, no email)

### Failure Notification
- **Type**: `warning` (yellow)
- **Title**: "Recurring Transaction Failed"
- **Message**: Shows transaction name and error reason
- **Channel**: `web` (in-app only, no email)

## Testing

### Manual Testing

1. **Create Test Template**:
   ```typescript
   - Amount: CHF 100
   - Frequency: 1 day
   - Start Date: Today
   - Status: Active
   ```

2. **Trigger Lambda Manually**:
   ```bash
   pnpm tsx scripts/trigger-recurring-generator.ts
   ```

3. **Verify Results**:
   - Check CloudWatch logs for success message
   - Verify transaction created in database
   - Check account balance updated
   - Confirm notification sent

### Production Monitoring

**CloudWatch Logs** - Look for:
```
✅ Recurring transaction generation completed. Success: X, Failed: Y, Skipped: Z
```

**Database Queries**:
```sql
-- Check generated transactions
SELECT * FROM transactions 
WHERE recurring_template_id IS NOT NULL 
ORDER BY created_at DESC;

-- Check template status
SELECT id, source, last_generated_date, last_failed_date, failure_reason
FROM recurring_transaction_templates 
WHERE status = 'active';
```

## Future Enhancements

### Auto-Pause (Not Implemented)
After N consecutive failures, automatically set template status to "inactive" and notify user.

**Implementation**:
```typescript
if (consecutiveFailures >= 3) {
  await updateTemplateStatus(templateId, "inactive");
  await sendNotification({
    type: "warning",
    title: "Recurring Template Auto-Paused",
    message: "Template paused after 3 consecutive failures",
  });
}
```

### Email Notifications (Not Implemented)
Send email in addition to in-app notification.

**Implementation**:
Change `channel: "web"` to `channel: "both"` in notification calls.

### Manual Trigger (Not Implemented)
UI button to manually generate transaction from template before scheduled time.

### Generation History (Not Implemented)
Track all generated transactions per template for audit trail.

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)

### Cron Schedule
Modify in `sst.config.ts`:
```typescript
schedule: "cron(0 2 * * ? *)" // Daily at 2 AM UTC
```

Format: `cron(minute hour day month day-of-week year)`

## Troubleshooting

### Issue: Transactions not generating

**Check**:
1. Template status is "active"
2. Start date is not in future
3. End date is null or in future
4. `lastGeneratedDate` + `frequencyDays` ≤ today
5. CloudWatch logs for errors

### Issue: All templates skipped

**Reason**: Templates were already generated today

**Solution**: Wait until next day or manually update `lastGeneratedDate` in database

### Issue: Notifications not appearing

**Check**:
1. `channel` is set to "web" or "both"
2. Notification created in database
3. User is logged in to correct hub
4. No errors in CloudWatch logs

## Related Files

- **Service**: `src/lib/services/transaction.ts`
- **Queries**: `src/db/queries.ts`
- **Lambda**: `src/functions/recurring-transactions-generator.ts`
- **Schema**: `src/db/schema.ts`
- **Infrastructure**: `sst.config.ts`
- **Test Script**: `scripts/trigger-recurring-generator.ts`
