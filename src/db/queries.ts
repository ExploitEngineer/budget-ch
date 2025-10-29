import db from "./db";
import {
  hubs,
  users,
  hub_members,
  transactions,
  transaction_categories,
  financial_accounts,
  budgets,
  saving_goals,
  quick_tasks,
} from "./schema";
import { eq, desc, and } from "drizzle-orm";
import type { QuickTask } from "./schema";
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
  title: string;
  goalAmount: number;
  amountSaved: number;
  remaining: number;
  value: number;
  accountType: string | null;
  dueDate: Date | null;
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
  } catch (err) {
    console.error("Error creating Transaction ", err);
    return { success: false, message: "Failed to create transaction" };
  }
}

// READ Transactions
export async function getTransactionsDB(hubId: string) {
  try {
    const transactionsList = await db
      .select({
        id: transactions.id,
        date: transactions.addedAt,
        recipient: transactions.source,
        accountType: transactions.accountType,
        category: transaction_categories.name,
        note: transactions.note,
        amount: transactions.amount,
      })
      .from(transactions)
      .leftJoin(
        transaction_categories,
        eq(transactions.transactionCategoryId, transaction_categories.id),
      )
      .leftJoin(
        financial_accounts,
        eq(transactions.financialAccountId, financial_accounts.id),
      )
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.hubId, hubId))
      .orderBy(desc(transactions.addedAt));

    return { success: true, data: transactionsList };
  } catch (err: any) {
    console.error("Error fetching transactions for table:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch transactions.",
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
      columns: { hubId: true },
    });

    if (!tx) return { success: false, message: "Transaction not found" };
    if (tx.hubId !== hubId) return { success: false, message: "Access denied" };

    const deleted = await db
      .delete(transactions)
      .where(eq(transactions.id, transactionId))
      .returning();

    return { success: true, data: deleted[0] };
  } catch (err: any) {
    console.error("Error deleting transaction:", err);
    return {
      success: false,
      message: err.message || "Failed to delete transaction",
    };
  }
}

// READ Recent Transactions on Limit
export async function getRecentTransactionsDB(hubId: string, limit = 4) {
  try {
    const data = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        note: transactions.note,
        addedAt: transactions.addedAt,
        categoryName: transaction_categories.name,
        accountName: financial_accounts.name,
        recipientName: transactions.source,
        accountType: transactions.accountType,
      })
      .from(transactions)
      .leftJoin(
        transaction_categories,
        eq(transactions.transactionCategoryId, transaction_categories.id),
      )
      .leftJoin(
        financial_accounts,
        eq(transactions.financialAccountId, financial_accounts.id),
      )
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.hubId, hubId))
      .orderBy(desc(transactions.addedAt))
      .limit(limit);

    return {
      success: true,
      message: "Successfully fetched recent transactions.",
      data,
    };
  } catch (err: any) {
    console.error("Error fetching recent transactions:", err);
    return {
      success: false,
      message: err.message || "Failed to get recent transactions.",
    };
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
}: CreateBudgetInput) {
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

// READ  Savings Goals
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
        name: saving_goals.name,
        goalAmount: saving_goals.goalAmount,
        amountSaved: saving_goals.amountSaved,
        monthlyAllocation: saving_goals.monthlyAllocation,
        accountType: saving_goals.accountType,
        dueDate: saving_goals.dueDate,
      })
      .from(saving_goals)
      .where(eq(saving_goals.hubId, hubId))
      .orderBy(desc(saving_goals.dueDate));

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
        title: g.name,
        goalAmount: g.goalAmount,
        amountSaved: g.amountSaved,
        remaining: g.goalAmount - g.amountSaved,
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

// READ Budgets
export async function getBudgetsDB(hubId: string, limit?: number) {
  try {
    const query = db
      .select({
        id: budgets.id,
        category: transaction_categories.name,
        allocated: budgets.allocatedAmount,
        spent: budgets.spentAmount,
      })
      .from(budgets)
      .leftJoin(
        transaction_categories,
        eq(transaction_categories.id, budgets.transactionCategoryId),
      )
      .leftJoin(
        transactions,
        and(
          eq(transactions.transactionCategoryId, budgets.transactionCategoryId),
          eq(transactions.hubId, budgets.hubId),
        ),
      )
      .where(eq(budgets.hubId, hubId))
      .groupBy(budgets.id, transaction_categories.name)
      .orderBy(desc(budgets.createdAt));

    if (limit) query.limit(limit);

    const data = await query;

    const formatted = data.map((b) => {
      const allocated = Number(b.allocated) || 0;
      const spent = Number(b.spent) || 0;
      const remaining = allocated - spent;
      const progress =
        allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;

      return {
        id: b.id,
        category: b.category || "Uncategorized",
        content: `CHF ${spent.toLocaleString()} / ${allocated.toLocaleString()}`,
        value: Math.round(progress),
        remaining,
        allocated,
        spent,
      };
    });

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error("Error fetching budgets table:", err);
    return {
      success: false,
      message: err.message || "Failed to fetch budgets",
    };
  }
}

// READ Budgets Allocated & Spent Amount
export async function getBudgetsAmountsDB(hubId: string) {
  try {
    const results = await db
      .select({
        id: budgets.id,
        allocatedAmount: budgets.allocatedAmount,
        spentAmount: budgets.spentAmount,
      })
      .from(budgets)
      .where(eq(budgets.hubId, hubId));

    return {
      success: true,
      message: "Susscessfully got budget amounts",
      data: results,
    };
  } catch (err: any) {
    console.error("Error getting allocated or spent amount", err);
    return {
      success: false,
      message: err.message || "Failed to get budget amounts",
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

      const currentCategory = await db.query.transaction_categories.findFirst({
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
        const existingCategory =
          await db.query.transaction_categories.findFirst({
            where: (cat) => and(eq(cat.hubId, hubId), eq(cat.name, newName)),
          });

        if (existingCategory) {
          return {
            success: false,
            message: "A category with this name already exists in your hub.",
          };
        }

        await db
          .update(transaction_categories)
          .set({ name: newName })
          .where(eq(transaction_categories.id, currentCategory.id));

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
      columns: { hubId: true },
    });

    if (!budget) return { success: false, message: "Budget not found." };
    if (budget.hubId !== hubId)
      return { success: false, message: "Access denied." };

    const deleted = await db
      .delete(budgets)
      .where(eq(budgets.id, budgetId))
      .returning();

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
