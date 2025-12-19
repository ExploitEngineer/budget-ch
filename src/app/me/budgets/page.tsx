import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import SidebarHeader from "@/components/sidebar-header";
import { BudgetCardsSection } from "./_components/budget-cards";
import { BudgetDataTable } from "./_components/data-table";
import { WarningSection } from "./_components/warning-section";
import { Settings } from "./_components/settings";
import { budgetKeys } from "@/lib/query-keys";
import { getBudgets, getBudgetsAmounts } from "@/lib/services/budget";
import type { BudgetWithCategory } from "@/lib/types/domain-types";
import { MonthSelector } from "./_components/month-selector";

interface BudgetsPageProps {
  searchParams: Promise<{ hub?: string; month?: string; year?: string }>;
}

export default async function Transactions({ searchParams }: BudgetsPageProps) {
  const { hub: hubId, month: monthParam, year: yearParam } = await searchParams;

  const month = monthParam ? parseInt(monthParam) : undefined;
  const year = yearParam ? parseInt(yearParam) : undefined;

  const queryClient = new QueryClient();

  if (hubId) {
    await queryClient.prefetchQuery<BudgetWithCategory[]>({
      queryKey: budgetKeys.list(hubId, month, year),
      queryFn: async () => {
        const res = await getBudgets(month, year);
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch budgets");
        }
        return res.data ?? [];
      },
    });

    await queryClient.prefetchQuery({
      queryKey: budgetKeys.amounts(hubId, month, year),
      queryFn: async () => {
        const res = await getBudgetsAmounts(month, year);
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch budget amounts");
        }
        const totalAllocated = res.data?.totalAllocated ?? 0;
        const totalSpent = res.data?.totalSpent ?? 0;
        return {
          allocated: totalAllocated,
          spent: totalSpent,
          available: totalAllocated - totalSpent,
          percent: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
        };
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
          <div className="flex justify-end">
            <MonthSelector />
          </div>
          <BudgetCardsSection />
          <BudgetDataTable />
          <WarningSection />
          <Settings />
        </div>
      </section>
    </HydrationBoundary>
  );
}
