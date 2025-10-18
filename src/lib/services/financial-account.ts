"use server";

import { createFinancialAccount } from "@/db/queries";
import type { financialAccountArgs } from "@/db/queries";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";

export async function CreateFinancialAccount({
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

    await createFinancialAccount({
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
