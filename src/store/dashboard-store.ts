import { create } from "zustand";
import { getBudgetsAmounts, getTopCategories } from "@/lib/services/budget";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/services/tasks";
import type { QuickTask } from "@/db/schema";
import type { DashboardSavingsGoalsCards } from "@/lib/types/dashboard-types";
import { toast } from "sonner";

interface DashboardState {
  // Budgets totals
  allocated: number | null;
  spent: number | null;
  available: number | null;
  budgetLoading: boolean;
  budgetError: string | null;

  // Tasks
  tasks: QuickTask[] | null;
  tasksLoading: boolean;
  tasksError: string | null;

  // Top Categories
  topCategories: DashboardSavingsGoalsCards[] | null;
  categoriesLoading: boolean;
  categoriesError: string | null;

  // Actions
  fetchBudgets: () => Promise<void>;
  refreshBudgets: () => Promise<void>;

  fetchTasks: () => Promise<void>;
  createNewTask: (name: string) => Promise<void>;
  toggleTask: (taskId: string, checked: boolean) => Promise<void>;
  deleteTaskById: (taskId: string) => Promise<void>;
  editTaskName: (taskId: string, name: string) => Promise<void>;

  fetchTopCategories: () => Promise<void>;
  refreshTopCategories: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Budgets
  allocated: null,
  spent: null,
  available: null,
  budgetLoading: false,
  budgetError: null,

  fetchBudgets: async () => {
    try {
      set({ budgetLoading: true, budgetError: null });

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
      set({ budgetError: "Unexpected error fetching budget data" });
    } finally {
      set({ budgetLoading: false });
    }
  },

  refreshBudgets: async () => {
    await useDashboardStore.getState().fetchBudgets();
  },

  // Tasks
  tasks: [],
  tasksLoading: true,
  tasksError: null,

  fetchTasks: async () => {
    try {
      set({ tasksLoading: true, tasksError: null });
      const res = await getTasks();
      if (!res.success) throw new Error(res.message || "Failed to fetch tasks");
      set({ tasks: res.data ?? [] });
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      set({ tasksError: "Failed to load tasks" });
    } finally {
      set({ tasksLoading: false });
    }
  },

  createNewTask: async (name: string) => {
    if (!name.trim()) return;
    try {
      set({ tasksLoading: true });
      const res = await createTask({ name, checked: false });
      if (!res.success) throw new Error(res.message);
      await get().fetchTasks();
      toast.success("Task created");
    } catch (err: any) {
      console.error("Error creating task:", err);
      toast.error(err.message || "Failed to create task");
    } finally {
      set({ tasksLoading: false });
    }
  },

  toggleTask: async (taskId: string, checked: boolean) => {
    try {
      const res = await updateTask({ taskId, checked });
      if (!res.success) throw new Error(res.message);
      set((state) => ({
        tasks: state.tasks
          ? state.tasks.map((t) => (t.id === taskId ? { ...t, checked } : t))
          : [],
      }));
    } catch (err: any) {
      console.error("Error updating task:", err);
      toast.error(err.message || "Failed to update task");
    }
  },

  deleteTaskById: async (taskId: string) => {
    try {
      const res = await deleteTask(taskId);
      if (!res.success) throw new Error(res.message);
      set((state) => ({
        tasks: state.tasks ? state.tasks.filter((t) => t.id !== taskId) : [],
      }));
      toast.success("Task deleted");
    } catch (err: any) {
      console.error("Error deleting task:", err);
      toast.error(err.message || "Failed to delete task");
    }
  },

  editTaskName: async (taskId: string, name: string) => {
    if (!name.trim()) return;
    try {
      const task = get().tasks!.find((t) => t.id === taskId);
      if (!task || task.name === name) return;
      const res = await updateTask({ taskId, name });
      if (!res.success) throw new Error(res.message);
      set((state) => ({
        tasks: state.tasks
          ? state.tasks.map((t) => (t.id === taskId ? { ...t, name } : t))
          : [],
      }));
      toast.success("Task updated");
    } catch (err: any) {
      console.error("Error editing task:", err);
      toast.error(err.message || "Failed to update task");
    }
  },

  // Categories
  topCategories: [],
  categoriesLoading: true,
  categoriesError: null,

  fetchTopCategories: async () => {
    try {
      set({ categoriesLoading: true, categoriesError: null });
      const res = await getTopCategories();
      if (!res.success)
        throw new Error(res.message || "Failed to fetch categories");
      set({ topCategories: res.data ?? [] });
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      set({ categoriesError: "Failed to load categories" });
    } finally {
      set({ categoriesLoading: false });
    }
  },

  refreshTopCategories: async () => {
    await get().fetchTopCategories();
  },
}));
