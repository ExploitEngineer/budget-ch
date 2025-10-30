import SidebarHeader from "@/components/sidebar-header";
import { ContentCardsSection } from "./_components/content-cards-section";
import { ContentDataTable } from "./_components/data-table";
import { LatestTransfers } from "./_components/latest-transfers";

export default function Content() {
  return (
    <section className="flex flex-col md:block">
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ContentCardsSection />
        <ContentDataTable />
        <LatestTransfers />
      </div>
    </section>
  );
}
