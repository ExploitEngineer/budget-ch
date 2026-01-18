"use client";

import { useState, useMemo } from "react";
import SidebarHeader from "@/components/sidebar-header";
import { FiltersSection } from "@/app/me/transactions/_components/filters-section";
import { DataTable } from "./data-table";
import RecurringTemplatesSection from "./recurring-templates-section";
import type { Transaction } from "@/lib/types/dashboard-types";
import type { TransactionFiltersFormValues } from "@/lib/validations/transaction-filters-validations";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/lib/api";
import { transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { TransactionWithDetails } from "@/lib/types/domain-types";
import { mapTransactionsToRows } from "../transaction-adapters";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTranslations } from "next-intl";

const defaultFilters: TransactionFiltersFormValues = {
  dateFrom: undefined,
  dateTo: undefined,
  category: "",
  amountMax: 0,
  amountMin: 0,
  text: "",
  withReceipt: false,
  isRecurring: false,
  transfersOnly: false,
};

type ViewType = "transactions" | "recurring";

export default function TransactionsClient() {
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const t = useTranslations("main-dashboard.transactions-page");

  const [activeView, setActiveView] = useState<ViewType>("transactions");

  const {
    data: domainTransactions,
    isLoading: transactionLoading,
    error: transactionError,
  } = useQuery<TransactionWithDetails[]>({
    queryKey: transactionKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getTransactions(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch transactions");
      }
      return res.data ?? [];
    },
    enabled: !!hubId && activeView === "transactions",
  });

  const transactions = useMemo(() => {
    if (!domainTransactions) return undefined;
    return mapTransactionsToRows(domainTransactions);
  }, [domainTransactions]);

  const [filters, setFilters] = useState<TransactionFiltersFormValues>(defaultFilters);

  const handleFilter = (newFilters: TransactionFiltersFormValues) => {
    setFilters(newFilters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  return (
    <section>
      <SidebarHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* View Toggle */}
        <ToggleGroup
          className="dark:border-border-blue bg-dark-blue-background border w-fit"
          type="single"
          value={activeView}
          onValueChange={(val) => val && setActiveView(val as ViewType)}
        >
          <ToggleGroupItem value="transactions" aria-label="toggle-transactions" className="text-xs sm:text-sm px-8">
            {t("view-toggle.transactions")}
          </ToggleGroupItem>
          <ToggleGroupItem value="recurring" aria-label="toggle-recurring" className="text-xs sm:text-sm px-8">
            {t("view-toggle.recurring")}
          </ToggleGroupItem>
        </ToggleGroup>

        {activeView === "transactions" ? (
          <>
            <FiltersSection
              onFilter={handleFilter}
              onReset={handleReset}
            />
            <DataTable
              transactions={(transactions ?? []) as Transaction[]}
              filters={filters}
              loading={transactionLoading || !hubId || transactions === undefined}
              error={transactionError?.message ?? null}
            />
          </>
        ) : (
          <RecurringTemplatesSection />
        )}
      </div>
    </section>
  );
}
