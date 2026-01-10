# Admin Dashboard

The Admin Dashboard provides BudgetHub platform administrators (`admin` users) with comprehensive user management, audit logging, and compliance oversight capabilities.

## Access Control

- Only users with `role: "admin"` can access the admin dashboard
- The admin layout (`/src/app/admin/layout.tsx`) performs server-side authentication checks
- Banned users are redirected to the main dashboard even if they have admin privileges
- A conditional "Admin Dashboard" link appears in the main navigation sidebar for root admins

## Architecture Overview

### Database Schema

The admin dashboard relies on three main database constructs added to `src/db/schema.ts`:

1. **`users.banned`**: Boolean column to block user access (using Better Auth admin plugin)
2. **`users.banReason`**: Text column for the reason a user was banned
3. **`users.banExpires`**: Timestamp for when the ban expires (optional)
4. **`adminInvitations`**: Table for admin-initiated user invitations with optional subscription grants
5. **`adminAuditLogs`**: Table tracking all administrative actions with references and metadata

### API Routes

All routes are protected by `requireRootAdmin()` middleware from `src/lib/services/admin-auth.ts`.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/kpis` | GET | Dashboard KPIs (MRR, subscriptions, users) |
| `/api/admin/users` | GET | Paginated user list with search |
| `/api/admin/users/[userId]` | GET, DELETE | Get user details / Delete permanently |
| `/api/admin/users/[userId]/lock` | POST | Ban user account (using Better Auth admin plugin) |
| `/api/admin/users/[userId]/unlock` | POST | Unban user account (using Better Auth admin plugin) |
| `/api/admin/users/[userId]/anonymize` | POST | GDPR-compliant anonymization |
| `/api/admin/users/[userId]/export` | GET | Export user data (GDPR) |
| `/api/admin/invitations` | GET, POST | List/create admin invitations |
| `/api/admin/audit-logs` | GET | Paginated audit logs with filters |
| `/api/admin/audit-logs/export` | GET | CSV export of audit logs |

### Services

Located in `src/lib/services/`:

- **`admin-auth.ts`**: Authentication helpers (`requireRootAdmin`, `isRootAdmin`, `getUserRole`)
- **`admin-user.ts`**: User management operations (ban/unban via Better Auth, anonymize, delete, export)
- **`admin-invitation.ts`**: Invitation creation, acceptance, and listing
- **`admin-subscription-grant.ts`**: Grant Stripe subscriptions without payment
- **`admin-audit.ts`**: Audit log retrieval and CSV export
- **`admin-export.ts`**: GDPR export wrapper for admin context

## Pages

### Overview (`/admin`)

Displays key performance indicators:
- **MRR**: Monthly Recurring Revenue with month-over-month comparison
- **Active Subscriptions**: Breakdown by Individual/Family plans
- **Active Users**: Total count with blocked user indicator

Also shows hardcoded system status information (region, encryption, logs, storage).

### Users (`/admin/users`)

User management interface with:
- Search by email or user ID
- Paginated user table showing ID, name, email, status, plan, registration date
- User actions dropdown: Export (GDPR), Ban/Unban, Delete

**Invite Dialog**: Send invitations with:
- Email address
- Role selection (User or Administrator)
- Optional subscription grant (Individual/Family plan, 1-24 months)

**Delete Dialog**: Two options following GDPR best practices:
- **Anonymize** (recommended): Replace PII with `[Deleted (anonymized)]`, preserve data for reporting
- **Delete Permanently**: Complete cascade deletion of all user data

### Audit (`/admin/audit`)

Audit log viewer with:
- Search by user ID or email
- Filter by action type
- Paginated log table showing timestamp, action, affected user, admin, reference
- CSV export for compliance reporting

Tracked action types:
- `user_locked`, `user_unlocked`
- `user_deleted`, `user_anonymized`
- `user_exported`
- `invitation_created`, `invitation_accepted`
- `subscription_granted`

### Compliance (`/admin/compliance`)

Static compliance information page covering:
- Data principle (Privacy by Design)
- Cloud storage (EU-only, Frankfurt)
- Tracking policy (no profiling, no ads)
- Data subject rights (export, blocking, deletion)
- Admin access controls
- Security measures (2FA, session timeout)
- Link to privacy policy

## Accept Admin Invitation Flow

The `/accept-admin-invitation` page handles the complete invitation acceptance flow:

1. **Token Validation**: Checks if token exists and is valid
2. **Authentication Check**: User must be logged in
3. **Email Match**: Logged-in user's email must match invitation email
4. **Expiry Check**: Invitation must not be expired (14-day validity)
5. **Already Accepted**: Prevents duplicate acceptance

On successful acceptance:
- User role is updated if invitation grants admin privileges
- Stripe subscription is created if subscription grant was included
- Audit log entry is created
- User is redirected to dashboard

## Translations

All admin strings are namespaced under `admin` in the message files:

- `admin.sidebar.*` - Navigation labels
- `admin.overview.*` - Dashboard KPIs and system status
- `admin.users.*` - User management, table columns, actions, dialogs
- `admin.audit.*` - Audit logs, action labels, export
- `admin.compliance.*` - Compliance information
- `admin.accept-invitation.*` - Invitation acceptance flow messages

Translations are available in English, German, French, and Italian.

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              # Admin layout with auth check
│   │   ├── page.tsx                # Overview page
│   │   ├── audit/
│   │   │   └── page.tsx            # Audit logs page
│   │   ├── compliance/
│   │   │   └── page.tsx            # Compliance info page
│   │   └── users/
│   │       ├── page.tsx            # Users management page
│   │       └── _components/
│   │           ├── users-table.tsx
│   │           ├── user-actions-menu.tsx
│   │           ├── invite-dialog.tsx
│   │           └── delete-dialog.tsx
│   ├── accept-admin-invitation/
│   │   └── page.tsx                # Invitation acceptance page
│   └── api/admin/
│       ├── kpis/route.ts
│       ├── users/route.ts
│       ├── users/[userId]/route.ts
│       ├── users/[userId]/lock/route.ts
│       ├── users/[userId]/unlock/route.ts
│       ├── users/[userId]/anonymize/route.ts
│       ├── users/[userId]/export/route.ts
│       ├── invitations/route.ts
│       ├── audit-logs/route.ts
│       └── audit-logs/export/route.ts
├── components/
│   └── admin-sidebar.tsx           # Admin navigation sidebar
├── db/
│   ├── schema.ts                   # DB schema with admin tables
│   └── admin-queries.ts            # Admin-specific DB queries
└── lib/services/
    ├── admin-auth.ts
    ├── admin-user.ts
    ├── admin-invitation.ts
    ├── admin-subscription-grant.ts
    ├── admin-audit.ts
    └── admin-export.ts
```

## Testing

1. **Access Control**:
   - Log in as a regular user and verify `/admin` redirects to `/me/dashboard`
   - Log in as `admin` and verify admin dashboard is accessible
   - Verify "Admin Dashboard" link appears in sidebar only for admins

2. **User Management**:
   - Search for users by email and ID
   - Ban/unban a user and verify they can/cannot log in
   - Export user data and verify JSON structure
   - Anonymize a user and verify PII is replaced
   - Delete a user and verify cascade deletion

3. **Invitations**:
   - Create invitation with email only
   - Create invitation with subscription grant
   - Accept invitation with correct email
   - Reject invitation with wrong email
   - Verify expired invitation handling

4. **Audit Logs**:
   - Perform admin actions and verify logs are created
   - Filter logs by action type
   - Export CSV and verify contents

5. **Translations**:
   - Switch locales and verify all admin strings display correctly
