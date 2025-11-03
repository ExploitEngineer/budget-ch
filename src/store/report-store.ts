import { create } from "zustand";
import { getTransactions } from "@/lib/services/transaction";
import type { Transaction } from "@/lib/types/dashboard-types";

interface ReportState {
  transactions: Transaction[] | null;
  loading: boolean;
  error: string | null;

  income: number;
  expense: number;
  balance: number;
  savingRate: number;

  fetchTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  transactions: null,
  loading: false,
  error: null,

  income: 0,
  expense: 0,
  balance: 0,
  savingRate: 0,

  fetchTransactions: async () => {
    try {
      set({ loading: true, error: null });

      const res = await getTransactions();

      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to fetch transactions");
      }

      const transactions = res.data as Transaction[];

      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach((tx) => {
        if (tx.type === "income") totalIncome += tx.amount;
        else if (tx.type === "expense") totalExpense += tx.amount;
      });

      const netBalance = totalIncome - totalExpense;
      const rate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

      set({
        transactions,
        income: totalIncome,
        expense: totalExpense,
        balance: netBalance,
        savingRate: Number(rate.toFixed(1)),
      });
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      set({ error: "Failed to load report data" });
    } finally {
      set({ loading: false });
    }
  },

  refreshTransactions: async () => {
    await get().fetchTransactions();
  },
}));
