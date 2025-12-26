import db from "./db";
import {
  hubs,
  users,
  hubMembers,
  transactions,
  transactionCategories,
  financialAccounts,
  budgets,
  savingGoals,
  quickTasks,
  subscriptions,
  hubInvitations,
  userSettings,
  recurringTransactionTemplates,
  notifications,
  budgetInstances,
} from "./schema";
import { eq, ne, desc, gte, lte, sql, inArray, and, or, isNull, between } from "drizzle-orm";
import type {
  QuickTask,
  UserType,
  SubscriptionType,
  UserSettingsType,
  Notification,
  BudgetInstance,
} from "./schema";
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/lib/services/budget";
import type { SavingGoalsSummary } from "@/lib/services/saving-goal";
import type { TransactionType } from "@/lib/types/common-types";

export type AccessRole = "admin" | "member";

export type AccountType = "checking" | "savings" | "credit-card" | "cash";

export type financialAccountArgs = {
  userId: string;
  hubId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  iban?: string | null;
  note?: string | null;
};

export interface UpdateFinancialAccountArgs {
  hubId: string;
  accountId: string;
  updatedData: {
    name?: string;
    type?: AccountType;
    balance?: number;
    iban?: string;
    note?: string;
  };
}

interface DeleteFinancialAccountArgs {
  hubId: string;
  accountId: string;
}

export type createTransactionArgs = {
  financialAccountId: string;
  hubId: string;
  userId: string;
  transactionCategoryId: string | null;
  amount: number;
  note?: string;
  source?: string | null;
  categoryName: string;
  transactionType: TransactionType;
  destinationAccountId?: string | null;
  createdAt?: Date;
};

export type updateTransactionArgs = {
  hubId: string;
  transactionId: string;
  updatedData: {
    source?: string;
    amount?: number;
    note?: string | null;
    createdAt?: Date | string;
    transactionCategoryId?: string | null;
    financialAccountId?: string | null;
    destinationAccountId?: string | null;
    transactionType?: TransactionType;
  };
};

export type budgetArgs = {
  hubId: string;
  userId: string;
  transactionCategoryId: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  warningPercentage: number;
  markerColor: string;
};

export type savingGoalArgs = {
  hubId: string;
  userId: string;
  name: string;
  goalAmount: number;
  amountSaved: number;
  monthlyAllocation: number;
  financialAccountId?: string | null;
};

export type quickTasksArgs = {
  userId: string;
  hubId: string;
  name: string;
  checked: boolean;
};

interface GetSavingGoalsOptions {
  summaryOnly?: boolean;
  limit?: number;
}

interface UpdateSavingGoalArgs {
  hubId: string;
  goalId: string;
  updatedData: {
    name?: string;
    goalAmount?: number;
    amountSaved?: number;
    monthlyAllocation?: number;
    financialAccountId?: string | null;
    dueDate?: Date | null;
  };
}

interface HubInvitationProps {
  hubId: string;
  email: string;
  role: AccessRole;
  token: string;
  expiresAt: Date;
}

interface getHubsByUserDBProps {
  success: boolean;
  message?: string;
  data?: any[];
}

export async function updateUser(
  userId: string,
  updateData: Partial<Omit<UserType, "id" | "email">>,
): Promise<{ success: boolean; message: string; data?: UserType }> {
  try {
    // Filter out restricted fields (id and email) and undefined values
    const { id, email, ...allowedFields } = updateData as any;
    const cleanData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => value !== undefined),
    );

    // If no fields to update, return early
    if (Object.keys(cleanData).length === 0) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      return { success: true, message: "No fields to update", data: user };
    }

    const [updatedUser] = await db
      .update(users)
      .set(cleanData)
      .where(eq(users.id, userId))
      .returning();

    return {
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    };
  } catch (err) {
    console.error("Error updating user: ", err);
    return {
      success: false,
      message: `Failed to update user: ${(err as Error).message}`,
    };
  }
}

export async function getUserByStripeCustomerId(
  stripeCustomerId: string,
): Promise<UserType | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.stripeCustomerId, stripeCustomerId),
    });
    return user ?? null;
  } catch (err) {
    console.error("Error fetching user by Stripe customer ID: ", err);
    throw err;
  }
}

export async function getSubscriptionByUserId(
  userId: string,
): Promise<SubscriptionType | null> {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });
    return subscription ?? null;
  } catch (err) {
    console.error("Error fetching subscription by user ID: ", err);
    throw err;
  }
}

export async function getSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string,
): Promise<SubscriptionType | null> {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
    });
    return subscription ?? null;
  } catch (err) {
    console.error(
      "Error fetching subscription by Stripe subscription ID: ",
      err,
    );
    throw err;
  }
}

export type SubscriptionInsertInput = Omit<
  SubscriptionType,
  "id" | "createdAt" | "updatedAt"
>;

export async function createSubscriptionRecord(
  input: SubscriptionInsertInput,
): Promise<SubscriptionType> {
  try {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return subscription;
  } catch (err) {
    console.error("Error creating subscription record: ", err);
    throw err;
  }
}

export type SubscriptionUpdateInput = Partial<
  Omit<SubscriptionType, "id" | "userId" | "createdAt">
>;

export async function updateSubscriptionRecord(
  subscriptionId: string,
  updates: SubscriptionUpdateInput,
): Promise<SubscriptionType | null> {
  try {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    return subscription ?? null;
  } catch (err) {
    console.error("Error updating subscription record: ", err);
    throw err;
  }
}

export async function deleteSubscriptionRecord(
  subscriptionId: string,
): Promise<void> {
  try {
    await db.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));
  } catch (err) {
    console.error("Error deleting subscription record: ", err);
    throw err;
  }
}

// GET user by email
export async function getUserByEmailDB(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(sql`lower(${users.email})`, email.toLowerCase()),
      columns: {
        id: true,
        name: true,
        email: true,
        stripeCustomerId: true,
        language: true,
      },
    });
    return user;
  } catch (err) {
    console.error("Error fetching user by email: ", err);
    return null;
  }
}

// GET user email
export async function getUserEmailDB(userId: string) {
  try {
    const userEmail = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        email: true,
      },
    });

    return { success: true, data: userEmail };
  } catch (err: any) {
    console.error("Error fetching user email: ", err);
    return {
      success: false,
      message: err.message || "Error fetching user email",
    };
  }
}

// CHECK if user onboarding is complete
export async function isUserOnboardingCompleteDB(
  userId: string,
): Promise<boolean> {
  try {
    // Check if user has stripe customer ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { stripeCustomerId: true },
    });

    if (!user || !user.stripeCustomerId) {
      return false;
    }

    // Check if user has a hub
    const hub = await db.query.hubs.findFirst({
      where: eq(hubs.userId, userId),
      columns: { id: true },
    });

    if (!hub) {
      return false;
    }

    // Check if user has a hub member record
    const hubMember = await db.query.hubMembers.findFirst({
      where: (hm) => and(eq(hm.userId, userId), eq(hm.hubId, hub.id)),
      columns: { userId: true },
    });

    if (!hubMember) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error checking user onboarding status: ", err);
    return false;
  }
}

// Complete user onboarding - checks for existing records and creates missing ones
// This function only handles DB operations, no external API calls
export async function completeUserOnboardingDB({
  userId,
  userName,
  stripeCustomerId,
}: {
  userId: string;
  userName: string;
  stripeCustomerId: string;
}): Promise<{
  success: boolean;
  message: string;
  data?: { hubId: string };
}> {
  try {
    // Check current state
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { stripeCustomerId: true },
    });

    const existingHub = await db.query.hubs.findFirst({
      where: eq(hubs.userId, userId),
      columns: { id: true },
    });

    let hubId: string;

    if (existingHub) {
      hubId = existingHub.id;

      // Check if hub member exists
      const hubMember = await db.query.hubMembers.findFirst({
        where: (hm) => and(eq(hm.userId, userId), eq(hm.hubId, hubId)),
        columns: { userId: true },
      });

      if (hubMember) {
        // Hub and hub member exist, just update stripe customer ID if needed
        if (!user?.stripeCustomerId) {
          await db
            .update(users)
            .set({ stripeCustomerId })
            .where(eq(users.id, userId));
        }
        return {
          success: true,
          message: "User onboarding already complete",
          data: { hubId },
        };
      }

      // Hub exists but no hub member - create hub member and update stripe
      await db.transaction(async (tx) => {
        await tx.insert(hubMembers).values({
          userId,
          hubId,
          accessRole: "admin",
          isOwner: true,
        });

        if (!user?.stripeCustomerId) {
          await tx
            .update(users)
            .set({ stripeCustomerId })
            .where(eq(users.id, userId));
        }
      });

      return {
        success: true,
        message: "User onboarding completed successfully",
        data: { hubId },
      };
    }

    // No hub exists - create everything in a transaction
    const result = await db.transaction(async (tx) => {
      // Create hub
      const [hub] = await tx
        .insert(hubs)
        .values({ userId, name: `${userName}'s Hub` })
        .returning({ id: hubs.id });

      // Create hub member
      await tx.insert(hubMembers).values({
        userId,
        hubId: hub.id,
        accessRole: "admin",
        isOwner: true,
      });

      // Update user with stripe customer ID
      await tx
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, userId));

      return { hubId: hub.id };
    });

    return {
      success: true,
      message: "User onboarding completed successfully",
      data: result,
    };
  } catch (err) {
    console.error("Error completing user onboarding: ", err);
    return {
      success: false,
      message: `Failed to complete user onboarding: ${(err as Error).message}`,
    };
  }
}

