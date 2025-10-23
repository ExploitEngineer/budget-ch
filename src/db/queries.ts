import db from "./db";
import {
  hubs,
  hub_members,
  transactions,
  transaction_categories,
  financial_accounts,
  budgets,
  saving_goals,
  quick_tasks,
} from "./schema";
import { eq } from "drizzle-orm";
import type { QuickTask } from "./schema";

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

export type quickTasksArgs = {
  userId: string;
  hubId: string;
  name: string;
  checked: boolean;
};

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

// CREATE Transaction
export async function createTransactionDB({
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

// CREATE Transaction Category
export async function createTransactionCategoryDB(name: string, hubId: string) {
  try {
    const normalized = name.trim().toLowerCase();

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

    const [category] = await db
      .insert(transaction_categories)
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
}: {
  hubId: string;
  userId: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  warningPercentage: number;
  markerColor: string;
}) {
  try {
    const normalizedName = categoryName.trim().toLowerCase();

    const existingCategory = await db.query.transaction_categories.findFirst({
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
      .insert(transaction_categories)
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
    await db.insert(saving_goals).values({
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

// READ Transactions
export async function getAllTransactionsDB(hubId: string) {
  try {
    const allTransactions = await db.query.transactions.findMany({
      where: eq(transactions.hubId, hubId),
      orderBy: (t, { desc }) => [desc(t.addedAt)],
    });

    return {
      success: true,
      data: allTransactions,
    };
  } catch (err: any) {
    console.error("Error fetching transactions:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch transactions",
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
    await db.insert(quick_tasks).values({
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

// READ Tasks
export async function getTasksByHubDB(hubId: string): Promise<{
  success: boolean;
  data?: QuickTask[];
  message?: string;
}> {
  try {
    const tasks = await db
      .select()
      .from(quick_tasks)
      .where(eq(quick_tasks.hubId, hubId))
      .orderBy(quick_tasks.name);

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
      .update(quick_tasks)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(checked !== undefined ? { checked } : {}),
      })
      .where(eq(quick_tasks.id, taskId));

    return { success: true, message: "Task updated successfully" };
  } catch (err: any) {
    console.error("Error updating task", err);
    return { success: false, message: err.message || "Failed to update task" };
  }
}

// DELETE Task
export async function deleteTaskDB(taskId: string) {
  try {
    await db.delete(quick_tasks).where(eq(quick_tasks.id, taskId));
    return { success: true, message: "Task deleted successfully" };
  } catch (err: any) {
    console.error("Error deleting task", err);
    return { success: false, message: err.message || "Failed to delete task" };
  }
}
