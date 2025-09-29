import SidebarHeader from "@/components/sidebar-header";
import { BudgetCardsSection } from "./_components/budget-cards-section";
import { BarChartSection } from "./_components/bar-chart-section";
import { BudgetProgressSection } from "./_components/budget-progress-section";
import { WarningSection } from "./_components/warning-section";
import { BudgetHealthSection } from "./_components/budget-health-section";

export default function Dashboard() {
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <BudgetCardsSection />
        <BarChartSection />
        <BudgetProgressSection />
        <WarningSection />
        <BudgetHealthSection />
      </div>
    </section>
  );
}
