"use server";

import { createAccountTransferDB, getAccountTransfersDB } from "@/db/queries";
import type { AccountTransferArgs } from "@/db/queries";
import { getContext } from "@/lib/auth/actions";
import { headers } from "next/headers";

// CREATE Account Transfers [Action]
export async function createAccountTransfer(
  payload: Omit<AccountTransferArgs, "hubId" | "financialAccountId">,
) {
  const hdrs = await headers();
  const { financialAccountId, hubId } = await getContext(hdrs, true);

  if (!financialAccountId)
    return {
      success: false,
      message: "No financial account found in context.",
    };

  if (!payload.fromAccountType || !payload.toAccountType)
    return {
      success: false,
      message: "Both source and destination must be provided.",
    };

  if (payload.fromAccountType === payload.toAccountType)
    return { success: false, message: "Cannot transfer to the same account." };

  if (!payload.amount || payload.amount <= 0)
    return { success: false, message: "Amount must be greater than zero." };

  const result = await createAccountTransferDB({
    ...payload,
    financialAccountId,
    hubId,
  });

  return result;
}

// GET Account Transfers [Action]
export async function getAccountTransfers() {
  try {
    const hdrs = await headers();
    const { financialAccountId } = await getContext(hdrs, true);

    if (!financialAccountId) {
      return {
        status: false,
        message: "No financial account found in context.",
        data: [],
      };
    }

    const result = await getAccountTransfersDB(financialAccountId);

    return {
      status: result?.status ?? false,
      message: result?.message ?? "",
      data: result?.data ?? [],
    };
  } catch (err: any) {
    console.error("Error in getLatestTransactions:", err);
    return {
      status: false,
      message: err?.message || "Failed to fetch latest transfers",
      data: [],
    };
  }
}
