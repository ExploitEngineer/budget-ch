import SidebarHeader from "@/components/sidebar-header";
import { CalculationSection } from "./_components/calculations-section";
import { DataTable } from "./_components/data-table";
import { useTransactions } from "./_components/data";

export default function Transactions() {
  const { transactions } = useTransactions();
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <CalculationSection />
        <DataTable transactions={transactions} />
      </div>
    </section>
  );
}
