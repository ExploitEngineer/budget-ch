import SidebarHeader from "@/components/sidebar-header";
import { ProfileHousehold } from "./_components/profile-household";
import { PlansUpgrade } from "./_components/plans-upgrade";
import { CurrentSubscription } from "./_components/current-subscription";
import { MembersInvitations } from "./_components/members-and-invitations";
import { LocalizationAppearance } from "./_components/localization-appearance";
import { Notifications } from "./_components/notifications";
import { Security } from "./_components/security";
import { DataPrivacy } from "./_components/data-privacy";
// import { BillingDetails } from "./_components/billing-details";
// import { AboutSection } from "./_components/about";
import { loadStripePrices } from "@/lib/stripe";
import { getContext } from "@/lib/auth/actions";
import { headers } from "next/headers";
import type { SubscriptionDetails } from "./types";

export default async function Settings() {
  const hdrs = await headers();
  const { hubId, user, subscription, userRole } = await getContext(hdrs, false);

  const subscriptionPrices = await fetchPrices();

  const subscriptionInfo: SubscriptionDetails | null =
    subscription === null
      ? null
      : {
        plan: subscription.subscriptionPlan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelAt: subscription.cancelAt ? new Date(subscription.cancelAt).toISOString() : null,
      };

  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ProfileHousehold user={user} subscription={subscription} />
        {subscriptionInfo && (
          <CurrentSubscription subscription={subscriptionInfo} />
        )}
        <PlansUpgrade
          subscriptionPrices={subscriptionPrices}
          user={user}
          subscription={subscriptionInfo}
        />
        <MembersInvitations hubId={hubId} userRole={userRole} />
        <LocalizationAppearance />
        <Notifications
          notificationsEnabled={user.notificationsEnabled}
          reportFrequency={user.reportFrequency}
        />
        <Security />
        <DataPrivacy />
        {/* <BillingDetails /> */}
        {/* <AboutSection /> */}
      </div>
    </section>
  );
}

async function fetchPrices() {
  "use server";
  const result = await loadStripePrices();
  if (result.success && result.prices) {
    const pricesData = result.prices.data;
    const prices: Record<string, number> = {};
    for (const price of pricesData) {
      if (price.lookup_key && price.unit_amount) {
        prices[price.lookup_key] = price.unit_amount / 100;
      }
    }
    return prices;
  }
  return {};
}
