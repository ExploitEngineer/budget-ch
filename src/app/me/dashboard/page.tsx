import SidebarHeader from "@/components/sidebar-header";
import { BudgetCardsSection } from "./_components/budget-cards-section";
import { BarChartSection } from "./_components/bar-chart-section";
import { BudgetProgressSection } from "./_components/budget-progress-section";
import { WarningSection } from "./_components/warning-section";
import { RecentTransactionsTableSection } from "./_components/recent-transactions-table-section";
import { BudgetHealthSection } from "./_components/budget-health-section";
import { useDashboardData } from "./_components/data";

export default function Dashboard() {
  const {
    cards,
    circleProgressCards,
    progressCards,
    upComingTables,
    warningCards,
    healthCards,
    recentTransactionsTables,
  } = useDashboardData();
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <BudgetCardsSection cards={cards} />
        <BarChartSection circleProgressCards={circleProgressCards} />
        <BudgetProgressSection progressCards={progressCards} />
        <WarningSection
          warningCards={warningCards}
          upComingTables={upComingTables}
        />
        <RecentTransactionsTableSection
          recentTranasactionsTables={recentTransactionsTables}
        />
        <BudgetHealthSection cards={healthCards} />
      </div>
    </section>
  );
}