// CREATE Hub
export async function createHubDB(userId: string, userName: string) {
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

// CREATE Financial Account
export async function createFinancialAccountDB({
  userId,
  hubId,
  name,
  type,
  initialBalance,
  iban,
  note,
}: financialAccountArgs) {
  try {
    const existing = await db.query.financialAccounts.findFirst({
      where: (a) => and(eq(a.hubId, hubId), eq(a.type, type)),
      columns: { id: true },
    });

    if (existing) {
      throw new Error(`An account of type ${type} already exists in this hub.`);
    }

    const [account] = await db
      .insert(financialAccounts)
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

// UPDATE Financial Account
export async function updateFinancialAccountDB({
  hubId,
  accountId,
  updatedData,
}: UpdateFinancialAccountArgs) {
  try {
    const account = await db.query.financialAccounts.findFirst({
      where: (a) => eq(a.id, accountId),
      columns: { id: true, hubId: true },
    });

    if (!account) {
      return { success: false, message: "Financial account not found." };
    }

    if (account.hubId !== hubId) {
      return { success: false, message: "Access denied." };
    }

    const cleanData = Object.fromEntries(
      Object.entries({
        name: updatedData.name,
        type: updatedData.type,
        initialBalance: updatedData.balance,
        iban: updatedData.iban,
        note: updatedData.note,
      }).filter(([_, v]) => v !== undefined),
    );

    const [updatedAccount] = await db
      .update(financialAccounts)
      .set(cleanData)
      .where(eq(financialAccounts.id, accountId))
      .returning();

    return {
      success: true,
      message: "Financial account updated successfully.",
      data: updatedAccount,
    };
  } catch (err: any) {
    console.error("Error updating financial account:", err);
    return {
      success: false,
      message: err.message || "Failed to update financial account.",
    };
  }
}

// DELETE Financial Account
export async function deleteFinancialAccountDB({
  hubId,
  accountId,
}: DeleteFinancialAccountArgs) {
  try {
    const account = await db.query.financialAccounts.findFirst({
      where: (a) => eq(a.id, accountId),
      columns: { id: true, hubId: true },
    });

    if (!account) {
      return { success: false, message: "Financial account not found." };
    }

    if (account.hubId !== hubId) {
      return { success: false, message: "Access denied." };
    }

    const [deletedAccount] = await db
      .delete(financialAccounts)
      .where(eq(financialAccounts.id, accountId))
      .returning();

    return {
      success: true,
      message: "Financial account deleted successfully.",
      data: deletedAccount,
    };
  } catch (err: any) {
    console.error("Error deleting financial account:", err);
    return {
      success: false,
      message: err.message || "Failed to delete financial account.",
    };
  }
}

// READ Financial Account
export async function getFinancialAccountsDB(hubId: string) {
  try {
    const results = await db
      .select()
      .from(financialAccounts)
      .where(and(eq(financialAccounts.hubId, hubId)));

    return results;
  } catch (err) {
    console.error("Error fetching financial accounts:", err);
    return [];
  }
}

// GET financial account by user, hub, and type
export async function getFinancialAccountByType(
  userId: string,
  hubId: string,
  accountType: AccountType,
) {
  try {
    return await db.query.financialAccounts.findFirst({
      where: (a) =>
        and(eq(a.userId, userId), eq(a.hubId, hubId), eq(a.type, accountType)),
    });
  } catch (err) {
    console.error("Error fetching account by type:", err);
    return null;
  }
}

// GET financial account by ID
export async function getFinancialAccountById(
  accountId: string,
  hubId: string,
) {
  try {
    return await db.query.financialAccounts.findFirst({
      where: (a) => and(eq(a.id, accountId), eq(a.hubId, hubId)),
    });
  } catch (err) {
    console.error("Error fetching account by ID:", err);
    return null;
  }
}

// CREATE Transaction
export async function createTransactionDB({
  financialAccountId,
  hubId,
  userId,
  transactionCategoryId,
  amount,
  source,
  note,
  transactionType,
  destinationAccountId,
  recurringTemplateId,
  createdAt,
}: Omit<createTransactionArgs, "categoryName"> & {
  recurringTemplateId?: string | null;
}) {
  try {
    await db.insert(transactions).values({
      financialAccountId,
      hubId,
      userId,
      transactionCategoryId,
      amount,
      source,
      note,
      type: transactionType,
      destinationAccountId: transactionType === "transfer" ? destinationAccountId : null,
      recurringTemplateId: recurringTemplateId || null,
      createdAt: createdAt || new Date(),
    });

    return { success: true, message: "Transaction created successfully" };
  } catch (err: any) {
    console.error("Error creating Transaction ", err);
    return {
      success: false,
      message: err.message || "Failed to create transaction",
    };
  }
}

// GET Transactions
export async function getTransactionsDB(
  hubId: string,
  limit?: number,
) {
  try {
    let query = db
      .select({
        id: transactions.id,
        hubId: transactions.hubId,
        userId: transactions.userId,
        financialAccountId: transactions.financialAccountId,
        destinationAccountId: transactions.destinationAccountId,
        transactionCategoryId: transactions.transactionCategoryId,
        recurringTemplateId: transactions.recurringTemplateId,
        type: transactions.type,
        source: transactions.source,
        amount: transactions.amount,
        note: transactions.note,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        categoryName: transactionCategories.name,
        accountName: financialAccounts.name,
        userName: users.name,
      })
      .from(transactions)
      .leftJoin(
        transactionCategories,
        eq(transactions.transactionCategoryId, transactionCategories.id),
      )
      .leftJoin(
        financialAccounts,
        eq(transactions.financialAccountId, financialAccounts.id),
      )
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.hubId, hubId))
      .orderBy(desc(transactions.createdAt));

    if (limit) query.limit(limit);

    const results = await query;

    return { success: true, data: results };
  } catch (err: any) {
    console.error("Error fetching transactions:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch transactions",
    };
  }
}

// UPDATE Transaction
export async function updateTransactionDB({
  hubId,
  transactionId,
  updatedData,
}: updateTransactionArgs) {
  try {
    const tx = await db.query.transactions.findFirst({
      where: (tx) => eq(tx.id, transactionId),
      columns: { hubId: true },
    });

    if (!tx) return { success: false, message: "Transaction not found" };
    if (tx.hubId !== hubId) return { success: false, message: "Access denied" };

    const normalized = {
      source: updatedData.source,
      amount: updatedData.amount,
      note: updatedData.note,
      createdAt:
        typeof updatedData.createdAt === "string"
          ? new Date(updatedData.createdAt)
          : updatedData.createdAt,
      transactionCategoryId: updatedData.transactionCategoryId,
      financialAccountId: updatedData.financialAccountId,
      destinationAccountId: updatedData.destinationAccountId,
      type: updatedData.transactionType,
    };

    const cleanData = Object.fromEntries(
      Object.entries(normalized).filter(([_, value]) => value !== undefined),
    );

    const [updatedTx] = await db
      .update(transactions)
      .set(cleanData)
      .where(eq(transactions.id, transactionId))
      .returning();

    return { success: true, data: updatedTx };
  } catch (err: any) {
    console.error("Error updating transaction:", err);
    return {
      success: false,
      message: err.message || "Failed to update transaction",
    };
  }
}

// DELETE Transaction
export async function deleteTransactionDB({
  hubId,
  transactionId,
}: {
  hubId: string;
  transactionId: string;
}) {
  try {
    const tx = await db.query.transactions.findFirst({
      where: (tx) => eq(tx.id, transactionId),
      columns: { hubId: true, transactionCategoryId: true },
    });

    if (!tx) return { success: false, message: "Transaction not found" };
    if (tx.hubId !== hubId) return { success: false, message: "Access denied" };

    const categoryId = tx.transactionCategoryId;

    const deleted = await db
      .delete(transactions)
      .where(eq(transactions.id, transactionId))
      .returning();

    if (categoryId) {
      await db
        .delete(transactionCategories)
        .where(eq(transactionCategories.id, categoryId));
    }

    return { success: true, data: deleted[0] };
  } catch (err: any) {
    console.error("Error deleting transaction:", err);
    return {
      success: false,
      message: err.message || "Failed to delete transaction",
    };
  }
}

// DELETE Multiple Transactions
export async function deleteTransactionsDB({
  hubId,
  transactionIds,
}: {
  hubId: string;
  transactionIds: string[];
}) {
  try {
    if (!transactionIds || transactionIds.length === 0) {
      return { success: false, message: "No transaction IDs provided" };
    }

    // Verify all transactions belong to the hub
    const txs = await db.query.transactions.findMany({
      where: (tx) => inArray(tx.id, transactionIds),
      columns: { id: true, hubId: true, transactionCategoryId: true },
    });

    if (txs.length === 0) {
      return { success: false, message: "No transactions found" };
    }

    // Check if all transactions belong to the hub
    const invalidTxs = txs.filter((tx) => tx.hubId !== hubId);
    if (invalidTxs.length > 0) {
      return { success: false, message: "Access denied to some transactions" };
    }

    // Get unique category IDs that will be orphaned
    const categoryIds = txs
      .map((tx) => tx.transactionCategoryId)
      .filter((id): id is string => !!id);

    // Delete transactions
    const deleted = await db
      .delete(transactions)
      .where(
        and(
          inArray(transactions.id, transactionIds),
          eq(transactions.hubId, hubId),
        ),
      )
      .returning();


    return { success: true, data: deleted, count: deleted.length };
  } catch (err: any) {
    console.error("Error deleting transactions:", err);
    return {
      success: false,
      message: err.message || "Failed to delete transactions",
    };
  }
}

// CREATE Transaction Category
export async function createTransactionCategoryDB(name: string, hubId: string) {
  try {
    const normalized = name.trim().toLowerCase();

    const existingCategory = await db.query.transactionCategories.findFirst({
      where: (categories, { and, eq, sql }) =>
        and(
          sql`LOWER(${categories.name}) = ${normalized}`,
          eq(categories.hubId, hubId),
        ),
    });

    if (existingCategory) {
      throw new Error(`Category "${name}" already exists in this hub`);
    }

    const [category] = await db
      .insert(transactionCategories)
      .values({
        name: normalized,
        hubId,
      })
      .returning();

    return category;
  } catch (err) {
    console.error("Error creating Transaction category ", err);
    throw err;
  }
}

// CREATE Recurring Transaction Template
export type CreateRecurringTransactionTemplateArgs = {
  hubId: string;
  userId: string;
  financialAccountId: string;
  transactionCategoryId: string | null;
  type: TransactionType;
  source: string | null;
  amount: number;
  note: string | null;
  frequencyDays: number;
  startDate: Date;
  endDate: Date | null;
  status: "active" | "inactive";
  destinationAccountId?: string | null;
};

export async function createRecurringTransactionTemplateDB({
  hubId,
  userId,
  financialAccountId,
  transactionCategoryId,
  type,
  source,
  amount,
  note,
  frequencyDays,
  startDate,
  endDate,
  status,
  destinationAccountId,
}: CreateRecurringTransactionTemplateArgs) {
  try {
    const [template] = await db
      .insert(recurringTransactionTemplates)
      .values({
        hubId,
        userId,
        financialAccountId,
        destinationAccountId: type === "transfer" ? destinationAccountId : null,
        transactionCategoryId,
        type,
        source,
        amount,
        note,
        frequencyDays,
        startDate,
        endDate,
        status,
      })
      .returning();

    return { success: true, data: template };
  } catch (err: any) {
    console.error("Error creating recurring transaction template:", err);
    return {
      success: false,
      message: err.message || "Failed to create recurring transaction template",
    };
  }
}

// UPDATE Recurring Transaction Template
export type UpdateRecurringTransactionTemplateArgs = {
  templateId: string;
  hubId: string;
  updatedData: {
    financialAccountId?: string;
    transactionCategoryId?: string | null;
    type?: TransactionType;
    source?: string | null;
    amount?: number;
    note?: string | null;
    frequencyDays?: number;
    startDate?: Date;
    endDate?: Date | null;
    status?: "active" | "inactive";
    destinationAccountId?: string | null;
  };
};

export async function updateRecurringTransactionTemplateDB({
  templateId,
  hubId,
  updatedData,
}: UpdateRecurringTransactionTemplateArgs) {
  try {
    // Verify template exists and belongs to hub
    const template = await db.query.recurringTransactionTemplates.findFirst({
      where: (templates, { and, eq }) =>
        and(eq(templates.id, templateId), eq(templates.hubId, hubId)),
    });

    if (!template) {
      return {
        success: false,
        message: "Recurring transaction template not found",
      };
    }

    const [updated] = await db
      .update(recurringTransactionTemplates)
      .set({
        ...updatedData,
        updatedAt: new Date(),
      })
      .where(eq(recurringTransactionTemplates.id, templateId))
      .returning();

    return { success: true, data: updated };
  } catch (err: any) {
    console.error("Error updating recurring transaction template:", err);
    return {
      success: false,
      message: err.message || "Failed to update recurring transaction template",
    };
  }
}

// GET Recurring Transaction Templates by Hub
export async function getRecurringTransactionTemplatesDB(hubId: string) {
  try {
    const templates = await db
      .select({
        id: recurringTransactionTemplates.id,
        hubId: recurringTransactionTemplates.hubId,
        userId: recurringTransactionTemplates.userId,
        financialAccountId: recurringTransactionTemplates.financialAccountId,
        destinationAccountId: recurringTransactionTemplates.destinationAccountId,
        transactionCategoryId: recurringTransactionTemplates.transactionCategoryId,
        type: recurringTransactionTemplates.type,
        source: recurringTransactionTemplates.source,
        amount: recurringTransactionTemplates.amount,
        note: recurringTransactionTemplates.note,
        frequencyDays: recurringTransactionTemplates.frequencyDays,
        startDate: recurringTransactionTemplates.startDate,
        endDate: recurringTransactionTemplates.endDate,
        status: recurringTransactionTemplates.status,
        createdAt: recurringTransactionTemplates.createdAt,
        updatedAt: recurringTransactionTemplates.updatedAt,
        // Related data
        accountName: financialAccounts.name,
        accountType: financialAccounts.type,
        categoryName: transactionCategories.name,
      })
      .from(recurringTransactionTemplates)
      .leftJoin(
        financialAccounts,
        eq(
          recurringTransactionTemplates.financialAccountId,
          financialAccounts.id,
        ),
      )
      .leftJoin(
        transactionCategories,
        eq(
          recurringTransactionTemplates.transactionCategoryId,
          transactionCategories.id,
        ),
      )
      .where(
        and(
          eq(recurringTransactionTemplates.hubId, hubId),
          eq(recurringTransactionTemplates.status, "active"),
        ),
      )
      .orderBy(recurringTransactionTemplates.startDate);

    // Fetch destination account names separately if needed
    const templatesWithDestAccounts = await Promise.all(
      templates.map(async (template) => {
        if (template.destinationAccountId) {
          const destAccount = await db.query.financialAccounts.findFirst({
            where: (accounts, { eq }) => eq(accounts.id, template.destinationAccountId!),
            columns: { name: true },
          });
          return {
            ...template,
            destinationAccountName: destAccount?.name ?? null,
          };
        }
        return { ...template, destinationAccountName: null };
      }),
    );

    return templatesWithDestAccounts;
  } catch (err: any) {
    console.error("Error fetching recurring transaction templates:", err);
    throw err;
  }
}

// GET Single Recurring Transaction Template by ID
export async function getRecurringTransactionTemplateByIdDB(
  templateId: string,
  hubId: string,
) {
  try {
    const template = await db
      .select({
        id: recurringTransactionTemplates.id,
        hubId: recurringTransactionTemplates.hubId,
        userId: recurringTransactionTemplates.userId,
        financialAccountId: recurringTransactionTemplates.financialAccountId,
        destinationAccountId: recurringTransactionTemplates.destinationAccountId,
        transactionCategoryId: recurringTransactionTemplates.transactionCategoryId,
        type: recurringTransactionTemplates.type,
        source: recurringTransactionTemplates.source,
        amount: recurringTransactionTemplates.amount,
        note: recurringTransactionTemplates.note,
        frequencyDays: recurringTransactionTemplates.frequencyDays,
        startDate: recurringTransactionTemplates.startDate,
        endDate: recurringTransactionTemplates.endDate,
        status: recurringTransactionTemplates.status,
        createdAt: recurringTransactionTemplates.createdAt,
        updatedAt: recurringTransactionTemplates.updatedAt,
        // Related data
        accountName: financialAccounts.name,
        accountType: financialAccounts.type,
        categoryName: transactionCategories.name,
      })
      .from(recurringTransactionTemplates)
      .leftJoin(
        financialAccounts,
        eq(
          recurringTransactionTemplates.financialAccountId,
          financialAccounts.id,
        ),
      )
      .leftJoin(
        transactionCategories,
        eq(
          recurringTransactionTemplates.transactionCategoryId,
          transactionCategories.id,
        ),
      )
      .where(
        and(
          eq(recurringTransactionTemplates.id, templateId),
          eq(recurringTransactionTemplates.hubId, hubId),
        ),
      )
      .limit(1);

    if (!template || template.length === 0) {
      return null;
    }

    const result = template[0];

    // Fetch destination account name if needed
    if (result.destinationAccountId) {
      const destAccount = await db.query.financialAccounts.findFirst({
        where: (accounts, { eq }) => eq(accounts.id, result.destinationAccountId!),
        columns: { name: true },
      });
      return {
        ...result,
        destinationAccountName: destAccount?.name ?? null,
      };
    }

    return { ...result, destinationAccountName: null };
  } catch (err: any) {
    console.error("Error fetching recurring transaction template:", err);
    throw err;
  }
}

// CREATE Budget
export async function createBudgetDB({
  hubId,
  userId,
  categoryName,
  allocatedAmount,
  spentAmount,
  warningPercentage,
  markerColor,
}: CreateBudgetInput) {
  try {
    const normalizedName = categoryName.trim().toLowerCase();

    // Find or create the category
    let category = await db.query.transactionCategories.findFirst({
      where: (categories, { and, eq, sql }) =>
        and(
          sql`LOWER(${categories.name}) = ${normalizedName}`,
          eq(categories.hubId, hubId),
        ),
    });

    // If category doesn't exist, create it
    if (!category) {
      const [newCategory] = await db
        .insert(transactionCategories)
        .values({
          name: normalizedName,
          hubId,
        })
        .returning();
      category = newCategory;
    }

    // Check if a budget already exists for this category in this hub
    const existingBudget = await db.query.budgets.findFirst({
      where: (b, { and, eq }) =>
        and(
          eq(b.hubId, hubId),
          eq(b.transactionCategoryId, category!.id),
        ),
    });

    if (existingBudget) {
      return {
        success: false,
        message: `A budget already exists for category "${categoryName}"`,
      };
    }

    // Create the budget
    await db.insert(budgets).values({
      hubId,
      userId,
      transactionCategoryId: category.id,
      allocatedAmount,
      spentAmount,
      warningPercentage,
      markerColor,
    });

    return { success: true, message: "Budget created successfully" };
  } catch (err: any) {
    console.error("Error creating Budget:", err);
    return {
      success: false,
      message: err.message || "Failed to create budget",
    };
  }
}

// CREATE Saving Goal
export async function createSavingGoalDB({
  hubId,
  userId,
  name,
  goalAmount,
  amountSaved,
  monthlyAllocation,
  financialAccountId,
}: savingGoalArgs) {
  try {
    await db.insert(savingGoals).values({
      hubId,
      userId,
      name,
      goalAmount,
      amountSaved,
      monthlyAllocation,
      financialAccountId: financialAccountId || null,
    });

    return { success: true, message: "Saving goal created successfully" };
  } catch (err: any) {
    console.error("Error creating saving goal:", err);
    return {
      success: false,
      message: err.message || "Failed to create saving goal",
    };
  }
}

// GET Savings Goals
export async function getSavingGoalsDB(
  hubId: string,
  options: GetSavingGoalsOptions = {},
): Promise<{
  success: boolean;
  data?: import("@/db/schema").SavingGoal[] | SavingGoalsSummary;
  message?: string;
}> {
  try {
    const { summaryOnly = false, limit } = options;

    let query = db
      .select()
      .from(savingGoals)
      .where(eq(savingGoals.hubId, hubId))
      .orderBy(desc(savingGoals.dueDate));

    if (limit) query.limit(limit);

    const goals = await query;

    if (summaryOnly) {
      const totalTarget = goals.reduce(
        (sum, g) => sum + (g.goalAmount ?? 0),
        0,
      );
      const totalSaved = goals.reduce(
        (sum, g) => sum + (g.amountSaved ?? 0),
        0,
      );
      const remainingToSave = totalTarget - totalSaved;

      // Sum total monthly allocation across all goals
      const totalMonthlyAllocation = goals.reduce(
        (sum, g) => sum + (g.monthlyAllocation ?? 0),
        0,
      );

      // Count overdue goals (past due date and not achieved)
      const today = new Date();
      const overdueGoalsCount = goals.filter(g => {
        if (!g.dueDate) return false; // No due date = not overdue
        const dueDate = new Date(g.dueDate);
        const amountSaved = g.amountSaved ?? 0;
        const goalAmount = g.goalAmount ?? 0;
        return dueDate < today && amountSaved < goalAmount;
      }).length;

      return {
        success: true,
        data: {
          totalTarget,
          totalSaved,
          remainingToSave,
          totalGoals: goals.length,
          overdueGoalsCount,
          totalMonthlyAllocation,
        },
      };
    }

    return { success: true, data: goals };
  } catch (err: any) {
    console.error("Error fetching saving goals:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch saving goals",
    };
  }
}

// UPDATE Saving Goal
export async function updateSavingGoalDB({
  hubId,
  goalId,
  updatedData,
}: UpdateSavingGoalArgs) {
  try {
    const goal = await db.query.savingGoals.findFirst({
      where: (g) => eq(g.id, goalId),
      columns: { id: true, hubId: true },
    });

    if (!goal) {
      return { success: false, message: "Saving goal not found." };
    }

    if (goal.hubId !== hubId) {
      return { success: false, message: "Access denied." };
    }

    const cleanData = Object.fromEntries(
      Object.entries({
        name: updatedData.name,
        goalAmount: updatedData.goalAmount,
        amountSaved: updatedData.amountSaved,
        monthlyAllocation: updatedData.monthlyAllocation,
        financialAccountId: updatedData.financialAccountId ?? null,
        dueDate: updatedData.dueDate ?? null,
      }).filter(([_, v]) => v !== undefined),
    );

    const [updatedGoal] = await db
      .update(savingGoals)
      .set(cleanData)
      .where(eq(savingGoals.id, goalId))
      .returning();

    return {
      success: true,
      message: "Saving goal updated successfully.",
      data: updatedGoal,
    };
  } catch (err: any) {
    console.error("Error updating saving goal:", err);
    return {
      success: false,
      message: err.message || "Failed to update saving goal.",
    };
  }
}

// DELETE Saving Goal
export async function deleteSavingGoalDB({
  hubId,
  goalId,
}: {
  hubId: string;
  goalId: string;
}) {
  try {
    const goal = await db.query.savingGoals.findFirst({
      where: (g) => eq(g.id, goalId),
      columns: { hubId: true },
    });

    if (!goal) return { success: false, message: "Saving goal not found." };
    if (goal.hubId !== hubId)
      return { success: false, message: "Access denied." };

    const deleted = await db
      .delete(savingGoals)
      .where(eq(savingGoals.id, goalId))
      .returning();

    return {
      success: true,
      message: "Saving goal deleted successfully.",
      data: deleted[0],
    };
  } catch (err: any) {
    console.error("Error deleting saving goal:", err);
    return {
      success: false,
      message: err.message || "Failed to delete saving goal.",
    };
  }
}

// CREATE Task
export async function createTaskDB({
  userId,
  hubId,
  name,
  checked = false,
}: {
  userId: string;
  hubId: string;
  name: string;
  checked?: boolean;
}) {
  try {
    await db.insert(quickTasks).values({
      userId,
      hubId,
      name,
      checked,
    });
    return { success: true, message: "Task created successfully" };
  } catch (err: any) {
    console.error("Error creating task", err);
    return { success: false, message: err.message || "Failed to create task" };
  }
}

// GET Tasks
export async function getTasksByHubDB(hubId: string): Promise<{
  success: boolean;
  data?: QuickTask[];
  message?: string;
}> {
  try {
    const tasks = await db
      .select()
      .from(quickTasks)
      .where(eq(quickTasks.hubId, hubId))
      .orderBy(quickTasks.name);

    return { success: true, data: tasks };
  } catch (err: any) {
    console.error("Error fetching tasks", err);
    return { success: false, message: err.message || "Failed to fetch tasks" };
  }
}

// UPDATE Task
export async function updateTaskDB({
  taskId,
  name,
  checked,
}: {
  taskId: string;
  name?: string;
  checked?: boolean;
}) {
  try {
    await db
      .update(quickTasks)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(checked !== undefined ? { checked } : {}),
      })
      .where(eq(quickTasks.id, taskId));

    return { success: true, message: "Task updated successfully" };
  } catch (err: any) {
    console.error("Error updating task", err);
    return { success: false, message: err.message || "Failed to update task" };
  }
}

