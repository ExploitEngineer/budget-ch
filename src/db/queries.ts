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
  accountTransfers,
} from "./schema";
import { eq, desc, sql, inArray, and, or } from "drizzle-orm";
import type { QuickTask, UserType } from "./schema";
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/lib/services/budget";

type AccessRole = "admin" | "member";

export type createHubMemberArgs = {
  userId: string;
  hubId: string;
  accessRole: AccessRole;
  isOwner: boolean;
  userName?: string;
};

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
  transactionCategoryId: string;
  amount: number;
  note?: string;
  source: string;
  categoryName: string;
  transactionType: "income" | "expense";
  accountType: AccountType;
};

export type updateTransactionArgs = {
  hubId: string;
  transactionId: string;
  updatedData: {
    source?: string;
    amount?: number;
    note?: string | null;
    addedAt?: Date | string;
    transactionCategoryId?: string | null;
    financialAccountId?: string | null;
    accountType?: AccountType;
    transactionType?: "income" | "expense";
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
  accountType: AccountType;
};

export interface SavingGoal {
  id: string;
  name: string;
  goalAmount: number;
  amountSaved: number;
  monthlyAllocation?: number;
  value: number;
  accountType: AccountType;
  dueDate?: Date | null;
  remaining?: number;
}

export interface SavingGoalsSummary {
  totalTarget: number;
  totalSaved: number;
  remainingToSave: number;
  totalGoals: number;
}

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
    accountType?: string;
    dueDate?: Date | null;
  };
}

export type AccountTransferArgs = {
  financialAccountId: string;
  fromAccountType: AccountType;
  toAccountType: AccountType;
  hubId: string;
  amount: number;
  note?: string;
};

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

