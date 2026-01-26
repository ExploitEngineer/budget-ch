import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import SidebarHeader from "@/components/sidebar-header";
import { ReportCardsSection } from "./_components/report-cards";
import { AnalysisTable } from "./_components/analysis-table";
import { DetailedTable } from "./_components/detailed-table";
import { getMonthStartUTC, getMonthEndUTC } from "@/lib/timezone";
import { reportKeys } from "@/lib/query-keys";
import {
  getDetailedCategories,
  getMonthlyReportAction,
  getCategoriesByExpenses,
  getReportSummaryAction,
} from "@/lib/services/report";
import { canAccessFeature } from "@/lib/services/features-permission";
import { redirect } from "next/navigation";

interface ReportsPageProps {
  searchParams: Promise<{
    hub?: string;
    from?: string;
    to?: string;
    group_by?: "month" | "quarter" | "year";
  }>;
}

export default async function Report({ searchParams }: ReportsPageProps) {
  const { hub: hubId, from: fromParam, to: toParam, group_by: groupByParam } = await searchParams;

  const { canAccess } = await canAccessFeature("reports");

  if (!canAccess) {
    redirect("/me/dashboard?upgrade=true");
  }

  // Default to current month if no dates are provided
  const now = new Date();
  const from = fromParam || getMonthStartUTC(now).toISOString();
  const to = toParam || getMonthEndUTC(now).toISOString();
  const groupBy = groupByParam || "month";

  const queryClient = new QueryClient();

  if (hubId) {
    await queryClient.prefetchQuery({
      queryKey: reportKeys.summary(hubId, from, to),
      queryFn: async () => {
        const res = await getReportSummaryAction(hubId, from, to);
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch report summary");
        }
        return res.data!;
      },
    });

    await queryClient.prefetchQuery({
      queryKey: reportKeys.detailedCategories(hubId, from, to),
      queryFn: async () => {
        const res = await getDetailedCategories(hubId, from, to);
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch detailed categories");
        }
        return res.data ?? [];
      },
    });

    await queryClient.prefetchQuery({
      queryKey: reportKeys.monthly(hubId, from, to, groupBy),
      queryFn: async () => {
        const res = await getMonthlyReportAction(hubId, from, to, groupBy);
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch monthly reports");
        }
        return res.data ?? [];
      },
    });

    await queryClient.prefetchQuery({
      queryKey: reportKeys.expenseCategoriesProgress(hubId, from, to),
      queryFn: async () => {
        const res = await getCategoriesByExpenses(hubId, from, to);
        if (!res.success) {
          throw new Error(
            res.message || "Failed to fetch expense categories progress",
          );
        }
        return res.data ?? { data: [] };
      },
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <section>
        <div>
          <SidebarHeader initialFrom={from} initialTo={to} />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <ReportCardsSection initialFrom={from} initialTo={to} />
          <AnalysisTable initialFrom={from} initialTo={to} />
          <DetailedTable initialFrom={from} initialTo={to} />
        </div>
      </section>
    </HydrationBoundary>
  );
}
