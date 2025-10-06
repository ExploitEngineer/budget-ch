import SidebarHeader from "@/components/sidebar-header";
import { ContentCardsSection } from "./_components/content-cards-section";
import { ContentDataTable } from "./_components/data-table";
import { LatestTransfers } from "./_components/latest-transfers";
import { useContentData } from "./_components/data";

export default function Content() {
  const { cards, tableData } = useContentData();
  return (
    <section className="flex flex-col md:block">
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ContentCardsSection cards={cards} />
        <ContentDataTable tableData={tableData} />
        <LatestTransfers />
      </div>
    </section>
  );
}