// DELETE Task
export async function deleteTaskDB(taskId: string) {
  try {
    await db.delete(quickTasks).where(eq(quickTasks.id, taskId));
    return { success: true, message: "Task deleted successfully" };
  } catch (err: any) {
    console.error("Error deleting task", err);
    return { success: false, message: err.message || "Failed to delete task" };
  }
}

// GET Budgets - Returns canonical BudgetWithCategory[] domain type
export async function getBudgetsDB(
  hubId: string,
  limit?: number,
): Promise<{
  success: boolean;
  data?: Array<{
    id: string | null;
    hubId: string;
    userId: string | null;
    transactionCategoryId: string;
    allocatedAmount: number | null;
    spentAmount: number | null;
    calculatedSpentAmount: number;
    warningPercentage: number | null;
    markerColor: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    categoryName: string | null;
  }>;
  message?: string;
}> {
  try {
    // Create a subquery to calculate net spent amounts from transactions for each category
    // Net spent = expenses - income (but not less than 0)
    const spentAmountsSubquery = db
      .select({
        transactionCategoryId: transactions.transactionCategoryId,
        totalSpent: sql<number>`
          GREATEST(
            COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0),
            0
          )
        `.as("totalSpent"),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.hubId, hubId),
          or(
            eq(transactions.type, "expense"),
            eq(transactions.type, "income"),
          ),
          sql`${transactions.transactionCategoryId} IS NOT NULL`,
        ),
      )
      .groupBy(transactions.transactionCategoryId)
      .as("spentAmounts");

    const query = db
      .select({
        id: budgets.id,
        hubId: transactionCategories.hubId,
        userId: budgets.userId,
        transactionCategoryId: transactionCategories.id,
        allocatedAmount: budgets.allocatedAmount,
        spentAmount: budgets.spentAmount, // IST - stored initial spent amount
        calculatedSpentAmount: sql<number>`COALESCE(${spentAmountsSubquery.totalSpent}, 0)`.as(
          "calculatedSpentAmount",
        ),
        warningPercentage: budgets.warningPercentage,
        markerColor: budgets.markerColor,
        createdAt: budgets.createdAt,
        updatedAt: budgets.updatedAt,
        categoryName: transactionCategories.name,
      })
      .from(transactionCategories)
      .leftJoin(
        budgets,
        eq(budgets.transactionCategoryId, transactionCategories.id),
      )
      .leftJoin(
        spentAmountsSubquery,
        eq(
          spentAmountsSubquery.transactionCategoryId,
          transactionCategories.id,
        ),
      )
      .where(eq(transactionCategories.hubId, hubId))
      .orderBy(desc(transactionCategories.createdAt));

    if (limit) {
      const results = await query.limit(limit);
      return { success: true, data: results };
    }

    const results = await query;
    return { success: true, data: results };
  } catch (err: any) {
    console.error("Error fetching budgets:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch budgets",
    };
  }
}