// GET user by email
export async function getUserByEmailDB(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        id: true,
        name: true,
        email: true,
        stripeCustomerId: true,
      },
    });
    return user;
  } catch (err) {
    console.error("Error fetching user by email: ", err);
    return null;
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
          accessRole: "member",
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
        accessRole: "member",
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

// CREATE Hub Member
export async function createHubMemberDB({
  userId,
  hubId,
  accessRole,
  isOwner,
}: createHubMemberArgs) {
  try {
    await db.insert(hubMembers).values({
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
export async function getFinancialAccountsDB(userId: string, hubId: string) {
  try {
    const results = await db
      .select()
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.userId, userId),
          eq(financialAccounts.hubId, hubId),
        ),
      );

    return results.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      iban: acc.iban || "",
      balance: acc.initialBalance,
      note: acc.note || "",
    }));
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
  accountType,
}: Omit<createTransactionArgs, "categoryName">) {
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
      accountType,
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
  fields: Record<string, boolean>,
  limit?: number,
) {
  try {
    const allFields = {
      id: transactions.id,
      date: transactions.addedAt,
      recipient: transactions.source,
      accountType: transactions.accountType,
      type: transactions.type,
      category: transactionCategories.name,
      note: transactions.note,
      amount: transactions.amount,
      accountName: financialAccounts.name,
      userName: users.name,
    };

    const selectObj: Record<string, any> = {};
    for (const [key, enabled] of Object.entries(fields)) {
      if (enabled && allFields[key as keyof typeof allFields]) {
        selectObj[key] = allFields[key as keyof typeof allFields];
      }
    }

    if (Object.keys(selectObj).length === 0)
      throw new Error("No valid fields requested");

    let query = db
      .select(selectObj)
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
      .orderBy(desc(transactions.addedAt));

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
      addedAt:
        typeof updatedData.addedAt === "string"
          ? new Date(updatedData.addedAt)
          : updatedData.addedAt,
      transactionCategoryId: updatedData.transactionCategoryId,
      financialAccountId: updatedData.financialAccountId,
      accountType: updatedData.accountType,
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

    const existingCategory = await db.query.transactionCategories.findFirst({
      where: (categories, { and, eq, sql }) =>
        and(
          sql`LOWER(${categories.name}) = ${normalizedName}`,
          eq(categories.hubId, hubId),
        ),
    });

    if (existingCategory) {
      throw new Error(`Category "${normalizedName}" already exists`);
    }

    const [category] = await db
      .insert(transactionCategories)
      .values({
        name: normalizedName,
        hubId,
      })
      .returning();

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
  accountType,
}: savingGoalArgs) {
  try {
    await db.insert(savingGoals).values({
      hubId,
      userId,
      name,
      goalAmount,
      amountSaved,
      monthlyAllocation,
      accountType,
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
  data?: SavingGoal[] | SavingGoalsSummary;
  message?: string;
}> {
  try {
    const { summaryOnly = false, limit } = options;

    let query = db
      .select({
        id: savingGoals.id,
        name: savingGoals.name,
        goalAmount: savingGoals.goalAmount,
        amountSaved: savingGoals.amountSaved,
        monthlyAllocation: savingGoals.monthlyAllocation,
        accountType: savingGoals.accountType,
        dueDate: savingGoals.dueDate,
      })
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

      return {
        success: true,
        data: {
          totalTarget,
          totalSaved,
          remainingToSave,
          totalGoals: goals.length,
        },
      };
    }

    const formatted: SavingGoal[] = goals.map((g) => {
      const progress =
        g.goalAmount > 0
          ? Math.min((g.amountSaved / g.goalAmount) * 100, 100)
          : 0;

      return {
        id: g.id,
        name: g.name,
        goalAmount: g.goalAmount,
        amountSaved: g.amountSaved,
        monthlyAllocation: g.monthlyAllocation,
        value: Math.round(progress),
        accountType: g.accountType,
        dueDate: g.dueDate,
      };
    });

    return { success: true, data: formatted };
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
        accountType: updatedData.accountType,
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

// GET Budgets
export async function getBudgetsDB(
  hubId: string,
  fields: Record<string, boolean>,
  limit?: number,
) {
  try {
    const allFields = {
      id: budgets.id,
      category: transactionCategories.name,
      allocated: budgets.allocatedAmount,
      spent: budgets.spentAmount,
      createdAt: budgets.createdAt,
    };

    const selectObj: Record<string, any> = {};
    for (const [key, enabled] of Object.entries(fields)) {
      if (enabled && allFields[key as keyof typeof allFields]) {
        selectObj[key] = allFields[key as keyof typeof allFields];
      }
    }

    if (Object.keys(selectObj).length === 0)
      throw new Error("No valid fields requested");

    let query = db
      .select(selectObj)
      .from(budgets)
      .leftJoin(
        transactionCategories,
        eq(transactionCategories.id, budgets.transactionCategoryId),
      )
      .where(eq(budgets.hubId, hubId))
      .orderBy(desc(budgets.createdAt));

    if (limit) query.limit(limit);

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
      const newName = updatedData.categoryName.trim();

      const currentCategory = await db.query.transactionCategories.findFirst({
        where: (cat) => eq(cat.id, budget.transactionCategoryId),
      });

      if (!currentCategory) {
        return {
          success: false,
          message: "Current category not found.",
        };
      }

      if (currentCategory.name === newName) {
        transactionCategoryId = currentCategory.id;
      } else {
        const existingCategory = await db.query.transactionCategories.findFirst(
          {
            where: (cat) => and(eq(cat.hubId, hubId), eq(cat.name, newName)),
          },
        );

        if (existingCategory) {
          return {
            success: false,
            message: "A category with this name already exists in your hub.",
          };
        }

        await db
          .update(transactionCategories)
          .set({ name: newName })
          .where(eq(transactionCategories.id, currentCategory.id));

        transactionCategoryId = currentCategory.id;
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

// CREATE Account Transfer
export async function createAccountTransferDB({
  financialAccountId,
  fromAccountType,
  toAccountType,
  hubId,
  amount,
  note,
}: AccountTransferArgs) {
  try {
    const from = await db.query.financialAccounts.findFirst({
      where: (a) => and(eq(a.type, fromAccountType), eq(a.hubId, hubId)),
      columns: {
        id: true,
        hubId: true,
        initialBalance: true,
        name: true,
        type: true,
      },
    });

    const to = await db.query.financialAccounts.findFirst({
      where: (a) => and(eq(a.type, toAccountType), eq(a.hubId, hubId)),
      columns: {
        id: true,
        hubId: true,
        initialBalance: true,
        name: true,
        type: true,
      },
    });

    if (!from) return { success: false, message: "Source account not found." };
    if (!to)
      return { success: false, message: "Destination account not found." };

    if (from.hubId !== hubId || to.hubId !== hubId)
      return { success: false, message: "Access denied." };

    if (from.id === to.id)
      return {
        success: false,
        message: "Cannot transfer to the same account.",
      };

    const fromBalance = Number(from.initialBalance ?? 0);
    if (fromBalance < amount)
      return {
        success: false,
        message: "Insufficient funds in source account.",
      };

    const newFromBalance = fromBalance - amount;
    const newToBalance = Number(to.initialBalance ?? 0) + amount;

    await db
      .update(financialAccounts)
      .set({ initialBalance: newFromBalance })
      .where(eq(financialAccounts.id, from.id));

    await db
      .update(financialAccounts)
      .set({ initialBalance: newToBalance })
      .where(eq(financialAccounts.id, to.id));

    const [transfer] = await db
      .insert(accountTransfers)
      .values({
        financialAccountId,
        sourceAccount: from.type,
        destinationAccount: to.type,
        note,
        transferAmount: amount,
      })
      .returning();

    return { success: true, data: transfer };
  } catch (err: any) {
    console.error("Error creating latest transfer:", err);
    return {
      success: false,
      message: err.message || "Failed to create transfer",
    };
  }
}

// GET Account Transfers
export async function getAccountTransfersDB(financialAccountId: string) {
  try {
    const account = await db.query.financialAccounts.findFirst({
      where: eq(financialAccounts.id, financialAccountId),
      columns: { type: true },
    });

    if (!account) {
      return { status: false, message: "Account not found.", data: [] };
    }
    const results = await db
      .select()
      .from(accountTransfers)
      .where(
        or(
          eq(accountTransfers.sourceAccount, account.type),
          eq(accountTransfers.destinationAccount, account.type),
        ),
      )
      .orderBy(desc(accountTransfers.updatedAt));

    const formatted = results.map((tx) => ({
      date: tx.updatedAt,
      source: tx.sourceAccount,
      destination: tx.destinationAccount,
      amount: Number(tx.transferAmount),
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

// GET Transaction & Budget Categories with Amount
export async function getTransactionCategoriesWithAmountsDB(hubId: string) {
  try {
    const transactionTotals = db
      .select({
        categoryId: transactions.transactionCategoryId,
        transactionTotal:
          sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.as(
            "transactionTotal",
          ),
      })
      .from(transactions)
      .where(eq(transactions.hubId, hubId))
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
export async function getMonthlyReportDB(hubId: string) {
  try {
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.addedAt}, 'Month')`,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
        balance: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.hubId, hubId))
      .groupBy(sql`TO_CHAR(${transactions.addedAt}, 'Month')`)
      .orderBy(sql`MIN(${transactions.addedAt})`);

    return { success: true, data: result };
  } catch (err: any) {
    console.error("DB Error: getMonthlyReportDB:", err);
    return { success: false, message: err.message };
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
export async function getCategoriesByExpensesDB(hubId: string) {
  try {
    const expenseTxs = await db
      .select({
        categoryId: transactions.transactionCategoryId,
        accountType: transactions.accountType,
        amount: transactions.amount,
        financialAccountId: transactions.financialAccountId,
      })
      .from(transactions)
      .where(
        and(eq(transactions.hubId, hubId), eq(transactions.type, "expense")),
      );

    const grouped: Record<
      string,
      { amount: number; accountType: string; financialAccountId: string }
    > = {};

    for (const tx of expenseTxs) {
      const key = `${tx.categoryId}:${tx.accountType}`;
      if (!grouped[key]) {
        grouped[key] = {
          amount: 0,
          accountType: tx.accountType,
          financialAccountId: tx.financialAccountId,
        };
      }
      grouped[key].amount += tx.amount;
    }

    const results: {
      category: string;
      amount: number;
      accountType: string;
      accountBalance: number;
    }[] = [];

    for (const [key, value] of Object.entries(grouped)) {
      const [categoryId, accountType] = key.split(":");
      const categoryRow = await db.query.transactionCategories.findFirst({
        where: (cat) => eq(cat.id, categoryId),
        columns: { name: true },
      });
      const accountRow = await db.query.financialAccounts.findFirst({
        where: (acc) =>
          and(eq(acc.hubId, hubId), eq(acc.type, accountType as any)),
        columns: { initialBalance: true },
      });

      results.push({
        category: categoryRow?.name ?? "Unknown",
        amount: Math.abs(value.amount),
        accountType: value.accountType,
        accountBalance: accountRow?.initialBalance ?? 0,
      });
    }

    return { success: true, data: results };
  } catch (err: any) {
    console.error("Error in getCategoriesByExpensesDB:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch expense categories",
    };
  }
}

// GET Hubs for User
export async function getHubsByUserDB(userId: string) {
  try {
    const userHubs = await db.query.hubs.findMany({
      where: eq(hubs.userId, userId),
      columns: {
        id: true,
        name: true,
      },
      orderBy: desc(hubs.createdAt),
    });

    if (!userHubs || userHubs.length === 0) {
      return {
        success: false,
        message: "No hubs found for user",
        data: null,
      };
    }

    return {
      success: true,
      message: "Hubs fetched successfully",
      data: userHubs,
    };
  } catch (err: any) {
    console.error("Error fetching hubs:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch hubs",
      data: null,
    };
  }
}
