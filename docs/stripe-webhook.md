# Stripe Webhook Flow

This document explains how the `/api/webhooks/stripe/route.ts` handler interfaces with Stripe events and the supporting helpers in `src/lib/services/subscription.ts`. The goal is to keep the sync logic lean, focused on a single `subscriptions` record per user, and ensure every relevant lifecycle event is handled reliably.

## Event Handling Summary

| Event | Purpose | Action |
| --- | --- | --- |
| `invoice.created` | Keeps billing periods accurate and ensures manual renewals/recurring charges update the `currentPeriodStart` / `currentPeriodEnd` window. | Calls `refreshSubscriptionPeriodFromInvoice` which looks up the local subscription by Stripe subscription ID and overwrites the period fields if the invoice includes them. If the invoice lines do not include a period or there is no matching subscription, the handler logs and returns successfully without updating anything. |
| `checkout.session.completed` | Surface-level acknowledgement so we can track when the Checkout session finished. No database writes occur; the route simply echoes a success message (with the optional user metadata for tracing). | Returns a `200` payload such as `Checkout session completed for <userId>`. |
| `customer.subscription.created` / `updated` | Covers the full subscription lifecycle, including new purchases, renewals (created events may fire again depending on Stripe), tier changes (upgrades/downgrades), and cancellations that are still represented by a Stripe subscription. | These events call `handleSubscriptionLifecycleEvent`, which fetches the user by `stripeCustomerId` and passes the Stripe object to `syncStripeSubscription`. This helper either creates or updates the single subscription record so there is never more than one row per user, regardless of how many times Stripe emits the event. |
| `customer.subscription.deleted` | Fires when Stripe considers the subscription fully terminated (period ended or manually deleted from the dashboard). | Handled by `handleSubscriptionDeleted`, which uses the Stripe subscription ID to delete the local row so the absence of a record becomes the canonical “free plan” state. |

The shared `handleSubscriptionLifecycleEvent` prevents conflicting updates because it serializes every customer subscription event through the same code path, and `syncStripeSubscription` is smart enough to detect existing versus new records. When Stripe fires `customer.subscription.deleted` we now delete the local row, so a missing record becomes the canonical free-plan state while the webhook still preserves the latest cancel metadata before removal.

## `syncStripeSubscription` (src/lib/services/subscription.ts)

1. Builds a normalized payload using `buildSubscriptionPayload`:
   - Reads the first `items.data[0]` price to determine `stripePriceId`.
   - Maps the lookup key to one of the in-app plans (`individual`/`family`) via `resolvePlanFromLookupKey`.
   - Normalizes the Stripe `status` against the `subscriptionStatusValues` enum and extracts timestamp boundaries from either the top-level subscription or the nested price item.
   - Extracts the Stripe customer ID even if the object is expanded.

2. If the payload is malformed (missing lookup key, plan, status, or period timestamps), the function throws before touching the database.

3. It looks up the existing subscription by `userId`:
   - If a record exists, it updates `stripeSubscriptionId`, `stripePriceId`, `subscriptionPlan`, `status`, the period timestamps, and the cancellation flags via `updateSubscriptionRecord`.
   - If not, it inserts a new row via `createSubscriptionRecord`.

4. This approach guarantees there is exactly one subscription per user (the schema enforces `userId` uniqueness) and that each Stripe event overwrites the canonical state.

## `refreshSubscriptionPeriodFromInvoice`

1. When Stripe emits `invoice.created`, the function:
   - Extracts the Stripe subscription ID (whether it’s a string or expanded object).
   - Reads the billing period from the first invoice line.
   - Looks up the subscription row using `getSubscriptionByStripeSubscriptionId`.
   - Updates `currentPeriodStart` and `currentPeriodEnd` only if those fields are present on the invoice line.

2. The function returns the updated subscription when a change occurs, `null` otherwise, so the webhook handler can reply with a successful status while documenting whether anything actually changed.

## Why Events Don’t Conflict

- `invoice.created` handles only billing window refreshes and does not mutate plan/status fields.
- All subscription lifecycle mutations funnel through `syncStripeSubscription`, so creation, upgrades, downgrades, cancels, and renewals all go through the same “upsert-once” logic.
- There is no branching logic per Stripe status; the webhook relies on Stripe’s canonical state and simply mirrors it into the `subscriptions` table.
- Since `checkout.session.completed` is a no-op on the database, it cannot conflict with the subscription handlers.
- When Stripe emits `customer.subscription.deleted` we delete the row, so downstream logic must treat a missing subscription as the free plan instead of assuming yesterday’s data still exists.

## Deployment Notes

- Ensure `STRIPE_WEBHOOK_SECRET` is set when deploying so signature verification works.
- After modifying the schema, run `pnpm db:push` so the `subscriptions` table and enums are applied.
- Any downstream code that reads a user’s subscription now needs to treat a missing record as the free tier rather than expecting Stripe metadata to exist.

