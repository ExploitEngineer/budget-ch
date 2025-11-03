import { create } from "zustand";
import {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgets,
  getBudgetsAmounts,
  type BudgetRow,
} from "@/lib/services/budget";
import { toast } from "sonner";
import { getCategoriesCount } from "@/lib/services/category";

interface BudgetState {
  budgets: BudgetRow[] | null;
  budgetsLoading: boolean;
  budgetsError: string | null;

  allocated: number | null;
  spent: number | null;
  available: number | null;
  amountsLoading: boolean;
  amountsError: string | null;

  categoriesCount: number | null;
  categoriesLoading: boolean;
  categoriesError: string | null;

  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;

  fetchBudgets: () => Promise<void>;
  refreshBudgets: () => Promise<void>;

  fetchBudgetsAmounts: () => Promise<void>;
  refreshBudgetsAmounts: () => Promise<void>;

  fetchCategoriesCount: () => Promise<void>;
  refreshCategoriesCount: () => Promise<void>;

  createBudgetAndSync: (data: {
    categoryName: string;
    allocatedAmount: number;
    spentAmount: number;
    warningPercentage: number;
    markerColor: string;
  }) => Promise<void>;

  updateBudgetAndSync: (
    budgetId: string,
    updatedData: {
      categoryName?: string;
      allocatedAmount?: number;
      spentAmount?: number;
      warningPercentage?: number;
      markerColor?: string;
    },
  ) => Promise<void>;

  deleteBudgetAndSync: (budgetId: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: null,
  budgetsLoading: false,
  budgetsError: null,

  allocated: null,
  spent: null,
  available: null,
  amountsLoading: false,
  amountsError: null,

  categoriesCount: null,
  categoriesLoading: false,
  categoriesError: null,

  createLoading: false,
  updateLoading: false,
  deleteLoading: false,

  fetchBudgets: async () => {
    try {
      set({ budgetsLoading: true, budgetsError: null });
      const res = await getBudgets();

      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budgets");
      }

      set({ budgets: res.data ?? [] });
    } catch (err: any) {
      console.error("Error fetching budgets:", err);
      set({ budgetsError: "Failed to load budgets" });
    } finally {
      set({ budgetsLoading: false });
    }
  },

  refreshBudgets: async () => {
    await get().fetchBudgets();
  },

  fetchBudgetsAmounts: async () => {
    try {
      set({ amountsLoading: true, amountsError: null });
      const res = await getBudgetsAmounts();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch budget amounts");
      }
      const totalAllocated = res.data?.totalAllocated ?? 0;
      const totalSpent = res.data?.totalSpent ?? 0;
      set({
        allocated: totalAllocated,
        spent: totalSpent,
        available: totalAllocated - totalSpent,
      });
    } catch (err: any) {
      console.error("Error fetching budget amounts:", err);
      set({ amountsError: "Unexpected error fetching budget data" });
    } finally {
      set({ amountsLoading: false });
    }
  },

  refreshBudgetsAmounts: async () => {
    await get().fetchBudgetsAmounts();
  },

  fetchCategoriesCount: async () => {
    try {
      set({ categoriesLoading: true, categoriesError: null });
      const res = await getCategoriesCount();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch categories count");
      }
      set({ categoriesCount: Number(res.data?.count ?? 0) });
    } catch (err: any) {
      console.error("Error fetching categories count:", err);
      set({ categoriesError: "Unexpected error fetching category count" });
    } finally {
      set({ categoriesLoading: false });
    }
  },

  refreshCategoriesCount: async () => {
    await get().fetchCategoriesCount();
  },

  createBudgetAndSync: async (data) => {
    try {
      set({ createLoading: true });
      const result = await createBudget(data);
      if (!result.success) {
        const errorMessage = result.message || "Failed to create budget.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      await get().fetchBudgets();
      await get().fetchBudgetsAmounts();
      await get().fetchCategoriesCount();
      toast.success("Budget created successfully!");
    } catch (err: any) {
      if (
        !err.message?.includes("already exists") &&
        !err.message?.includes("Failed to create budget")
      ) {
        console.error("Error creating budget:", err);
        toast.error("Something went wrong while creating the budget.");
      }
      throw err;
    } finally {
      set({ createLoading: false });
    }
  },
  updateBudgetAndSync: async (budgetId, updatedData) => {
    try {
      set({ updateLoading: true });
      const result = await updateBudget({
        budgetId,
        updatedData,
      });
      if (!result.success) {
        const errorMessage = result.message || "Failed to update budget.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      await get().fetchBudgets();
      await get().fetchBudgetsAmounts();
      await get().fetchCategoriesCount();
      toast.success("Budget updated successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to update budget")) {
        console.error("Error updating budget:", err);
        toast.error("Something went wrong while updating.");
      }
      throw err;
    } finally {
      set({ updateLoading: false });
    }
  },
  deleteBudgetAndSync: async (budgetId) => {
    try {
      set({ deleteLoading: true });
      const result = await deleteBudget(budgetId);
      if (!result.success) {
        const errorMessage = result.message || "Failed to delete budget.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      await get().fetchBudgets();
      await get().fetchBudgetsAmounts();
      await get().fetchCategoriesCount();
      toast.success("Budget deleted successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to delete budget")) {
        console.error("Error deleting budget:", err);
        toast.error("Something went wrong while deleting.");
      }
      throw err;
    } finally {
      set({ deleteLoading: false });
    }
  },
}));
