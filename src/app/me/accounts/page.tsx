import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import SidebarHeader from "@/components/sidebar-header";
import { ContentCardsSection } from "./_components/content-cards-section";
import { ContentDataTable } from "./_components/data-table";
import { LatestTransfers } from "./_components/latest-transfers";
import { accountKeys } from "@/lib/query-keys";
import { getFinancialAccounts } from "@/lib/services/financial-account";

interface AccountsPageProps {
  searchParams: Promise<{ hub?: string }>;
}

export default async function Content({ searchParams }: AccountsPageProps) {
  const { hub: hubId } = await searchParams;

  const queryClient = new QueryClient();
  
  if (hubId) {
    await queryClient.prefetchQuery({
      queryKey: accountKeys.list(hubId),
      queryFn: async () => {
        const res = await getFinancialAccounts();
        if (!res.status) {
          throw new Error("Failed to fetch accounts");
        }
        return res.tableData ?? [];
      },
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
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
    </HydrationBoundary>
  );
}