// GET Budgets by Month - Returns canonical BudgetWithCategory[] domain type
export async function getBudgetsByMonthDB(
  hubId: string,
  month: number,
  year: number,
  limit?: number,
): Promise<{
  success: boolean;
  data?: Array<{
    id: string | null;
    hubId: string;
    userId: string | null;
    transactionCategoryId: string;
    allocatedAmount: number | null;
    spentAmount: number | null;
    calculatedSpentAmount: number;
    carriedOverAmount: number;
    warningPercentage: number | null;
    markerColor: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    categoryName: string | null;
    isInstance: boolean; // Flag to indicate if this is from an instance
  }>;
  message?: string;
}> {
  try {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Create a subquery to calculate gross spent amounts from transactions for each category
    // Gross spent = sum of expenses
    // FILTERED by Month/Year
    const spentAmountsSubquery = db
      .select({
        transactionCategoryId: transactions.transactionCategoryId,
        totalSpent: sql<number>`
          COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)
        `.as("totalSpent"),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.hubId, hubId),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate),
          or(
            eq(transactions.type, "expense"),
            eq(transactions.type, "income"),
          ),
          sql`${transactions.transactionCategoryId} IS NOT NULL`,
        ),
      )
      .groupBy(transactions.transactionCategoryId)
      .as("spentAmounts");

    const query = db
      .selectDistinctOn([transactionCategories.id], {
        id: budgets.id,
        hubId: transactionCategories.hubId,
        userId: budgets.userId,
        transactionCategoryId: transactionCategories.id,
        // Coalesce: Use Instance amount if exists, else Template amount
        allocatedAmount: sql<number>`COALESCE(${budgetInstances.allocatedAmount}, ${budgets.allocatedAmount})`.as(
          "allocatedAmount",
        ),
        spentAmount: budgets.spentAmount, // IST - stored initial spent amount (Warning: this is static!)
        calculatedSpentAmount: sql<number>`COALESCE(${spentAmountsSubquery.totalSpent}, 0)`.as(
          "calculatedSpentAmount",
        ),
        carriedOverAmount: sql<number>`COALESCE(${budgetInstances.carriedOverAmount}, 0)`.as("carriedOverAmount"),
        warningPercentage: budgets.warningPercentage,
        markerColor: budgets.markerColor,
        createdAt: budgets.createdAt,
        updatedAt: budgets.updatedAt,
        categoryName: transactionCategories.name,
        isInstance: sql<boolean>`CASE WHEN ${budgetInstances.id} IS NOT NULL THEN true ELSE false END`.as("isInstance"),
      })
      .from(transactionCategories)
      .leftJoin(
        budgets,
        and(
          eq(budgets.transactionCategoryId, transactionCategories.id),
          lte(budgets.createdAt, endDate),
        ),
      )
      .leftJoin(
        budgetInstances,
        and(
          eq(budgetInstances.budgetId, budgets.id),
          eq(budgetInstances.month, month),
          eq(budgetInstances.year, year),
        ),
      )
      .leftJoin(
        spentAmountsSubquery,
        eq(
          spentAmountsSubquery.transactionCategoryId,
          transactionCategories.id,
        ),
      )
      .where(eq(transactionCategories.hubId, hubId))
      .orderBy(transactionCategories.id, desc(transactionCategories.createdAt));

    const results = await query;

    // Sort in memory to respect original createdAt ordering preference
    // since DISTINCT ON required us to order by ID first
    results.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    if (limit) {
      return { success: true, data: results.slice(0, limit) };
    }

    return { success: true, data: results };
  } catch (err: any) {
    console.error("Error fetching budgets by month:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch budgets",
    };
  }
}

