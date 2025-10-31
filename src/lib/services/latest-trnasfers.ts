"use server";

import { createLatestTransferDB } from "@/db/queries";
import type { LatestTransferArgs } from "@/db/queries";
import { getContext } from "@/lib/auth/actions";
import { headers } from "next/headers";

export async function createLatestTransfer(
  payload: Omit<LatestTransferArgs, "hubId" | "financialAccountId">,
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

  const result = await createLatestTransferDB({
    ...payload,
    financialAccountId,
    hubId,
  });

  return result;
}
