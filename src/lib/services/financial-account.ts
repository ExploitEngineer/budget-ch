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
export async function getFinancialAccounts(currency: string = "CHF") {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const accounts = await getFinancialAccountsDB(hubId);

    const tableData = accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      iban: acc.iban,
      balance: acc.balance,
      formattedBalance: `CHF ${Number(acc.balance).toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
      note: acc.note,
    }));

    return { status: true, tableData };
  } catch (err) {
    console.error("Error fetching financial accounts:", err);
    return { status: false, tableData: [] };
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