// UPSERT Budget Instance
export async function upsertBudgetInstanceDB(data: {
  budgetId: string;
  month: number;
  year: number;
  allocatedAmount?: number;
  carriedOverAmount?: number;
}): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Check if exists
    const existing = await db.query.budgetInstances.findFirst({
      where: and(
        eq(budgetInstances.budgetId, data.budgetId),
        eq(budgetInstances.month, data.month),
        eq(budgetInstances.year, data.year),
      ),
    });

    if (existing) {
      // Update
      // Only update fields that are provided
      const updatePayload: any = {};
      if (data.allocatedAmount !== undefined) updatePayload.allocatedAmount = data.allocatedAmount;
      if (data.carriedOverAmount !== undefined) updatePayload.carriedOverAmount = data.carriedOverAmount;
      updatePayload.updatedAt = new Date();

      if (Object.keys(updatePayload).length === 0) return { success: true, message: "No changes needed" };

      const [updated] = await db
        .update(budgetInstances)
        .set(updatePayload)
        .where(eq(budgetInstances.id, existing.id))
        .returning();

      return { success: true, message: "Budget instance updated", data: updated };
    } else {
      // Create
      // Need to know required fields. allocatedAmount is required by schema default 0, same for carriedOver.
      // If undefined, use 0 or fetching existing budget template amount?
      // The caller should ideally provide the specific amount.

      const [inserted] = await db.insert(budgetInstances).values({
        budgetId: data.budgetId,
        month: data.month,
        year: data.year,
        allocatedAmount: data.allocatedAmount ?? 0,
        carriedOverAmount: data.carriedOverAmount ?? 0,
      }).returning();

      return { success: true, message: "Budget instance created", data: inserted };
    }
  } catch (err: any) {
    console.error("Error upserting budget instance:", err);
    return { success: false, message: err.message || "Failed to upsert budget instance" };
  }
}

// CHECK Budget Instances Exist
export async function checkBudgetInstancesExistDB(
  hubId: string,
  month: number,
  year: number,
): Promise<boolean> {
  // Check if any instance exists for this hub/month/year
  // We need to join with budgets to filter by hubId
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(budgetInstances)
    .innerJoin(budgets, eq(budgetInstances.budgetId, budgets.id))
    .where(
      and(
        eq(budgets.hubId, hubId),
        eq(budgetInstances.month, month),
        eq(budgetInstances.year, year),
      ),
    );

  return Number(result[0]?.count ?? 0) > 0;
}

// GET Existing Budget Instances (Helper for deduplication)
export async function getExistingBudgetInstancesDB(
  hubId: string,
  month: number,
  year: number,
) {
  // Join budgetInstances with budgets to filter by hubId
  return await db
    .select({
      id: budgetInstances.id,
      budgetId: budgetInstances.budgetId,
    })
    .from(budgetInstances)
    .innerJoin(budgets, eq(budgetInstances.budgetId, budgets.id))
    .where(
      and(
        eq(budgets.hubId, hubId),
        eq(budgetInstances.month, month),
        eq(budgetInstances.year, year),
      ),
    );
}

// BULK CREATE Budget Instances
export async function createBudgetInstancesDB(
  instances: {
    budgetId: string;
    month: number;
    year: number;
    allocatedAmount: number;
    carriedOverAmount: number;
  }[],
) {
  if (instances.length === 0) return;
  await db.insert(budgetInstances).values(instances).onConflictDoNothing();
}

// UPDATE Budget
export async function updateBudgetDB({
  hubId,
  budgetId,
  updatedData,
}: UpdateBudgetInput) {
  try {
    const budget = await db.query.budgets.findFirst({
      where: (b) => eq(b.id, budgetId),
      columns: {
        id: true,
        hubId: true,
        transactionCategoryId: true,
      },
    });

    if (!budget) {
      return { success: false, message: "Budget not found." };
    }

    if (budget.hubId !== hubId) {
      return { success: false, message: "Access denied." };
    }

    let transactionCategoryId = budget.transactionCategoryId;

    if (updatedData.categoryName) {
      const newName = updatedData.categoryName.trim().toLowerCase();

      // Find if a category with this name already exists in the hub
      let targetCategory = await db.query.transactionCategories.findFirst({
        where: (cat, { and, eq, sql }) =>
          and(eq(cat.hubId, hubId), sql`LOWER(${cat.name}) = ${newName}`),
      });

      if (targetCategory) {
        // If it's a different category than current, check for budget collision
        if (targetCategory.id !== budget.transactionCategoryId) {
          const otherBudget = await db.query.budgets.findFirst({
            where: (b, { and, eq, ne }) =>
              and(
                eq(b.hubId, hubId),
                eq(b.transactionCategoryId, targetCategory!.id),
                ne(b.id, budgetId),
              ),
          });

          if (otherBudget) {
            return {
              success: false,
              message: `A budget already exists for category "${updatedData.categoryName}"`,
            };
          }
        }
        transactionCategoryId = targetCategory.id;
      } else {
        // No existing category with this name. 
        // If current budget has a category, rename it. Otherwise create new.
        if (budget.transactionCategoryId) {
          await db
            .update(transactionCategories)
            .set({ name: newName })
            .where(eq(transactionCategories.id, budget.transactionCategoryId));
          transactionCategoryId = budget.transactionCategoryId;
        } else {
          const [newCategory] = await db
            .insert(transactionCategories)
            .values({ hubId, name: newName })
            .returning({ id: transactionCategories.id });
          transactionCategoryId = newCategory.id;
        }
      }
    }
    const cleanData = Object.fromEntries(
      Object.entries({
        allocatedAmount: updatedData.allocatedAmount,
        spentAmount: updatedData.spentAmount,
        warningPercentage: updatedData.warningPercentage,
        markerColor: updatedData.markerColor,
        transactionCategoryId,
      }).filter(([_, v]) => v !== undefined && v !== null),
    );

    const [updatedBudget] = await db
      .update(budgets)
      .set(cleanData)
      .where(eq(budgets.id, budgetId))
      .returning();

    return {
      success: true,
      message: "Budget updated successfully.",
      data: updatedBudget,
    };
  } catch (err: any) {
    console.error("Error updating budget:", err);
    return {
      success: false,
      message: err.message || "Failed to update budget.",
    };
  }
}

// DELETE Budget
export async function deleteBudgetDB({
  hubId,
  budgetId,
}: {
  hubId: string;
  budgetId: string;
}) {
  try {
    const budget = await db.query.budgets.findFirst({
      where: (b) => eq(b.id, budgetId),
      columns: { hubId: true, transactionCategoryId: true },
    });

    if (!budget) return { success: false, message: "Budget not found." };
    if (budget.hubId !== hubId)
      return { success: false, message: "Access denied." };

    const categoryId = budget.transactionCategoryId;

    const deleted = await db
      .delete(budgets)
      .where(eq(budgets.id, budgetId))
      .returning();

    if (categoryId) {
      await db
        .delete(transactionCategories)
        .where(eq(transactionCategories.id, categoryId));
    }

    return {
      success: true,
      message: "Budget deleted successfully.",
      data: deleted[0],
    };
  } catch (err: any) {
    console.error("Error deleting budget:", err);
    return {
      success: false,
      message: err.message || "Failed to delete budget.",
    };
  }
}

