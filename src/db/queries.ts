import db from "./db";
import {
  hubs,
  hub_members,
  transactions,
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

export type createTransactionArgs = {
  financialAccountId: string;
  hubId: string;
  userId: string;
  transactionCategoryId: string;
  amount: number;
  note?: string;
  categoryName: string;
};

// create Hub
export async function createHub(userId: string, userName: string) {
  try {
    const [hub] = await db
      .insert(hubs)
      .values({ userId, name: `${userName}'s Hub` })
      .returning({ id: hubs.id });

    return hub.id;
  } catch (err) {
    console.error("Error creating Hub: ", err);
    throw new Error("Failed to create hub");
  }
}

// create Hub Member
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
    throw Error("Failed to create Hub Member");
  }
}

// create Financial Account
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

// create Transaction
export async function createTransaction({
  financialAccountId,
  hubId,
  userId,
  transactionCategoryId,
  amount,
  note,
}: Omit<createTransactionArgs, "categoryName">) {
  try {
    await db.insert(transactions).values({
      financialAccountId,
      hubId,
      userId,
      transactionCategoryId,
      amount,
      note,
    });
  } catch (err) {
    console.error("Error creating Transaction ", err);
  }
}

// create Transaction Category
export async function createTransactionCategory(name: string, hubId: string) {
  try {
    const normalized = name.trim().toLowerCase();

    // Check if category already exists (case-insensitive)
    const existingCategory = await db.query.transaction_categories.findFirst({
      where: (categories, { and, eq, sql }) =>
        and(
          sql`LOWER(${categories.name}) = ${normalized}`,
          eq(categories.hubId, hubId),
        ),
    });

    if (existingCategory) {
      throw new Error(`Category "${name}" already exists in this hub`);
    }

    // Create new category
    const [category] = await db
      .insert(transaction_categories)
      .values({
        name: normalized, // store normalized name
        hubId,
      })
      .returning();

    return category;
  } catch (err) {
    console.error("Error creating Transaction category ", err);
    throw err;
  }
}
