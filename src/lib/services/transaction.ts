"use server";

import {
  createTransactionDB,
  createTransactionCategoryDB,
  getTransactionsDB,
  updateTransactionDB,
  deleteTransactionDB,
  getFinancialAccountByType,
  getFinancialAccountById,
  updateFinancialAccountDB,
  deleteAllTransactionsAndCategoriesDB,
  getSubscriptionByUserId,
  getMonthlyTransactionCount,
} from "@/db/queries";
import type { createTransactionArgs } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import { transactionCategories } from "@/db/schema";
import { revalidatePath } from "next/cache";
import type { Transaction } from "../types/dashboard-types";
import db from "@/db/db";
import { requireAdminRole } from "@/lib/auth/permissions";

// CREATE Transaction
export async function createTransaction({
  categoryName,
  amount,
  note,
  source,
  transactionType,
  accountId,
}: Pick<
  createTransactionArgs,
  | "categoryName"
  | "amount"
  | "note"
  | "source"
  | "transactionType"
> & { accountId: string }) {
  try {
    const hdrs = await headers();
    const { userId, userRole, hubId } = await getContext(hdrs, false);

    requireAdminRole(userRole);

    const subscription = await getSubscriptionByUserId(userId);

    if (!subscription) {
      const txCount = await getMonthlyTransactionCount(userId);
      if (txCount >= 300) {
        return {
          success: false,
          message:
            "Free plan limit reached: You can only create 300 transactions per month.",
        };
      }
    }

    // Get account by ID
    const account = await getFinancialAccountById(accountId, hubId);
    if (!account) {
      return {
        success: false,
        message: "Account not found or you don't have access to it.",
      };
    }

    // Balance check and update logic
    let newBalance = Number(account.initialBalance ?? 0);
    if (transactionType === "expense") {
      if (newBalance < amount) {
        throw new Error("Insufficient funds in selected account.");
      }
      newBalance -= amount;
    } else if (transactionType === "income") {
      newBalance += amount;
    }

    await updateFinancialAccountDB({
      hubId,
      accountId: account.id,
      updatedData: { balance: newBalance },
    });

    const normalizedName = categoryName.trim().toLowerCase();

    const existingCategory = await db.query.transactionCategories.findFirst({
      where: (categories, { and, eq, sql }) =>
        and(
          sql`LOWER(${categories.name}) = ${normalizedName}`,
          eq(categories.hubId, hubId),
        ),
    });

    if (existingCategory) {
      throw new Error(`Category "${normalizedName}" already exists`);
    }

    const [newCategory] = await db
      .insert(transactionCategories)
      .values({
        hubId,
        name: normalizedName,
      })
      .returning({ id: transactionCategories.id });

    await createTransactionDB({
      financialAccountId: account.id,
      hubId,
      userId,
      transactionCategoryId: newCategory.id,
      amount,
      source,
      note,
      transactionType,
      // TODO this account type maybe redundant, should remove later if not needed.
      accountType: account.type,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error in CreateTransaction:", err);
    return {
      success: false,
      message: err.message || "Failed to create transaction",
    };
  }
}

// CREATE Transaction Category
export async function createTransactionCategory(categoryName: string) {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, true);

    const normalized = categoryName.trim().toLowerCase();
    const category = await createTransactionCategoryDB(normalized, hubId);

    return { success: true, category };
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      return { success: false, reason: "DUPLICATE_CATEGORY" };
    }
    console.error(err);
    return { success: false, message: "Failed to create category" };
  }
}

// GET Transactions
export async function getTransactions(): Promise<{
  success: boolean;
  message?: string;
  data: Transaction[];
}> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const res = await getTransactionsDB(hubId, {
      id: true,
      date: true,
      recipient: true,
      accountType: true,
      type: true,
      category: true,
      note: true,
      amount: true,
    });

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message ?? "Failed to fetch data",
        data: [],
      };
    }

    const transactions = res.data.map((tx: any) => ({
      id: tx.id,
      date: tx.date ? new Date(tx.date).toLocaleDateString("en-GB") : "—",
      recipient: tx.recipient || "—",
      accountType: tx.accountType || "—",
      type: tx.type,
      category: tx.category || "—",
      note: tx.note ?? null,
      amount: tx.amount ?? 0,
    }));

    return { success: true, data: transactions };
  } catch (err: any) {
    console.error("Error in getTransactionsTable:", err);
    return {
      success: false,
      message: err.message || "Failed to load transactions table data",
      data: [],
    };
  }
}