// GET Account Transfers (now queries transactions with type="transfer")
export async function getAccountTransfersDB(financialAccountId: string) {
  try {
    const account = await db.query.financialAccounts.findFirst({
      where: eq(financialAccounts.id, financialAccountId),
      columns: { id: true, name: true },
    });

    if (!account) {
      return { status: false, message: "Account not found.", data: [] };
    }

    const results = await db
      .select({
        id: transactions.id,
        date: transactions.createdAt,
        amount: transactions.amount,
        note: transactions.note,
        sourceAccountId: transactions.financialAccountId,
        destinationAccountId: transactions.destinationAccountId,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "transfer"),
          or(
            eq(transactions.financialAccountId, account.id),
            eq(transactions.destinationAccountId, account.id),
          ),
        ),
      )
      .orderBy(desc(transactions.createdAt));

    // Fetch account names separately
    const accountIds = new Set<string>();
    results.forEach((tx) => {
      if (tx.sourceAccountId) accountIds.add(tx.sourceAccountId);
      if (tx.destinationAccountId) accountIds.add(tx.destinationAccountId);
    });

    const accountsMap = new Map<string, string>();
    if (accountIds.size > 0) {
      const accounts = await db
        .select({
          id: financialAccounts.id,
          name: financialAccounts.name,
        })
        .from(financialAccounts)
        .where(inArray(financialAccounts.id, Array.from(accountIds)));

      accounts.forEach((acc) => {
        accountsMap.set(acc.id, acc.name);
      });
    }

    const formatted = results.map((tx) => ({
      date: tx.date,
      source: accountsMap.get(tx.sourceAccountId) || "",
      destination: accountsMap.get(tx.destinationAccountId || "") || "",
      amount: Number(tx.amount),
      note: tx.note || "",
    }));

    return { status: true, data: formatted };
  } catch (err: any) {
    console.error("Error fetching latest transfers:", err);
    return {
      status: false,
      message: err.message || "Failed to fetch latest transfers",
      data: [],
    };
  }
}

// GET Hub Transfers
export async function getHubTransfersDB(hubId: string) {
  try {
    const results = await db
      .select({
        id: transactions.id,
        date: transactions.createdAt,
        amount: transactions.amount,
        note: transactions.note,
        sourceAccountId: transactions.financialAccountId,
        destinationAccountId: transactions.destinationAccountId,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.hubId, hubId),
          eq(transactions.type, "transfer"),
        ),
      )
      .orderBy(desc(transactions.createdAt));

    // Fetch account names separately
    const accountIds = new Set<string>();
    results.forEach((tx) => {
      if (tx.sourceAccountId) accountIds.add(tx.sourceAccountId);
      if (tx.destinationAccountId) accountIds.add(tx.destinationAccountId);
    });

    const accountsMap = new Map<string, string>();
    if (accountIds.size > 0) {
      const accounts = await db
        .select({
          id: financialAccounts.id,
          name: financialAccounts.name,
        })
        .from(financialAccounts)
        .where(inArray(financialAccounts.id, Array.from(accountIds)));

      accounts.forEach((acc) => {
        accountsMap.set(acc.id, acc.name);
      });
    }

    const formatted = results.map((tx) => ({
      date: tx.date,
      source: accountsMap.get(tx.sourceAccountId) || "Unknown",
      destination: accountsMap.get(tx.destinationAccountId || "") || "Unknown",
      amount: Number(tx.amount),
      note: tx.note || "",
    }));

    return { status: true, data: formatted };
  } catch (err: any) {
    console.error("Error fetching hub transfers:", err);
    return {
      status: false,
      message: err.message || "Failed to fetch hub transfers",
      data: [],
    };
  }
}

// GET All Transaction Categories for a Hub
export async function getTransactionCategoriesDB(hubId: string) {
  try {
    const result = await db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
      })
      .from(transactionCategories)
      .where(eq(transactionCategories.hubId, hubId))
      .orderBy(transactionCategories.name);

    return {
      success: true,
      message: "Fetched transaction categories",
      data: result,
    };
  } catch (err: any) {
    console.error("DB Error: getTransactionCategoriesDB Error:", err);
    return {
      success: false,
      message: "Failed to fetch transaction categories",
    };
  }
}

// GET Transaction & Budget Categories with Amount
export async function getTransactionCategoriesWithAmountsDB(
  hubId: string,
  startDate?: Date,
  endDate?: Date,
) {
  try {
    const filters = [
      eq(transactions.hubId, hubId),
      eq(transactions.type, "expense"),
    ];
    if (startDate) filters.push(gte(transactions.createdAt, startDate));
    if (endDate) filters.push(lte(transactions.createdAt, endDate));

    const transactionTotals = db
      .select({
        categoryId: transactions.transactionCategoryId,
        transactionTotal:
          sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.as(
            "transactionTotal",
          ),
      })
      .from(transactions)
      .where(and(...filters))
      .groupBy(transactions.transactionCategoryId)
      .as("transactionTotals");

    const budgetTotals = db
      .select({
        categoryId: budgets.transactionCategoryId,
        budgetTotal:
          sql<number>`COALESCE(SUM(${budgets.allocatedAmount}), 0)`.as(
            "budgetTotal",
          ),
      })
      .from(budgets)
      .where(eq(budgets.hubId, hubId))
      .groupBy(budgets.transactionCategoryId)
      .as("budgetTotals");

    const result = await db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
        transactionAmount:
          sql<number>`COALESCE(${transactionTotals.transactionTotal}, 0)`.as(
            "transactionAmount",
          ),
        budgetAmount: sql<number>`COALESCE(${budgetTotals.budgetTotal}, 0)`.as(
          "budgetAmount",
        ),
        totalAmount: sql<number>`
          COALESCE(${transactionTotals.transactionTotal}, 0)
          + COALESCE(${budgetTotals.budgetTotal}, 0)
        `.as("totalAmount"),
      })
      .from(transactionCategories)
      .leftJoin(
        transactionTotals,
        eq(transactionTotals.categoryId, transactionCategories.id),
      )
      .leftJoin(
        budgetTotals,
        eq(budgetTotals.categoryId, transactionCategories.id),
      )
      .where(eq(transactionCategories.hubId, hubId));

    return {
      success: true,
      message: "Fetched transaction categories with combined totals",
      data: result,
    };
  } catch (err: any) {
    console.error(
      "DB Error: getTransactionCategoriesWithAmountsDB Error:",
      err,
    );
    return {
      success: false,
      message: "Failed to fetch transaction categories with amounts",
    };
  }
}

// GET Monthly Report
export async function getMonthlyReportDB(
  hubId: string,
  startDate?: Date,
  endDate?: Date,
  groupBy: "month" | "quarter" | "year" = "month",
) {
  try {
    const filters = [eq(transactions.hubId, hubId)];
    if (startDate) filters.push(gte(transactions.createdAt, startDate));
    if (endDate) filters.push(lte(transactions.createdAt, endDate));

    let groupingSql;
    switch (groupBy) {
      case "quarter":
        groupingSql = sql`TO_CHAR(${transactions.createdAt}, 'YYYY-"Q"Q')`;
        break;
      case "year":
        groupingSql = sql`TO_CHAR(${transactions.createdAt}, 'YYYY')`;
        break;
      default:
        groupingSql = sql`TO_CHAR(${transactions.createdAt}, 'Month YYYY')`;
    }

    const result = await db
      .select({
        month: groupingSql,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
        balance: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} WHEN ${transactions.type} = 'expense' THEN -${transactions.amount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(and(...filters))
      .groupBy(groupingSql)
      .orderBy(sql`MIN(${transactions.createdAt})`);

    return { success: true, data: result };
  } catch (err: any) {
    console.error("DB Error: getMonthlyReportDB:", err);
    return { success: false, message: err.message };
  }
}

// GET Report Summary (Income, Expense, Balance, Saving Rate)
export async function getReportSummaryDB(
  hubId: string,
  startDate?: Date,
  endDate?: Date,
) {
  try {
    const filters = [eq(transactions.hubId, hubId)];
    if (startDate) filters.push(gte(transactions.createdAt, startDate));
    if (endDate) filters.push(lte(transactions.createdAt, endDate));

    const result = await db
      .select({
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
        expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(and(...filters));

    console.log("DEBUG: getReportSummaryDB - Filters applied:", filters.length);
    console.log("DEBUG: getReportSummaryDB - SQL Result:", result);

    const { income, expense } = result[0] || { income: 0, expense: 0 };
    const balance = income - expense;
    const savingRate =
      income > 0 ? Number(((balance / income) * 100).toFixed(1)) : 0;

    return {
      success: true,
      data: {
        income,
        expense,
        balance,
        savingRate,
      },
    };
  } catch (err: any) {
    console.error("DB Error: getReportSummaryDB:", err);
    return { success: false, message: err.message };
  }
}

// GET HUB Total Expenses (Gross) for a specific month
export async function getHubTotalExpensesDB(
  hubId: string,
  month: number,
  year: number,
) {
  try {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.hubId, hubId),
          eq(transactions.type, "expense"),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate),
        ),
      );

    return { success: true, data: result[0]?.total || 0 };
  } catch (err: any) {
    console.error("DB Error: getHubTotalExpensesDB:", err);
    return { success: false, message: err.message };
  }
}

// DELETE ALL Transactions
export async function deleteAllTransactionsDB(hubId: string) {
  try {
    await db.delete(transactions).where(eq(transactions.hubId, hubId));

    return {
      success: true,
      message: "All transactions deleted.",
    };
  } catch (err: any) {
    console.error("Error deleting all transactions:", err);
    return {
      success: false,
      message: err.message || "Failed to delete all transactions.",
    };
  }
}

