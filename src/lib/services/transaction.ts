"use server";

import { createTransaction, createTransactionCategory } from "@/db/queries";
import type { createTransactionArgs } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";

export async function CreateTransaction({
  categoryName,
  amount,
  note,
}: Pick<createTransactionArgs, "categoryName" | "amount" | "note">) {
  try {
    const category = await createTransactionCategory(categoryName);

    const categoryId: string = category.id;

    const hdrs = await headers();
    const { userId, hubId, financialAccountId } = await getContext(hdrs, true);

    if (financialAccountId) {
      await createTransaction({
        financialAccountId,
        hubId,
        userId,
        transactionCategoryId: categoryId,
        amount,
        note,
      });
    }

    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("Financial account not found")) {
        return { success: false, reason: "NO_ACCOUNT" };
      }
    }
    console.error(err);
  }
}