// GET Recent Transactions
export async function getRecentTransactions() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const res = await getTransactionsDB(
      hubId,
      {
        id: true,
        date: true,
        recipient: true,
        accountType: true,
        category: true,
        note: true,
        amount: true,
      },
      4,
    );

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch recent transactions",
      };
    }

    const transactions = res.data.map((tx: any) => ({
      id: tx.id,
      date: tx.date ? new Date(tx.date).toLocaleDateString("en-GB") : "—",
      recipient: tx.recipient || "—",
      accountType: tx.accountType || "—",
      category: tx.category || "—",
      note: tx.note ?? null,
      amount: tx.amount ?? 0,
    }));

    return { success: true, data: transactions };
  } catch (err: any) {
    console.error("Server action error in getRecentTransactions:", err);
    return {
      success: false,
      message: err?.message || "Unexpected server error.",
    };
  }
}

// UPDATE Transaction
export async function updateTransaction(
  transactionId: string,
  formData: FormData,
) {
  try {
    const hdrs = await headers();
    const { hubId, userRole, financialAccountId } = await getContext(
      hdrs,
      true,
    );

    requireAdminRole(userRole);

    if (!financialAccountId) {
      return {
        success: false,
        message: "No financial account found in context",
      };
    }

    const source = formData.get("source")?.toString().trim() || "";
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const note = formData.get("note")?.toString() || null;
    const addedAtStr = formData.get("addedAt")?.toString() || "";
    const addedAt = addedAtStr ? new Date(addedAtStr) : new Date();
    const accountType = formData.get("accountType")?.toString() || null;

    const categoryName =
      formData.get("categoryName")?.toString().trim().toLowerCase() || null;

    let transactionCategoryId: string | null = null;

    if (categoryName) {
      const existingCategory = await db.query.transactionCategories.findFirst({
        where: (categories, { and, eq, sql }) =>
          and(
            eq(categories.hubId, hubId),
            sql`LOWER(${categories.name}) = ${categoryName}`,
          ),
      });

      if (existingCategory) {
        transactionCategoryId = existingCategory.id;
      } else {
        const [newCategory] = await db
          .insert(transactionCategories)
          .values({
            hubId,
            name: categoryName,
          })
          .returning({ id: transactionCategories.id });

        transactionCategoryId = newCategory.id;
      }
    }

    const res = await updateTransactionDB({
      hubId,
      transactionId,
      updatedData: {
        source,
        amount,
        note,
        addedAt,
        accountType: accountType as any,
        financialAccountId,
        transactionCategoryId,
      },
    });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to update transaction.",
      };
    }

    revalidatePath("/dashboard/transactions");

    return {
      success: true,
      message: "Transaction updated successfully!",
      data: res.data,
    };
  } catch (err: any) {
    console.error("Error in updateTransaction:", err);
    return {
      success: false,
      message: err.message || "Unexpected error while updating transaction.",
    };
  }
}

// DELETE Transaction
export async function deleteTransaction(transactionId: string) {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, true);

    requireAdminRole(userRole);

    const res = await deleteTransactionDB({ hubId, transactionId });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to delete transaction.",
      };
    }

    return {
      success: true,
      message: "Transaction deleted successfully!",
    };
  } catch (err: any) {
    console.error("Error in deleteTransaction:", err);
    return {
      success: false,
      message: err.message || "Unexpected error while deleting transaction.",
    };
  }
}

// DELETE ALL Transactions and related Categories [Action]
export async function deleteAllTransactionsAndCategories() {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, true);

    requireAdminRole(userRole);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await deleteAllTransactionsAndCategoriesDB(hubId);

    if (!res.success) {
      return {
        success: false,
        message:
          res.message || "Failed to delete all transactions and categories.",
      };
    }

    return {
      success: true,
      message: "All transactions and related categories deleted.",
    };
  } catch (err: any) {
    console.error("Error in deleteAllTransactionsAndCategories:", err);
    return {
      success: false,
      message:
        err.message ||
        "Unexpected error while deleting all transactions and categories.",
    };
  }
}