// DELETE ALL Transactions and related Categories
export async function deleteAllTransactionsAndCategoriesDB(hubId: string) {
  try {
    const txs = await db.query.transactions.findMany({
      where: (tx) => eq(tx.hubId, hubId),
      columns: { transactionCategoryId: true },
    });

    const categoryIds = txs
      .map((tx) => tx.transactionCategoryId)
      .filter((id): id is string => !!id);

    await db.delete(transactions).where(eq(transactions.hubId, hubId));

    if (categoryIds.length > 0) {
      await db
        .delete(transactionCategories)
        .where(inArray(transactionCategories.id, categoryIds));
    }

    return {
      success: true,
      message: "All transactions and related categories deleted.",
    };
  } catch (err: any) {
    console.error("Error deleting all transactions and categories:", err);
    return {
      success: false,
      message:
        err.message || "Failed to delete all transactions and categories.",
    };
  }
}

// GET Categoreis by Expenses
export async function getCategoriesByExpensesDB(
  hubId: string,
  startDate?: Date,
  endDate?: Date,
) {
  try {
    const filters = [
      eq(transactions.hubId, hubId),
      eq(transactions.type, "expense"),
    ];
    if (startDate) filters.push(gte(transactions.createdAt, startDate));
    if (endDate) filters.push(lte(transactions.createdAt, endDate));

    const expenseTxs = await db
      .select({
        categoryId: transactions.transactionCategoryId,
        amount: sql<number>`SUM(${transactions.amount})`.as("amount"),
      })
      .from(transactions)
      .where(and(...filters))
      .groupBy(transactions.transactionCategoryId);

    const totalAmount = expenseTxs.reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);

    const results: {
      category: string;
      amount: number;
      accountBalance: number;
      percent: number;
    }[] = [];

    for (const tx of expenseTxs) {
      const amount = Math.abs(Number(tx.amount || 0));
      let categoryName = "Uncategorized";

      if (tx.categoryId) {
        const categoryRow = await db.query.transactionCategories.findFirst({
          where: (cat) => eq(cat.id, tx.categoryId!),
          columns: { name: true },
        });
        categoryName = categoryRow?.name ?? "Unknown";
      }

      results.push({
        category: categoryName,
        amount,
        percent: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        accountBalance: 0,
      });
    }

    // Sort by amount descending
    results.sort((a, b) => b.amount - a.amount);

    return { success: true, data: results };
  } catch (err: any) {
    console.error("Error in getCategoriesByExpensesDB:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch expense categories",
    };
  }
}

// GET HUBS for User
export async function getHubsByUserDB(
  userId: string,
): Promise<getHubsByUserDBProps> {
  try {
    const rows = await db
      .select({
        id: hubs.id,
        name: hubs.name,
        createdAt: hubs.createdAt,
      })
      .from(hubs)
      .leftJoin(hubMembers, eq(hubMembers.hubId, hubs.id))
      .where(or(eq(hubs.userId, userId), eq(hubMembers.userId, userId)))
      .orderBy(desc(hubs.createdAt));

    const unique = Object.values(
      rows.reduce(
        (acc, hub) => {
          acc[hub.id] = hub;
          return acc;
        },
        {} as Record<string, (typeof rows)[number]>,
      ),
    );

    return {
      success: true,
      data: unique.map((h) => ({
        id: h.id,
        name: h.name,
      })),
    };
  } catch (err: any) {
    return { success: false, message: err.message, data: [] };
  }
}

// CREATE Invitation
export async function createHubInvitationDB({
  hubId,
  email,
  role,
  token,
  expiresAt,
}: HubInvitationProps) {
  try {
    const inserted = await db
      .insert(hubInvitations)
      .values({
        hubId,
        email,
        role,
        token,
        expiresAt,
      })
      .returning();

    return { success: true, data: inserted[0] };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// GET INVITATIONS by HUB
export async function getHubInvitationsByHubDB(hubId: string) {
  try {
    const rows = await db
      .select({
        id: hubInvitations.id,
        email: hubInvitations.email,
        role: hubInvitations.role,
        accepted: hubInvitations.accepted,
        expiresAt: hubInvitations.expiresAt,
        createdAt: hubInvitations.createdAt,
      })
      .from(hubInvitations)
      .where(eq(hubInvitations.hubId, hubId));

    return { success: true, data: rows };
  } catch (err: any) {
    return { success: false, message: err.message, data: [] };
  }
}

// GET INVITE BY TOKEN
export async function getInvitationByTokenDB(token: string) {
  try {
    const row = await db.query.hubInvitations.findFirst({
      where: eq(hubInvitations.token, token),
    });

    if (!row) {
      return { success: false, message: "Invalid token", data: null };
    }

    return { success: true, data: row };
  } catch (err: any) {
    return { success: false, message: err.message, data: null };
  }
}

// ACCEPT Invitation
export async function acceptInvitationDB(token: string, userId: string) {
  try {
    const invite = await db.query.hubInvitations.findFirst({
      where: eq(hubInvitations.token, token),
    });

    if (!invite) return { success: false, message: "Invitation not found" };

    if (invite.accepted)
      return { success: false, message: "Invitation already accepted" };

    if (new Date(invite.expiresAt) < new Date())
      return { success: false, message: "Invitation expired" };

    // user email must match the invitation email
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return { success: false, message: "User not found" };

    if (user.email !== invite.email) {
      return {
        success: false,
        message: "You cannot accept this invitation (email does not match)",
      };
    }

    await db.transaction(async (tx) => {
      const existingMember = await tx.query.hubMembers.findFirst({
        where: and(
          eq(hubMembers.userId, userId),
          eq(hubMembers.hubId, invite.hubId),
        ),
      });

      if (existingMember) {
        return {
          success: false,
          message: "You are already a member of this hub",
        };
      } else {
        await tx.insert(hubMembers).values({
          hubId: invite.hubId,
          userId,
          accessRole: invite.role,
          isOwner: false,
          joinedAt: new Date(),
        });
      }

      // Mark invitation as accepted
      await tx
        .update(hubInvitations)
        .set({ accepted: true })
        .where(eq(hubInvitations.id, invite.id));
    });

    return {
      success: true,
      message: "Invitation accepted",
      data: { hubId: invite.hubId },
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// GET MEMBERS FOR HUB
export async function getHubMembersDB(hubId: string) {
  try {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: hubMembers.accessRole,
        isOwner: hubMembers.isOwner,
        joinedAt: hubMembers.joinedAt,
      })
      .from(hubMembers)
      .innerJoin(users, eq(hubMembers.userId, users.id))
      .where(eq(hubMembers.hubId, hubId))
      .orderBy(desc(hubMembers.joinedAt));

    return { success: true, data: rows };
  } catch (err: any) {
    return { success: false, message: err.message, data: [] };
  }
}

// GET Hub Settings
export async function getHubSettingsDB(hubId: string) {
  try {
    const hub = await db.query.hubs.findFirst({
      where: eq(hubs.id, hubId),
      columns: {
        budgetCarryOver: true,
        budgetEmailWarnings: true,
      },
    });

    if (!hub) return { success: false, message: "Hub not found" };

    return {
      success: true,
      data: hub,
    };
  } catch (err: any) {
    console.error("Error in getHubSettingsDB:", err);
    return { success: false, message: err.message };
  }
}

// UPDATE Hub Settings
export async function updateHubSettingsDB(
  hubId: string,
  data: Partial<{ budgetCarryOver: boolean; budgetEmailWarnings: boolean }>,
) {
  try {
    const [updatedHub] = await db
      .update(hubs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(hubs.id, hubId))
      .returning();

    return {
      success: true,
      message: "Hub settings updated successfully",
      data: updatedHub,
    };
  } catch (err: any) {
    console.error("Error in updateHubSettingsDB:", err);
    return { success: false, message: err.message };
  }
}

// Functions for getContext
export async function getHubByIdDB(hubId: string) {
  return await db.query.hubs.findFirst({
    where: eq(hubs.id, hubId),
    columns: { id: true },
  });
}

export async function getFirstHubMemberDB(userId: string) {
  return await db.query.hubMembers.findFirst({
    where: eq(hubMembers.userId, userId),
    columns: { hubId: true },
  });
}

export async function getOwnedHubDB(userId: string) {

  const hubMember = await db.query.hubMembers.findFirst({
    where: and(eq(hubMembers.userId, userId), eq(hubMembers.isOwner, true)),
    columns: { hubId: true },
  });

  if (hubMember) {
    const hub = await db.query.hubs.findFirst({
      where: eq(hubs.id, hubMember.hubId),
      columns: { id: true },
    });
    return hub;
  }

  return null;
}

export async function getHubMemberRoleDB(userId: string, hubId: string) {
  return await db.query.hubMembers.findFirst({
    where: and(eq(hubMembers.userId, userId), eq(hubMembers.hubId, hubId)),
    columns: { accessRole: true },
  });
}

export async function getFinancialAccountDB(userId: string, hubId: string) {
  return await db.query.financialAccounts.findFirst({
    where: and(
      eq(financialAccounts.userId, userId),
      eq(financialAccounts.hubId, hubId),
    ),
  });
}

// GET Users Financial Account Count in Hub
export async function getAccountCountForHub(
  userId: string,
  hubId: string,
): Promise<number> {
  return await db.$count(
    financialAccounts,
    and(
      eq(financialAccounts.userId, userId),
      eq(financialAccounts.hubId, hubId),
    ),
  );
}

// GET Monthyl Transactions Count
export async function getMonthlyTransactionCount(
  userId: string,
): Promise<number> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return await db.$count(
    transactions,
    and(
      eq(transactions.userId, userId),
      gte(transactions.createdAt, firstDayOfMonth),
      lte(transactions.createdAt, now),
    ),
  );
}

// GET User Settings
export async function getUserSettingsDB(
  userId: string,
): Promise<{ success: boolean; message: string; data?: UserSettingsType | null }> {
  try {
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    return {
      success: true,
      message: "User settings retrieved successfully",
      data: settings ?? null,
    };
  } catch (err) {
    console.error("Error fetching user settings: ", err);
    return {
      success: false,
      message: `Failed to fetch user settings: ${(err as Error).message}`,
    };
  }
}

// CREATE or UPDATE User Settings
export async function upsertUserSettingsDB(
  userId: string,
  updateData: {
    householdSize?: string | null;
    address?: string | null;
  },
): Promise<{ success: boolean; message: string; data?: UserSettingsType }> {
  try {
    const existingSettings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(userSettings)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();

      return {
        success: true,
        message: "User settings updated successfully",
        data: updatedSettings,
      };
    } else {
      // Create new settings
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          userId,
          ...updateData,
        })
        .returning();

      return {
        success: true,
        message: "User settings created successfully",
        data: newSettings,
      };
    }
  } catch (err) {
    console.error("Error upserting user settings: ", err);
    return {
      success: false,
      message: `Failed to upsert user settings: ${(err as Error).message}`,
    };
  }
}

