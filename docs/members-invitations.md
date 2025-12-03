# Members & Invitations

The `MembersInvitations` component under `/src/app/me/settings/_components` now surfaces every hub member and invitation inside two dedicated tables while keeping the invite form intact.

## Fetch flow

- The component calls `getHubMembers` and `getHubInvitations` in parallel when the `hubId` prop changes.
- Send invitation requests still go through `sendHubInvitation` and refresh the invitation list once the call succeeds.

## Tables

- **Hub Members**: renders `name`, `email`, `role`, and `joined` columns using `@tanstack/react-table`. When no members are returned, a localized empty message replaces the table.
- **Hub Invitations**: renders `email`, `role`, `status` (accepted vs pending), and `expires` columns. Status badges reuse the shared `Badge` component and the dates are formatted with `date-fns`.
- Both tables sit in their own cards beneath the invite form so users can clearly see who is already in the hub and which invitations are still outstanding.

## Translations

All strings for this section live under the `main-dashboard.settings-page.members-invitations-section` namespace (see `messages/en.json`, `de.json`, `fr.json`, `it.json`). The translations cover:

- The main badge (`badge`), plan warning messages (`plan-warning.free` / `plan-warning.individual`), and button labels (`buttons.*`).
- Table headings, empty states, and statuses for both member and invitation tables.

If you add another language, extend this namespace with the same keys to keep the UI consistent.

## Testing

1. Run the app, navigate to `/me/settings`, and confirm both tables load after the `Members & Invitations` card renders.
2. Send an invitation and watch for the invitation row to appear with the right status and expiry date.
3. Switch locales to verify the new strings appear correctly in each supported language.

