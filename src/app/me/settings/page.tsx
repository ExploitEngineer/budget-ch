import SidebarHeader from "@/components/sidebar-header";
import { ProfileHousehold } from "./_components/profile-household";
import { PlansUpgrade } from "./_components/plans-upgrade";
import { MembersInvitations } from "./_components/members-and-invitations";
import { LocalizationAppearance } from "./_components/localization-appearance";
import { Notifications } from "./_components/notifications";
import { Security } from "./_components/security";
import { DataPrivacy } from "./_components/data-privacy";
import { BillingDetails } from "./_components/billing-details";
import { AboutSection } from "./_components/about";

export default function Help() {
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ProfileHousehold />
        <PlansUpgrade />
        <MembersInvitations />
        <LocalizationAppearance />
        <Notifications />
        <Security />
        <DataPrivacy />
        <BillingDetails />
        <AboutSection />
      </div>
    </section>
  );
}