// NOTIFICATION QUERIES

export interface CreateNotificationInput {
  hubId: string;
  userId?: string | null;
  type: "info" | "success" | "error" | "warning";
  title: string;
  message: string;
  html?: string | null;
  channel?: "email" | "web" | "both";
  metadata?: Record<string, unknown> | null;
}

export async function createNotificationDB(
  input: CreateNotificationInput,
): Promise<{ success: boolean; message?: string; data?: Notification }> {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        hubId: input.hubId,
        userId: input.userId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        html: input.html ?? null,
        channel: input.channel ?? "both",
        metadata: input.metadata ?? null,
        emailSent: false,
        isRead: false,
      })
      .returning();

    return {
      success: true,
      message: "Notification created successfully",
      data: notification,
    };
  } catch (err: any) {
    console.error("Error creating notification:", err);
    return {
      success: false,
      message: err.message || "Failed to create notification",
    };
  }
}

export interface GetNotificationsOptions {
  hubId: string;
  userId?: string | null;
  unreadOnly?: boolean;
  limit?: number;
}

export async function getNotificationsDB(
  options: GetNotificationsOptions,
): Promise<{
  success: boolean;
  message?: string;
  data?: Notification[];
}> {
  try {
    const { hubId, userId, unreadOnly = false, limit } = options;

    // Show notifications that are:
    // 1. For this hub
    // 2. Either user-specific (userId matches) OR hub-wide (userId is null)
    // 3. Optionally unread only
    let query = db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.hubId, hubId),
          userId
            ? or(
              eq(notifications.userId, userId),
              isNull(notifications.userId),
            )
            : undefined,
          unreadOnly ? eq(notifications.isRead, false) : undefined,
        ),
      )
      .orderBy(desc(notifications.createdAt));

    if (limit) {
      query = query.limit(limit) as typeof query;
    }

    const results = await query;

    return {
      success: true,
      message: "Notifications fetched successfully",
      data: results,
    };
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch notifications",
    };
  }
}

export async function markNotificationAsReadDB(
  notificationId: string,
  hubId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Verify notification belongs to hub
    const notification = await db.query.notifications.findFirst({
      where: (n) => and(eq(n.id, notificationId), eq(n.hubId, hubId)),
      columns: { id: true },
    });

    if (!notification) {
      return {
        success: false,
        message: "Notification not found or access denied",
      };
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));

    return {
      success: true,
      message: "Notification marked as read",
    };
  } catch (err: any) {
    console.error("Error marking notification as read:", err);
    return {
      success: false,
      message: err.message || "Failed to mark notification as read",
    };
  }
}

export async function markAllNotificationsAsReadDB(
  hubId: string,
  userId?: string | null,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Mark as read notifications that are:
    // 1. For this hub
    // 2. Either user-specific (userId matches) OR hub-wide (userId is null)
    // 3. Currently unread
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.hubId, hubId),
          userId
            ? or(
              eq(notifications.userId, userId),
              isNull(notifications.userId),
            )
            : undefined,
          eq(notifications.isRead, false),
        ),
      );

    return {
      success: true,
      message: "All notifications marked as read",
    };
  } catch (err: any) {
    console.error("Error marking all notifications as read:", err);
    return {
      success: false,
      message: err.message || "Failed to mark all notifications as read",
    };
  }
}

export async function getUnreadNotificationCountDB(
  hubId: string,
  userId?: string | null,
): Promise<{ success: boolean; message?: string; data?: number }> {
  try {
    // Count notifications that are:
    // 1. For this hub
    // 2. Either user-specific (userId matches) OR hub-wide (userId is null)
    // 3. Unread
    const count = await db.$count(
      notifications,
      and(
        eq(notifications.hubId, hubId),
        userId
          ? or(
            eq(notifications.userId, userId),
            isNull(notifications.userId),
          )
          : undefined,
        eq(notifications.isRead, false),
      ),
    );

    return {
      success: true,
      message: "Unread count fetched successfully",
      data: count,
    };
  } catch (err: any) {
    console.error("Error fetching unread notification count:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch unread notification count",
    };
  }
}

export async function updateNotificationEmailSentDB(
  notificationId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await db
      .update(notifications)
      .set({ emailSent: true })
      .where(eq(notifications.id, notificationId));

    return {
      success: true,
      message: "Notification email sent flag updated",
    };
  } catch (err: any) {
    console.error("Error updating notification email sent flag:", err);
    return {
      success: false,
      message: err.message || "Failed to update notification email sent flag",
    };
  }
}

export async function deleteNotificationDB(
  notificationId: string,
  hubId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Verify notification belongs to hub
    const notification = await db.query.notifications.findFirst({
      where: (n) => and(eq(n.id, notificationId), eq(n.hubId, hubId)),
      columns: { id: true },
    });

    if (!notification) {
      return {
        success: false,
        message: "Notification not found or access denied",
      };
    }

    await db.delete(notifications).where(eq(notifications.id, notificationId));

    return {
      success: true,
      message: "Notification deleted successfully",
    };
  } catch (err: any) {
    console.error("Error deleting notification:", err);
    return {
      success: false,
      message: err.message || "Failed to delete notification",
    };
  }
}

// GET Active Recurring Templates for Generation
export async function getActiveRecurringTemplatesDB() {
  try {
    const today = new Date();

    const templates = await db
      .select({
        id: recurringTransactionTemplates.id,
        hubId: recurringTransactionTemplates.hubId,
        userId: recurringTransactionTemplates.userId,
        financialAccountId: recurringTransactionTemplates.financialAccountId,
        destinationAccountId: recurringTransactionTemplates.destinationAccountId,
        transactionCategoryId: recurringTransactionTemplates.transactionCategoryId,
        type: recurringTransactionTemplates.type,
        source: recurringTransactionTemplates.source,
        amount: recurringTransactionTemplates.amount,
        note: recurringTransactionTemplates.note,
        frequencyDays: recurringTransactionTemplates.frequencyDays,
        startDate: recurringTransactionTemplates.startDate,
        endDate: recurringTransactionTemplates.endDate,
        status: recurringTransactionTemplates.status,
        lastGeneratedDate: recurringTransactionTemplates.lastGeneratedDate,
        consecutiveFailures: recurringTransactionTemplates.consecutiveFailures,
        categoryName: transactionCategories.name,
      })
      .from(recurringTransactionTemplates)
      .leftJoin(
        transactionCategories,
        eq(recurringTransactionTemplates.transactionCategoryId, transactionCategories.id)
      )
      .where(
        and(
          eq(recurringTransactionTemplates.status, "active"),
          lte(recurringTransactionTemplates.startDate, today),
          or(
            isNull(recurringTransactionTemplates.endDate),
            gte(recurringTransactionTemplates.endDate, today)
          )
        )
      );

    return { success: true, data: templates };
  } catch (err: any) {
    console.error("Error fetching active recurring templates:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch active recurring templates",
    };
  }
}

// UPDATE Template Last Generated Date
export async function updateTemplateLastGeneratedDB(templateId: string) {
  try {
    await db
      .update(recurringTransactionTemplates)
      .set({
        lastGeneratedDate: new Date(),
        consecutiveFailures: 0, // Reset on success
      })
      .where(eq(recurringTransactionTemplates.id, templateId));

    return { success: true, message: "Template updated successfully" };
  } catch (err: any) {
    console.error("Error updating template last generated date:", err);
    return {
      success: false,
      message: err.message || "Failed to update template",
    };
  }
}

// MARK Template Failure
export async function markTemplateFailureDB(
  templateId: string,
  reason: string
) {
  try {
    // Get current template to increment failures
    const template = await db.query.recurringTransactionTemplates.findFirst({
      where: (t, { eq }) => eq(t.id, templateId),
      columns: {
        id: true,
        consecutiveFailures: true,
      },
    });

    if (!template) {
      return {
        success: false,
        message: "Template not found",
      };
    }

    const currentFailures = template.consecutiveFailures || 0;
    const newFailures = currentFailures + 1;

    await db
      .update(recurringTransactionTemplates)
      .set({
        lastFailedDate: new Date(),
        failureReason: reason,
        consecutiveFailures: newFailures,
        // Note: Auto-pause logic will be handled in service layer for now
      })
      .where(eq(recurringTransactionTemplates.id, templateId));

    return {
      success: true,
      message: "Template failure marked",
      consecutiveFailures: newFailures,
    };
  } catch (err: any) {
    console.error("Error marking template failure:", err);
    return {
      success: false,
      message: err.message || "Failed to mark template failure",
    };
  }
}

export async function updateUserLanguageDB(userId: string, language: string) {
  try {
    await db
      .update(users)
      .set({ language })
      .where(eq(users.id, userId));

    return { success: true, message: "User language updated successfully" };
  } catch (err: any) {
    console.error("Error updating user language:", err);
    return {
      success: false,
      message: err.message || "Failed to update user language",
    };
  }
}
