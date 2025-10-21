"use server";

import {
  createTransaction,
  createTransactionCategory,
  getAllTransactions,
} from "@/db/queries";
import type { createTransactionArgs } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import { transaction_categories } from "@/db/schema";
import db from "@/db/db";

export async function CreateTransaction({
  categoryName,
  amount,
  note,
}: Pick<createTransactionArgs, "categoryName" | "amount" | "note">) {
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

    await createTransaction({
      financialAccountId,
      hubId,
      userId,
      transactionCategoryId: newCategory.id,
      amount,
      note,
    });

    return { success: true };
  } catch (err) {
    console.error("Error in CreateTransaction:", err);
    return { success: false, message: "Failed to create transaction" };
  }
}

export async function CreateTransactionCategory(categoryName: string) {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, true);

    if (!hubId) throw new Error("Hub not found");

    const normalized = categoryName.trim().toLowerCase();
    const category = await createTransactionCategory(normalized, hubId);

    return { success: true, category };
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      return { success: false, reason: "DUPLICATE_CATEGORY" };
    }
    console.error(err);
    return { success: false, message: "Failed to create category" };
  }
}

export async function GetAllTransactions() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, true);

    if (!hubId) throw new Error("Hub not found");

    const result = await getAllTransactions(hubId);

    const data = result.data;

    return { success: true, data };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to fetch transactions" };
  }
}
