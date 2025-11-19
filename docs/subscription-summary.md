# Current Subscription Card

## Purpose
The `CurrentSubscription` card lives inside `src/app/me/settings/_components/current-subscription.tsx` and surfaces the authenticated user’s active Stripe subscription details in the `/me/settings` page. It only renders when there is a paid subscription record, keeping the UI hidden for free-tier users.

## Behavior
- Shows the plan name, status, and a badge to highlight the current subscription state.
- Displays the current period start date, next renewal date, and how many days are left in the cycle (never negative).
- Provides a cancel button for the UI only; it is intentionally inert while we wire up cancellation flows later.

## Styling
- Reuses the existing `Card`/`CardHeader`/`CardContent`/`CardFooter` layout and the shared `bg-blue-background` / `dark:border-border-blue` styling present elsewhere in the settings sections.
- Dates are formatted with `date-fns` so the locale-aware formatting and spacing stays consistent with other cards.

## Internationalization
- The component uses `main-dashboard.settings-page.subscription-section` translations, so the same key was added to `messages/en.json`, `messages/de.json`, `messages/fr.json`, and `messages/it.json`. This includes labels for the title, plan, status, start/renewal/days remaining, and the cancel button.

## Usage
When the server detects an existing subscription, the `/me/settings/page.tsx` file converts the `Date` fields into ISO strings and renders `<CurrentSubscription />` between the `PlansUpgrade` card and the other settings sections.

