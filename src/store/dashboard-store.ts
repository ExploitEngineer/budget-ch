import { create } from "zustand";
import { getBudgetsAmounts } from "@/lib/services/budget";

interface DashboardState {
  allocated: number | null;
  spent: number | null;
  available: number | null;
  loading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  allocated: null,
  spent: null,
  available: null,
  loading: false,
  error: null,

  fetchBudgets: async () => {
    try {
      set({ loading: true, error: null });

      const res = await getBudgetsAmounts();

      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budgets");
      }

      const totalAllocated = res.data?.totalAllocated ?? 0;
      const totalSpent = res.data?.totalSpent ?? 0;

      set({
        allocated: totalAllocated,
        spent: totalSpent,
        available: totalAllocated - totalSpent,
      });
    } catch (err: any) {
      console.error("Error fetching budgets:", err);
      set({ error: "Unexpected error fetching budget data" });
    } finally {
      set({ loading: false });
    }
  },

  refreshBudgets: async () => {
    await useDashboardStore.getState().fetchBudgets();
  },
}));
