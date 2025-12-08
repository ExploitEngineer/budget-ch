"use server";

import {
  createFinancialAccountDB,
  getFinancialAccountsDB,
  updateFinancialAccountDB,
  deleteFinancialAccountDB,
  getSubscriptionByUserId,
  getAccountCountForHub,
} from "@/db/queries";
import type { financialAccountArgs } from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";
import { requireAdminRole } from "@/lib/auth/permissions";
import type { FinancialAccount } from "@/lib/types/domain-types";

// CREATE Financial Account [Action]
export async function createFinancialAccount({
  name,
  type,
  initialBalance,
  iban,
  note,
}: Omit<financialAccountArgs, "userId" | "hubId">) {
  try {
    const hdrs = await headers();

    const { userId, hubId, userRole } = await getContext(hdrs, false);

    requireAdminRole(userRole);

    const subscription = await getSubscriptionByUserId(userId);

    if (!subscription) {
      const existingCount = await getAccountCountForHub(userId, hubId);

      if (existingCount >= 2) {
        return {
          success: false,
          message:
            "The free plan allows only 2 financial accounts. Please upgrade to Individual or Family.",
        };
      }
    }

    await createFinancialAccountDB({
      userId,
      hubId,
      name,
      type,
      initialBalance,
      iban,
      note,
    });

    return { status: true, message: "Account created successfully" };
  } catch (err) {
    console.error(err);
    return { status: false, message: "Error creating account" };
  }
}

// READ Financial Accounts [Action]
export async function getFinancialAccounts(): Promise<{
  status: boolean;
  data?: FinancialAccount[];
  message?: string;
}> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const accounts = await getFinancialAccountsDB(hubId);

    return { status: true, data: accounts };
  } catch (err) {
    console.error("Error fetching financial accounts:", err);
    return { status: false, message: "Failed to fetch accounts" };
  }
}

// UPDATE Financial Account [Action]
export async function updateFinancialAccount(
  accountId: string,
  updatedData: any,
) {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, false);

    requireAdminRole(userRole);

    const result = await updateFinancialAccountDB({
      hubId,
      accountId,
      updatedData,
    });

    return {
      status: result.success,
      message: result.message,
      data: result.data ?? null,
    };
  } catch (err) {
    console.error("Error updating account:", err);
    return { status: false, message: "Error updating financial account" };
  }
}

// DELETE Financial Account [Action]
export async function deleteFinancialAccount(accountId: string) {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, false);

    requireAdminRole(userRole);

    const result = await deleteFinancialAccountDB({ hubId, accountId });

    return {
      status: result.success,
      message: result.message,
      data: result.data ?? null,
    };
  } catch (err) {
    console.error("Error deleting account:", err);
    return { status: false, message: "Error deleting financial account" };
  }
}
