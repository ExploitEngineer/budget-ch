import SidebarHeader from "@/components/sidebar-header";
import { SavingCardsSection } from "./_components/saving-cards-section";
import { ActiveGoalsSection } from "./_components/active-goals-section";
import { WarningSection } from "./_components/warning-section";
import { Settings } from "./_components/settings";

export default function SavingGoals() {
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <SavingCardsSection />
        <ActiveGoalsSection />
        <WarningSection />
        <Settings />
      </div>
    </section>
  );
}
