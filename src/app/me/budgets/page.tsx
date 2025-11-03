import SidebarHeader from "@/components/sidebar-header";
import { BudgetCardsSection } from "./_components/budget-cards";
import { BudgetDataTable } from "./_components/data-table";
import { WarningSection } from "./_components/warning-section";
import { Settings } from "./_components/settings";

export default function Transactions() {
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <BudgetCardsSection />
        <BudgetDataTable />
        <WarningSection />
        <Settings />
      </div>
    </section>
  );
}
