"use client";

import { useState } from "react";
import SidebarHeader from "@/components/sidebar-header";
import { FiltersSection } from "@/app/me/transactions/_components/filters-section";
import { DataTable } from "./data-table";
import type { Transaction } from "@/lib/types/dashboard-types";
import type { TransactionFiltersFormValues } from "@/lib/validations/transaction-filters-validations";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/lib/api";
import { transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import type { TransactionWithDetails } from "@/lib/types/domain-types";
import { mapTransactionsToRows } from "../transaction-adapters";
import { useMemo } from "react";

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

export default function TransactionsClient() {
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

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
    enabled: !!hubId,
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
        <FiltersSection
          onFilter={handleFilter}
          onReset={handleReset}
        />
        <DataTable
          transactions={(transactions ?? []) as Transaction[]}
          filters={filters}
          loading={transactionLoading}
          error={transactionError?.message ?? null}
        />
      </div>
    </section>
  );
}
