import SidebarHeader from "@/components/sidebar-header";
import { SavingCardsSection } from "./_components/saving-cards-section";
import { ActiveGoalsSection } from "./_components/active-goals-section";
import { WarningSection } from "./_components/warning-section";
import { Settings } from "./_components/settings";
import { useSavingGoalsData } from "./_components/data";

export default function SavingGoals() {
  const { cards } = useSavingGoalsData();
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <SavingCardsSection cards={cards} />
        <ActiveGoalsSection />
        <WarningSection />
        <Settings />
      </div>
    </section>
  );
}
