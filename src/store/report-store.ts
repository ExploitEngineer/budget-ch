import { create } from "zustand";
import { getTransactions } from "@/lib/services/transaction";
import {
  getDetailedCategories,
  getMonthlyReportAction,
} from "@/lib/services/report";
import { getCategoriesByExpenses } from "@/lib/services/report";
import type { Transaction } from "@/lib/types/dashboard-types";

export interface CategoryDetail {
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

interface ExpenseCategoryProgress {
  category: string;
  amount: number;
  accountBalance: number;
  percent: number;
}

interface ReportState {
  hubId: string | null;
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

  expenseCategoriesProgress: ExpenseCategoryProgress[] | null;
  expenseCategoriesProgressLoading: boolean;
  expenseCategoriesProgressError: string | null;

  fetchTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;

  fetchCategories: () => Promise<void>;
  refreshCategories: () => Promise<void>;

  fetchMonthlyReports: () => Promise<void>;
  fetchExpenseCategoriesProgress: () => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  hubId: null,
  transactions: null,
  loading: false,
  error: null,

  income: 0,
  expense: 0,
  balance: 0,
  savingRate: 0,

  categories: null,
  categoriesTotal: 0,

  monthlyReports: [],
  reportsLoading: true,
  reportsError: null,

  expenseCategoriesProgress: null,
  expenseCategoriesProgressLoading: false,
  expenseCategoriesProgressError: null,

  fetchTransactions: async () => {
    try {
      set({ loading: true, error: null });
      // FIXME: Remove the usage of the report store and instead use the query client
      const res = await getTransactions(get().hubId as string);
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

  async fetchExpenseCategoriesProgress() {
    set({
      expenseCategoriesProgressLoading: true,
      expenseCategoriesProgressError: null,
    });
    try {
      const res = await getCategoriesByExpenses();
      if (!res.success || !res.data?.data) throw new Error(res.message);

      const dataArray = res.data.data;

      const progress = dataArray.map((item: any) => ({
        ...item,
        percent:
          item.accountBalance > 0
            ? Math.round((item.amount / item.accountBalance) * 100)
            : 0,
      }));
      set({ expenseCategoriesProgress: progress });
    } catch (err: any) {
      set({
        expenseCategoriesProgressError:
          err.message || "Failed to load expense categories progress",
      });
    } finally {
      set({ expenseCategoriesProgressLoading: false });
    }
  },
}));
