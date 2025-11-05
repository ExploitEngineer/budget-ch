import { create } from "zustand";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteAllTransactionsAndCategories,
} from "@/lib/services/transaction";
import { toast } from "sonner";
import type { AccountType } from "@/db/queries";
import { useDashboardStore } from "./dashboard-store";

interface CreateTransactionProps {
  category: string;
  amount: number;
  note?: string;
  source: string;
  transactionType: "income" | "expense";
  accountType: AccountType;
}

interface TransactionState {
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  deleteAllLoading: boolean;

  createTransactionAndSync: (data: CreateTransactionProps) => Promise<void>;
  updateTransactionAndSync: (id: string, data: FormData) => Promise<void>;
  deleteTransactionAndSync: (id: string) => Promise<void>;
  deleteAllTransactionsAndCategoriesAndSync: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  deleteAllLoading: false,

  createTransactionAndSync: async (data) => {
    try {
      set({ createLoading: true });

      const result = await createTransaction({
        categoryName: data.category.trim(),
        amount: data.amount,
        note: data.note,
        source: data.source,
        transactionType: data.transactionType,
        accountType: data.accountType,
      });

      if (!result.success) {
        if (result.reason === "NO_ACCOUNT") {
          toast.error("Please create a financial account first!");
          throw new Error("Please create a financial account first!");
        }
        const errorMessage = result.message || "Failed to create transaction.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await useDashboardStore.getState().refreshTransactions();
      toast.success("Transaction created successfully!");
    } catch (err: any) {
      if (
        !err.message?.includes("already exists") &&
        !err.message?.includes("financial account") &&
        !err.message?.includes("Failed to create transaction")
      ) {
        console.error("Error creating transaction:", err);
        toast.error("Something went wrong while creating the transaction.");
      }
      throw err;
    } finally {
      set({ createLoading: false });
    }
  },

  updateTransactionAndSync: async (id, fd) => {
    try {
      set({ updateLoading: true });

      const result = await updateTransaction(id, fd);
      if (!result.success) {
        const errorMessage = result.message || "Failed to update transaction.";
        toast.error(errorMessage);
        const error = new Error(errorMessage);
        throw error;
      }

      await useDashboardStore.getState().refreshTransactions();
      toast.success("Transaction updated successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to update transaction")) {
        console.error("Error updating transaction:", err);
        toast.error("Something went wrong while updating.");
      }
      throw err;
    } finally {
      set({ updateLoading: false });
    }
  },

  deleteTransactionAndSync: async (id) => {
    try {
      set({ deleteLoading: true });

      const result = await deleteTransaction(id);
      if (!result.success) {
        const errorMessage = result.message || "Failed to delete transaction.";
        toast.error(errorMessage);
        const error = new Error(errorMessage);
        throw error;
      }

      await useDashboardStore.getState().refreshTransactions();
      toast.success("Transaction deleted successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to delete transaction")) {
        console.error("Error deleting transaction:", err);
        toast.error("Something went wrong while deleting.");
      }
      throw err;
    } finally {
      set({ deleteLoading: false });
    }
  },

  deleteAllTransactionsAndCategoriesAndSync: async () => {
    try {
      set({ deleteAllLoading: true });

      const result = await deleteAllTransactionsAndCategories();

      if (!result.success) {
        const errorMessage =
          result.message || "Failed to delete all transactions and categories.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await useDashboardStore.getState().refreshTransactions();
      toast.success("All transactions and related categories deleted!");
    } catch (err: any) {
      console.error("Error deleting all transactions and categories:", err);
      toast.error(
        "Something went wrong while deleting all transactions and categories.",
      );
      throw err;
    } finally {
      set({ deleteAllLoading: false });
    }
  },
}));
