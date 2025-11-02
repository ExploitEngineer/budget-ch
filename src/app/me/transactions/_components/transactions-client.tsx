"use client";

import { useEffect, useState } from "react";
import SidebarHeader from "@/components/sidebar-header";
import { CalculationSection } from "./calculations-section";
import { DataTable } from "./data-table";
import type { Transaction } from "@/lib/types/dashboard-types";
import type { CalculationFormValues } from "@/lib/validations/calculation-section-validations";
import { useDashboardStore } from "@/store/dashboard-store";

export default function TransactionsClient() {
  const {
    transactions,
    transactionLoading,
    transactionError,
    fetchTransactions,
  } = useDashboardStore();

  const [filtered, setFiltered] = useState<Omit<Transaction, "type">[]>([]);

  useEffect(() => {
    fetchTransactions?.();
  }, [fetchTransactions]);

  useEffect(() => {
    const sanitized = (transactions ?? []).map(
      ({ type, ...rest }) => rest,
    ) as Omit<Transaction, "type">[];
    setFiltered(sanitized);
  }, [transactions]);

  const handleFilter = (filters: CalculationFormValues) => {
    const sanitized = (transactions ?? []).map(
      ({ type, ...rest }) => rest,
    ) as Omit<Transaction, "type">[];

    const filteredData = sanitized.filter((tx) => {
      const matchDate =
        (!filters.dateFrom ||
          new Date(tx.date) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(tx.date) <= new Date(filters.dateTo));

      const matchAccount =
        !filters.select1 || tx.accountType === filters.select1;

      const matchCategory = !filters.select2 || tx.category === filters.select2;

      const matchAmount =
        (!filters.amountMin || tx.amount >= filters.amountMin) &&
        (!filters.amountMax || tx.amount <= filters.amountMax);

      const matchText =
        !filters.text ||
        tx.recipient?.toLowerCase().includes(filters.text.toLowerCase()) ||
        tx.note?.toLowerCase().includes(filters.text.toLowerCase());

      return (
        matchDate && matchAccount && matchCategory && matchAmount && matchText
      );
    });

    setFiltered(filteredData);
  };

  return (
    <section>
      <SidebarHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <CalculationSection
          onFilter={handleFilter}
          onReset={() =>
            setFiltered(
              (transactions ?? []).map(({ type, ...rest }) => rest) as Omit<
                Transaction,
                "type"
              >[],
            )
          }
        />
        <DataTable
          transactions={filtered}
          loading={transactionLoading}
          error={transactionError}
        />
      </div>
    </section>
  );
}
