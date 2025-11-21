import { create } from "zustand";
import {
  createFinancialAccount,
  updateFinancialAccount,
  deleteFinancialAccount,
  getFinancialAccounts,
} from "@/lib/services/financial-account";
import { toast } from "sonner";
import { type AccountType } from "@/db/queries";
import { type financialAccountArgs } from "@/db/queries";

export interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  iban: string | null;
  balance: number;
  formattedBalance: string;
  note: string | null;
}

interface AccountState {
  accounts: AccountRow[] | null;
  accountsLoading: boolean;
  accountsError: string | null;

  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;

  fetchAccounts: () => Promise<void>;
  refreshAccounts: () => Promise<void>;

  createAccountAndSync: (
    data: Omit<financialAccountArgs, "userId" | "hubId">,
  ) => Promise<void>;

  updateAccountAndSync: (accountId: string, updatedData: any) => Promise<void>;

  deleteAccountAndSync: (accountId: string) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: null,
  accountsLoading: false,
  accountsError: null,

  createLoading: false,
  updateLoading: false,
  deleteLoading: false,

  fetchAccounts: async (): Promise<void> => {
    try {
      set({ accountsLoading: true, accountsError: null });
      const res = await getFinancialAccounts();

      if (!res.status) {
        throw new Error("Failed to fetch accounts");
      }

      set({ accounts: res.tableData ?? [] });
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
      set({ accountsError: "Failed to load accounts" });
    } finally {
      set({ accountsLoading: false });
    }
  },

  refreshAccounts: async (): Promise<void> => {
    await get().fetchAccounts();
  },

  createAccountAndSync: async (data): Promise<void> => {
    try {
      set({ createLoading: true });

      const result = await createFinancialAccount(data);

      if (!result.status) {
        const errorMessage = result.message || "Failed to create account.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await get().fetchAccounts();
      toast.success("Account created successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to create account")) {
        console.error("Error creating account:", err);
      }
      throw err;
    } finally {
      set({ createLoading: false });
    }
  },

  updateAccountAndSync: async (
    accountId: string,
    updatedData,
  ): Promise<void> => {
    try {
      set({ updateLoading: true });

      const result = await updateFinancialAccount(accountId, updatedData);

      if (!result.status) {
        const errorMessage = result.message || "Failed to update account.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await get().fetchAccounts();
      toast.success("Account updated successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to update account")) {
        console.error("Error updating account:", err);
        toast.error("Something went wrong while updating.");
      }
      throw err;
    } finally {
      set({ updateLoading: false });
    }
  },

  deleteAccountAndSync: async (accountId: string): Promise<void> => {
    try {
      set({ deleteLoading: true });

      const result = await deleteFinancialAccount(accountId);

      if (!result.status) {
        const errorMessage = result.message || "Failed to delete account.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await get().fetchAccounts();
      toast.success("Account deleted successfully!");
    } catch (err: any) {
      if (!err.message?.includes("Failed to delete account")) {
        console.error("Error deleting account:", err);
        toast.error("Something went wrong while deleting.");
      }
      throw err;
    } finally {
      set({ deleteLoading: false });
    }
  },
}));
