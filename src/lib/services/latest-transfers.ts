"use server";

import { getAccountTransfersDB } from "@/db/queries";
import { getContext } from "@/lib/auth/actions";
import { headers } from "next/headers";

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
