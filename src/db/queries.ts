import db from "./db";
import {
  hubs,
  hub_members,
  transaction_categories,
  financial_accounts,
} from "./schema";

type AccessRole = "admin" | "member";
export type createHubMemberArgs = {
  userId: string;
  hubId: string;
  accessRole: AccessRole;
  isOwner: boolean;
  userName?: string;
};

type AccountType = "checking" | "savings" | "credit-card" | "cash";
export type financialAccountArgs = {
  userId: string;
  hubId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  iban?: string;
  note?: string;
};

export async function createHub(userId: string, userName: string) {
  try {
    const [hub] = await db
      .insert(hubs)
      .values({ userId, name: `${userName}'s Hub` })
      .returning({ id: hubs.id });

    return hub.id;
  } catch (err) {
    console.error("Error creating Hub: ", err);
    return null;
  }
}

export async function createHubMember({
  userId,
  hubId,
  accessRole,
  isOwner,
}: createHubMemberArgs) {
  try {
    await db.insert(hub_members).values({
      userId,
      hubId,
      accessRole,
      isOwner,
    });
  } catch (err) {
    console.error("Error creating Hub Member: ", err);
  }
}

export async function createFinancialAccount({
  userId,
  hubId,
  name,
  type,
  initialBalance,
  iban,
  note,
}: financialAccountArgs) {
  try {
    const [account] = await db
      .insert(financial_accounts)
      .values({
        userId,
        hubId,
        name,
        type,
        initialBalance,
        iban,
        note,
      })
      .returning();

    return account;
  } catch (err) {
    console.error("Error creating financial account:", err);
    throw err;
  }
}

export async function createTransactionCategory(name: string) {
  try {
    await db.insert(transaction_categories).values({
      name,
    });
  } catch (err) {
    console.error("Error creating Transaction category ", err);
  }
}

export async function createTransaction() {}
