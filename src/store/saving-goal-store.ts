import { create } from "zustand";
import {
  createSavingGoal,
  updateSavingGoal,
  deleteSavingGoal,
  getSavingGoals,
  getSavingGoalsSummary,
  type SavingGoalsSummary,
} from "@/lib/services/saving-goal";
import { SavingGoal } from "@/db/queries";
import { toast } from "sonner";
import { type savingGoalArgs } from "@/db/queries";

interface SavingGoalState {
  goals: SavingGoal[] | null;
  goalsLoading: boolean;
  goalsError: string | null;

  summary: SavingGoalsSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;

  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;

  fetchGoals: () => Promise<void>;
  refreshGoals: () => Promise<void>;

  fetchSummary: () => Promise<void>;
  refreshSummary: () => Promise<void>;

  createGoalAndSync: (
    data: Omit<savingGoalArgs, "hubId" | "userId">,
  ) => Promise<void>;

  updateGoalAndSync: (
    goalId: string,
    updatedData: {
      name?: string;
      goalAmount?: number;
      amountSaved?: number;
      monthlyAllocation?: number;
      accountType?: string;
      dueDate?: Date | null;
    },
  ) => Promise<void>;

  deleteGoalAndSync: (goalId: string) => Promise<void>;
}

export const useSavingGoalStore = create<SavingGoalState>((set, get) => ({
  goals: null,
  goalsLoading: false,
  goalsError: null,

  summary: null,
  summaryLoading: false,
  summaryError: null,

  createLoading: false,
  updateLoading: false,
  deleteLoading: false,

  fetchGoals: async () => {
    try {
      set({ goalsLoading: true, goalsError: null });
      const res = await getSavingGoals();

      if (!res.success) {
        throw new Error(res.message || "Failed to fetch saving goals");
      }

      set({ goals: res.data ?? [] });
    } catch (err: any) {
      console.error("Error fetching saving goals:", err);
      set({ goalsError: "Failed to load saving goals" });
    } finally {
      set({ goalsLoading: false });
    }
  },

  refreshGoals: async () => {
    await get().fetchGoals();
  },

  fetchSummary: async () => {
    try {
      set({ summaryLoading: true, summaryError: null });
      const res = await getSavingGoalsSummary();

      if (!res.success) {
        throw new Error(res.message || "Failed to fetch saving goals summary");
      }

      set({ summary: res.data ?? null });
    } catch (err: any) {
      console.error("Error fetching saving goals summary:", err);
      set({ summaryError: "Failed to load saving goals summary" });
    } finally {
      set({ summaryLoading: false });
    }
  },

  refreshSummary: async () => {
    await get().fetchSummary();
  },

  createGoalAndSync: async (data) => {
    try {
      set({ createLoading: true });

      const result = await createSavingGoal(data);

      if (!result.success) {
        const errorMessage = result.message || "Failed to create saving goal.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await get().fetchGoals();
      await get().fetchSummary();
      toast.success("Saving goal created successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to create saving goal")) {
        console.error("Error creating saving goal:", err);
        toast.error("Something went wrong while creating the saving goal.");
      }
      throw err;
    } finally {
      set({ createLoading: false });
    }
  },

  updateGoalAndSync: async (goalId, updatedData) => {
    try {
      set({ updateLoading: true });

      const result = await updateSavingGoal({
        goalId,
        updatedData,
      });

      if (!result.success) {
        const errorMessage = result.message || "Failed to update saving goal.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await get().fetchGoals();
      await get().fetchSummary();
      toast.success("Saving goal updated successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to update saving goal")) {
        console.error("Error updating saving goal:", err);
        toast.error("Something went wrong while updating.");
      }
      throw err;
    } finally {
      set({ updateLoading: false });
    }
  },

  deleteGoalAndSync: async (goalId) => {
    try {
      set({ deleteLoading: true });

      const result = await deleteSavingGoal(goalId);

      if (!result.success) {
        const errorMessage = result.message || "Failed to delete saving goal.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await get().fetchGoals();
      await get().fetchSummary();
      toast.success("Saving goal deleted successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to delete saving goal")) {
        console.error("Error deleting saving goal:", err);
        toast.error("Something went wrong while deleting.");
      }
      throw err;
    } finally {
      set({ deleteLoading: false });
    }
  },
}));
