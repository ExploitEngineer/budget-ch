"use client";

import { useEffect, useState } from "react";
import SidebarHeader from "@/components/sidebar-header";
import { FiltersSection } from "@/app/me/transactions/_components/filters-section";
import { DataTable } from "./data-table";
import type { Transaction } from "@/lib/types/dashboard-types";
import type { TransactionFiltersFormValues } from "@/lib/validations/transaction-filters-validations";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/lib/services/transaction";
import { transactionKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";

export default function TransactionsClient() {
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const {
    data: transactions,
    isLoading: transactionLoading,
    error: transactionError,
  } = useQuery<Transaction[]>({
    queryKey: transactionKeys.list(hubId),
    queryFn: async () => {
      const res = await getTransactions();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch transactions");
      }
      return res.data ?? [];
    },
  });

  const [filtered, setFiltered] = useState<Transaction[]>([]);

  useEffect(() => {
    setFiltered(transactions ?? []);
  }, [transactions]);

  const handleFilter = (filters: TransactionFiltersFormValues) => {
    const filteredData = (transactions ?? []).filter((tx) => {
      if (!tx.date) return false;

      const [day, month, year] = tx.date.split("/").map(Number);
      const txDate = new Date(year, month - 1, day);
      txDate.setHours(0, 0, 0, 0);

      let matchDate = true;

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchDate = txDate >= fromDate;
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(0, 0, 0, 0);
        matchDate = matchDate && txDate <= toDate;
      }


      const matchCategory =
        !filters.category || tx.category === filters.category;

      const matchAmount =
        (!filters.amountMin || tx.amount >= filters.amountMin) &&
        (!filters.amountMax || tx.amount <= filters.amountMax);

      const matchText =
        !filters.text ||
        tx.recipient?.toLowerCase().includes(filters.text.toLowerCase()) ||
        tx.note?.toLowerCase().includes(filters.text.toLowerCase()) ||
        tx.category?.toLowerCase().includes(filters.text.toLowerCase());

      return (
        matchDate && matchCategory && matchAmount && matchText
      );
    });

    setFiltered(filteredData);
  };

  return (
    <section>
      <SidebarHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FiltersSection
          onFilter={handleFilter}
          onReset={() => setFiltered(transactions ?? [])}
        />
        <DataTable
          transactions={filtered}
          loading={transactionLoading}
          error={transactionError?.message ?? null}
        />
      </div>
    </section>
  );
}
