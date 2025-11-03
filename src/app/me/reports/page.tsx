import SidebarHeader from "@/components/sidebar-header";
import { ReportCardsSection } from "./_components/report-cards";
import { AnalysisTable } from "./_components/analysis-table";
import { DetailedTable } from "./_components/detailed-table";
import { useReportData } from "./_components/data";

export default function Report() {
  const { tableData } = useReportData();
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ReportCardsSection />
        <AnalysisTable tableData={tableData} />
        <DetailedTable />
      </div>
    </section>
  );
}
