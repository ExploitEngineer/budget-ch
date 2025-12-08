import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import SidebarHeader from "@/components/sidebar-header";
import { ReportCardsSection } from "./_components/report-cards";
import { AnalysisTable } from "./_components/analysis-table";
import { DetailedTable } from "./_components/detailed-table";
import { transactionKeys, reportKeys } from "@/lib/query-keys";
import { getTransactions } from "@/lib/api";
import type { TransactionWithDetails } from "@/lib/types/domain-types";
import { getDetailedCategories, getMonthlyReportAction, getCategoriesByExpenses } from "@/lib/services/report";

interface ReportsPageProps {
  searchParams: Promise<{ hub?: string }>;
}

export default async function Report({ searchParams }: ReportsPageProps) {
  const { hub: hubId } = await searchParams;

  const queryClient = new QueryClient();
  
  if (hubId) {
    await queryClient.prefetchQuery<TransactionWithDetails[]>({
      queryKey: transactionKeys.list(hubId),
      queryFn: async () => {
        const res = await getTransactions(hubId);
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch transactions");
        }
        return res.data ?? [];
      },
    });

    await queryClient.prefetchQuery({
      queryKey: reportKeys.detailedCategories(hubId),
      queryFn: async () => {
        const res = await getDetailedCategories();
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch detailed categories");
        }
        return res.data ?? [];
      },
    });

    await queryClient.prefetchQuery({
      queryKey: reportKeys.monthly(hubId),
      queryFn: async () => {
        const res = await getMonthlyReportAction();
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch monthly reports");
        }
        return res.data ?? [];
      },
    });

    await queryClient.prefetchQuery({
      queryKey: reportKeys.expenseCategoriesProgress(hubId),
      queryFn: async () => {
        const res = await getCategoriesByExpenses();
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch expense categories progress");
        }
        return res.data ?? { data: [] };
      },
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
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
    </HydrationBoundary>
  );
}
