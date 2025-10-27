"use server";

import {
  createTransactionDB,
  createTransactionCategoryDB,
  getTransactionsDB,
  getRecentTransactionsDB,
  updateTransactionDB,
} from "@/db/queries";
import type { createTransactionArgs } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import { transaction_categories } from "@/db/schema";
import { revalidatePath } from "next/cache";
import db from "@/db/db";
import { Transaction } from "@/app/me/transactions/_components/data-table";

// CREATE Transaction
export async function createTransaction({
  categoryName,
  amount,
  note,
  source,
  transactionType,
  accountType,
}: Pick<
  createTransactionArgs,
  | "categoryName"
  | "amount"
  | "note"
  | "source"
  | "transactionType"
  | "accountType"
>) {
  try {
    const hdrs = await headers();
    const { userId, hubId, financialAccountId } = await getContext(hdrs, true);

    if (!financialAccountId) {
      return { success: false, reason: "NO_ACCOUNT" };
    }

    const normalizedName = categoryName.trim().toLowerCase();

    const existingCategory = await db.query.transaction_categories.findFirst({
      where: (categories, { and, eq, sql }) =>
        and(
          eq(categories.hubId, hubId),
          sql`LOWER(${categories.name}) = ${normalizedName}`,
        ),
    });

    if (existingCategory) {
      return {
        success: false,
        reason: "CATEGORY_ALREADY_EXISTS",
        message: `Category "${normalizedName}" already exists. Transaction not created.`,
      };
    }

    const [newCategory] = await db
      .insert(transaction_categories)
      .values({
        hubId,
        name: normalizedName,
      })
      .returning({ id: transaction_categories.id });

    await createTransactionDB({
      financialAccountId,
      hubId,
      userId,
      transactionCategoryId: newCategory.id,
      amount,
      source,
      note,
      transactionType,
      accountType,
    });

    return { success: true };
  } catch (err) {
    console.error("Error in CreateTransaction:", err);
    return { success: false, message: "Failed to create transaction" };
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
    const { hubId } = await getContext(hdrs, true);

    const res = await getTransactionsDB(hubId);

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message ?? "Failed to fetch data",
        data: [],
      };
    }

    console.log("Transaction DB result:", res.data[0]);

    const transactions = res.data.map((tx: any) => ({
      id: tx.id,
      date: tx.date ? new Date(tx.date).toLocaleDateString("en-GB") : "—",
      source: tx.recipient || "—",
      accountType: tx.accountType || "—",
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

    const res = await getRecentTransactionsDB(hubId);

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to fetch recent transactions",
      };
    }

    console.log("SERVER ACTION RESPONSE: ", res.data);

    const transactions = (res.data ?? []).map((tx) => ({
      id: tx.id,
      date: tx.addedAt ? new Date(tx.addedAt).toLocaleDateString() : "—",
      recipient: tx.recipientName || "Unknown",
      account: tx.accountName || "—",
      category: tx.categoryName || "—",
      note: tx.note || "—",
      amount: `${tx.amount ?? 0}`,
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
// UPDATE Transaction
export async function updateTransaction(
  transactionId: string,
  formData: FormData,
) {
  try {
    const hdrs = await headers();
    const { hubId, financialAccountId } = await getContext(hdrs, true);

    if (!financialAccountId) {
      return { success: false, message: "No financial account found in context" };
    }

    const source = formData.get("source")?.toString().trim() || "";
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const note = formData.get("note")?.toString() || null;
    const addedAtStr = formData.get("addedAt")?.toString() || "";
    const addedAt = addedAtStr ? new Date(addedAtStr) : new Date();
    const accountType = formData.get("accountType")?.toString() || null;

    const categoryName = formData.get("categoryName")?.toString().trim().toLowerCase() || null;

    let transactionCategoryId: string | null = null;

    if (categoryName) {
      const existingCategory = await db.query.transaction_categories.findFirst({
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
          .insert(transaction_categories)
          .values({
            hubId,
            name: categoryName,
          })
          .returning({ id: transaction_categories.id });

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
