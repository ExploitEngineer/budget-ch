# Plans Upgrade Section

## Purpose
- Surface the available subscription tiers, show the current billing interval, and keep the checkout/portal flows grouped together on `/me/settings`.

## Behavior
- Reuses the shared `Card` layout to show the free, individual, and family tiers with a toggle between monthly/yearly views.
- When the server knows about a paid subscription, the matching card gets a *current plan* badge, but the per-card action buttons disappear; only the Manage Subscription portal button remains visible, giving the user one place to upgrade/downgrade/cancel from the portal.
- When the user is on the free tier, each card’s button still initiates the appropriate `createCheckoutSession()` flow and the portal footer link stays hidden.
- A dedicated **Manage Subscription (Stripe Portal)** footer button appears whenever a subscription exists; it calls the same new server action so cancel/upgrade/downgrade options are available even if the user doesn’t click the card.

## Server actions
- `src/app/me/settings/actions.ts` exports `createStripePortalSession()`, which calls `createCustomerPortalSession()` from `src/lib/stripe/stripe-utils.ts` and returns the portal URL or an error.

## Internationalization
- The translations under `main-dashboard.settings-page.plans-upgrade-section.plans-cards` now include:
  - `current-plan-badge`
  - `manage-plan-button`
  - `errors.no-price`
  - `errors.portal-failed`

## Usage
- `/me/settings/page.tsx` now types `subscriptionInfo` as `SubscriptionDetails` (see `src/app/me/settings/types.ts`) and forwards it to both `<CurrentSubscription />` and `<PlansUpgrade />`, keeping the UI consistent for subscribed users.

