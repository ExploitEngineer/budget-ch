"use server";

import {
  createTransactionDB,
  createTransactionCategoryDB,
  getAllTransactionsDB,
  getRecentTransactionsDB,
} from "@/db/queries";
import type { createTransactionArgs } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import { transaction_categories } from "@/db/schema";
import db from "@/db/db";

export async function createTransaction({
  categoryName,
  amount,
  note,
  source,
}: Pick<createTransactionArgs, "categoryName" | "amount" | "note" | "source">) {
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
    });

    return { success: true };
  } catch (err) {
    console.error("Error in CreateTransaction:", err);
    return { success: false, message: "Failed to create transaction" };
  }
}

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

export async function getAllTransactions() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, true);

    const result = await getAllTransactionsDB(hubId);

    const data = result.data;

    return { success: true, data };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to fetch transactions" };
  }
}

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
