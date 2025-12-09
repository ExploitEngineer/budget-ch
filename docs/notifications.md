# Notification System

## Overview

The notification system provides a centralized way to send notifications to users via email and web push channels. It supports both event-driven notifications (triggered by user actions) and scheduled notifications (via AWS Lambda cron jobs).

## Architecture

### Components

1. **Database Schema** (`src/db/schema.ts`)
   - `notifications` table stores all notifications
   - Supports multiple notification types (info, success, error, warning)
   - Tracks read status and email delivery status

2. **Notification Configuration** (`src/lib/notifications/config.ts`)
   - Preconfigured notification types (budget thresholds, subscription expiry)
   - Factory pattern for generating notification configs

3. **Centralized System** (`src/lib/notifications/index.ts`)
   - Main `sendNotification()` function
   - Handles DB insert and email sending (fire-and-forget)

4. **Email Notifications** (`src/lib/notifications/email.ts`)
   - Fire-and-forget email sending
   - Updates `emailSent` flag after successful send

5. **Scheduled Notifications** (`src/lib/notifications/scheduled.ts`)
   - Checks subscription expiry (3 days, 1 day, expired)
   - Called by Lambda cron job daily at 9 AM UTC

6. **API Routes** (`src/app/api/me/notifications/`)
   - `GET /api/me/notifications` - Fetch notifications
   - `PATCH /api/me/notifications` - Mark as read
   - `GET /api/me/notifications/count` - Get unread count

7. **Client Hooks** (`src/hooks/use-notifications.ts`)
   - React Query hooks for fetching notifications
   - Polling support (default: 30 seconds)
   - Mutations for marking as read

8. **UI Component** (`src/components/notifications-bell.tsx`)
   - Notification bell with badge showing unread count
   - Dropdown menu displaying recent notifications

## Adding New Notification Types

### Step 1: Add Type Constant

Add a new constant to `src/lib/notifications/types.ts`:

```typescript
export const MY_NEW_NOTIFICATION = "MY_NEW_NOTIFICATION";
```

### Step 2: Add Configuration

Add the notification config to `src/lib/notifications/config.ts`:

```typescript
MY_NEW_NOTIFICATION: (metadata?: NotificationMetadata) => {
  return {
    type: "info", // or "success", "error", "warning"
    title: "My Notification Title",
    message: "My notification message",
    channel: "both", // or "email", "web"
    metadata,
  };
},
```

### Step 3: Use in Code

Call `sendNotification()` with the type key:

```typescript
import { sendNotification } from "@/lib/notifications";
import { MY_NEW_NOTIFICATION } from "@/lib/notifications/types";

await sendNotification({
  typeKey: MY_NEW_NOTIFICATION,
  hubId: "hub-id",
  userId: "user-id",
  metadata: {
    // optional metadata
  },
});
```

## Scheduled Notifications

Scheduled notifications run via AWS Lambda function configured in `sst.config.ts`. The function runs daily at 9 AM UTC and checks for:

- Subscriptions expiring in 3 days
- Subscriptions expiring in 1 day
- Expired subscriptions

To modify the schedule, update the cron expression in `sst.config.ts`:

```typescript
schedule: "cron(0 9 * * ? *)", // Daily at 9 AM UTC
```

## Budget Threshold Notifications

Budget threshold notifications are automatically triggered when:

1. An expense transaction is created
2. The transaction has a category
3. A budget exists for that category
4. The budget exceeds 80% or 100% threshold

The system prevents duplicate notifications by checking if a notification was already sent for the same budget within the last 24 hours.

## Testing

### Test Budget Threshold Notification

1. Create a budget for a category with an allocated amount (e.g., 100 CHF)
2. Create expense transactions totaling 80 CHF or more for that category
3. Check notifications - you should see a warning notification at 80%
4. Create more expenses to exceed 100 CHF
5. Check notifications - you should see an error notification at 100%

### Test Scheduled Notifications

1. Create a subscription with `currentPeriodEnd` set to 3 days from now
2. Wait for the Lambda function to run (or trigger it manually)
3. Check notifications - you should see a subscription expiring notification

### Test Email Notifications

1. Ensure SMTP configuration is set in environment variables
2. Send a notification with `channel: "email"` or `channel: "both"`
3. Check the user's email inbox
4. Verify `emailSent` flag is updated in the database

## API Endpoints

### GET /api/me/notifications

Query parameters:
- `hub` (required) - Hub ID
- `unreadOnly` (optional) - Filter to unread only
- `limit` (optional) - Limit number of results

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "hubId": "uuid",
      "userId": "string",
      "type": "info" | "success" | "error" | "warning",
      "title": "string",
      "message": "string",
      "isRead": false,
      "createdAt": "timestamp",
      "metadata": {}
    }
  ]
}
```

### PATCH /api/me/notifications

Query parameters:
- `hub` (required) - Hub ID

Body:
```json
{
  "notificationId": "uuid", // Mark single notification as read
  // OR
  "markAll": true // Mark all notifications as read
}
```

### GET /api/me/notifications/count

Query parameters:
- `hub` (required) - Hub ID

Response:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

## Database Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  html TEXT,
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  metadata JSONB,
  channel notification_channel NOT NULL DEFAULT 'both',
  email_sent BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX notifications_hubId_idx ON notifications(hub_id);
CREATE INDEX notifications_userId_idx ON notifications(user_id);
CREATE INDEX notifications_isRead_idx ON notifications(is_read);
CREATE INDEX notifications_createdAt_idx ON notifications(created_at);
```

## Environment Variables

Required for email notifications:
- `SMTP_HOST` - SMTP server hostname
- `MAIL_USER` - SMTP username
- `MAIL_PASS` - SMTP password

Required for Lambda function:
- `DATABASE_URL` - Database connection string
- SMTP configuration (same as above)

## Future Enhancements

- WebSocket or Server-Sent Events for real-time updates (currently uses polling)
- Notification preferences table (user can disable certain notification types)
- Cleanup job for old read notifications
- Notification templates with dynamic content
- Push notifications for mobile apps
