import { create } from "zustand";
import { getTransactions } from "@/lib/services/transaction";
import {
  getDetailedCategories,
  getMonthlyReportAction,
} from "@/lib/services/report";
import type { Transaction } from "@/lib/types/dashboard-types";

interface CategoryDetail {
  id: string;
  name: string;
  totalAmount: number;
}

interface MonthlyReport {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface ReportState {
  transactions: Transaction[] | null;
  loading: boolean;
  error: string | null;

  income: number;
  expense: number;
  balance: number;
  savingRate: number;

  categories: CategoryDetail[] | null;
  categoriesTotal: number;

  monthlyReports: MonthlyReport[] | null;
  reportsLoading: boolean;
  reportsError: string | null;

  fetchTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;

  fetchCategories: () => Promise<void>;
  refreshCategories: () => Promise<void>;

  fetchMonthlyReports: () => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  transactions: null,
  loading: false,
  error: null,

  income: 0,
  expense: 0,
  balance: 0,
  savingRate: 0,

  categories: null,
  categoriesTotal: 0,

  fetchTransactions: async () => {
    try {
      set({ loading: true, error: null });

      const res = await getTransactions();
      if (!res.success || !res.data)
        throw new Error(res.message || "Failed to fetch transactions");

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

  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });

      const res = await getDetailedCategories();
      if (!res.success || !res.data)
        throw new Error(res.message || "Failed to fetch categories.");

      const total = res.data.reduce(
        (acc: number, c: CategoryDetail) => acc + c.totalAmount,
        0,
      );
      set({ categories: res.data, categoriesTotal: total });
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      set({ error: "Failed to load category data" });
    } finally {
      set({ loading: false });
    }
  },

  refreshCategories: async () => {
    await get().fetchCategories();
  },

  monthlyReports: [],
  reportsLoading: true,
  reportsError: null,

  fetchMonthlyReports: async () => {
    try {
      set({ reportsLoading: true, reportsError: null });

      const res = await getMonthlyReportAction();

      if (!res.success || !res.data)
        throw new Error(res.message || "Failed to fetch monthly repots.");


      set({ monthlyReports: res.data });
    } catch (err) {
      console.error("Error fetching monthly reports:", err);
      set({ reportsError: "Failed to load monthly reports" });
    } finally {
      set({ reportsLoading: false });
    }
  },
}));
