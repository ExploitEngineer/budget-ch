"use server";

import { createFinancialAccountDB, getFinancialAccountsDB } from "@/db/queries";
import type { financialAccountArgs } from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";

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

    const { userId, hubId } = await getContext(hdrs, false);

    console.log(`UserId: ${userId}`);
    console.log(`HubId: ${hubId}`);

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
export async function getFinancialAccounts() {
  try {
    const hdrs = await headers();
    const { userId, hubId } = await getContext(hdrs, false);

    const accounts = await getFinancialAccountsDB(userId, hubId);

    const tableData = accounts.map((acc) => ({
      name: acc.name,
      type: acc.type,
      iban: acc.iban,
      balance: `CHF ${Number(acc.balance).toLocaleString("de-CH", {
        minimumFractionDigits: 2,
      })}`,
    }));

    return { status: true, tableData };
  } catch (err) {
    console.error("Error fetching financial accounts:", err);
    return { status: false, tableData: [] };
  }
}
