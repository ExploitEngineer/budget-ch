import SidebarHeader from "@/components/sidebar-header";
import { useBudgetData } from "./_components/data";
import { BudgetCardsSection } from "./_components/budget-cards";

export default function Transactions() {
  const { cards } = useBudgetData();
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <BudgetCardsSection cards={cards} />
      </div>
    </section>
  );
}
