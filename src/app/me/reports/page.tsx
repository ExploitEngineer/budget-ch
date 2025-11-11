import SidebarHeader from "@/components/sidebar-header";
import { ReportCardsSection } from "./_components/report-cards";
import { AnalysisTable } from "./_components/analysis-table";
import { DetailedTable } from "./_components/detailed-table";

export default function Report() {
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ReportCardsSection />
        <AnalysisTable />
        <DetailedTable />
      </div>
    </section>
  );
}
