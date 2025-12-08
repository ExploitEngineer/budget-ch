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

interface BudgetsPageProps {
  searchParams: Promise<{ hub?: string }>;
}

export default async function Transactions({ searchParams }: BudgetsPageProps) {
  const { hub: hubId } = await searchParams;

  const queryClient = new QueryClient();
  
  if (hubId) {
    await queryClient.prefetchQuery({
      queryKey: budgetKeys.list(hubId),
      queryFn: async () => {
        const res = await getBudgets();
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch budgets");
        }
        return res.data ?? [];
      },
    });

    await queryClient.prefetchQuery({
      queryKey: budgetKeys.amounts(hubId),
      queryFn: async () => {
        const res = await getBudgetsAmounts();
        if (!res.success) {
          throw new Error(res.message || "Failed to fetch budget amounts");
        }
        const totalAllocated = res.data?.totalAllocated ?? 0;
        const totalSpent = res.data?.totalSpent ?? 0;
        return {
          allocated: totalAllocated,
          spent: totalSpent,
          available: totalAllocated - totalSpent,
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
          <BudgetCardsSection />
          <BudgetDataTable />
          <WarningSection />
          <Settings />
        </div>
      </section>
    </HydrationBoundary>
  );
}
