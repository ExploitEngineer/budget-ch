import db from "@/db/db";
import {
  users,
  userSettings,
  subscriptions,
  hubs,
  hubMembers,
  financialAccounts,
  transactionCategories,
  transactions,
  recurringTransactionTemplates,
  budgets,
  budgetInstances,
  savingGoals,
  quickTasks,
  notifications,
} from "@/db/schema";
import { eq, or, inArray, and } from "drizzle-orm";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";
import { format } from "date-fns";

export async function exportHubData(hubIdArg?: string) {
  try {
    const hdrs = await headers();
    const { userId, hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!userId || !hubId) {
      return { success: false, message: "Authentication or Hub ID missing" };
    }

    // Verify membership
    const membership = await db.query.hubMembers.findFirst({
      where: and(eq(hubMembers.userId, userId), eq(hubMembers.hubId, hubId)),
    });

    if (!membership) {
      return { success: false, message: "Access denied" };
    }

    // Fetch Hub Data
    const hubAccounts = await db.query.financialAccounts.findMany({
      where: eq(financialAccounts.hubId, hubId),
    });

    const hubCategories = await db.query.transactionCategories.findMany({
      where: eq(transactionCategories.hubId, hubId),
    });

    const hubBudgets = await db.query.budgets.findMany({
      where: eq(budgets.hubId, hubId),
    });

    const budgetIds = hubBudgets.map((b) => b.id);
    const hubBudgetInstances = budgetIds.length > 0
      ? await db.query.budgetInstances.findMany({
          where: inArray(budgetInstances.budgetId, budgetIds),
        })
      : [];

    const hubTransactions = await db.query.transactions.findMany({
      where: eq(transactions.hubId, hubId),
    });

    const hubSavingGoals = await db.query.savingGoals.findMany({
      where: eq(savingGoals.hubId, hubId),
    });

    // Create lookup maps for names
    const accountMap = new Map(hubAccounts.map(a => [a.id, a.name]));
    const categoryMap = new Map(hubCategories.map(c => [c.id, c.name]));

    // Format data for export (Standardized Format)
    const exportData = {
      accounts: hubAccounts.map(a => ({
        name: a.name,
        type: a.type,
        balance: a.initialBalance,
        iban: a.iban,
        note: a.note,
      })),
      budgets: hubBudgetInstances.map(bi => {
        const budget = hubBudgets.find(b => b.id === bi.budgetId);
        return {
          category: categoryMap.get(budget?.transactionCategoryId || "") || "Uncategorized",
          allocated: bi.allocatedAmount,
          month: bi.month,
          year: bi.year,
          warning: budget?.warningPercentage || 80,
          color: budget?.markerColor || "standard",
        };
      }),
      transactions: hubTransactions.filter(t => t.type !== 'transfer').map(t => ({
        date: format(t.createdAt, "yyyy-MM-dd"),
        category: categoryMap.get(t.transactionCategoryId || "") || "Uncategorized",
        account: accountMap.get(t.financialAccountId || "") || "Unknown",
        amount: t.amount,
        type: t.type,
        source: t.source,
        note: t.note,
      })),
      transfers: hubTransactions.filter(t => t.type === 'transfer').map(t => ({
        date: format(t.createdAt, "yyyy-MM-dd"),
        from: accountMap.get(t.financialAccountId || "") || "Unknown",
        to: accountMap.get(t.destinationAccountId || "") || "Unknown",
        amount: Math.abs(t.amount),
        note: t.note,
      })),
      "saving-goals": hubSavingGoals.map(sg => ({
        name: sg.name,
        goal: sg.goalAmount,
        saved: sg.amountSaved,
        monthlyAllocation: sg.monthlyAllocation,
        account: accountMap.get(sg.financialAccountId || "") || null,
        dueDate: sg.dueDate ? format(sg.dueDate, "yyyy-MM-dd") : null,
      })),
    };

    return {
      success: true,
      data: {
        version: "1.2",
        exportedAt: new Date().toISOString(),
        hubId,
        data: exportData,
      }
    };
  } catch (err: any) {
    console.error("Error exporting hub data:", err);
    return { success: false, message: `Failed to export data: ${err.message}` };
  }
}

export async function exportFullUserData() {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    if (!userId) {
      return { success: false, message: "User not authenticated" };
    }

    // 1. User Profile
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // 2. User Settings
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    // 3. Subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    // 4. Hubs (Owned and Member)
    const memberships = await db.query.hubMembers.findMany({
      where: eq(hubMembers.userId, userId),
    });
    const hubIds = memberships.map((m) => m.hubId);

    const userHubs = hubIds.length > 0 ? await db.query.hubs.findMany({
      where: inArray(hubs.id, hubIds),
    }) : [];

    // 5. Hub-specific data
    let allAccounts: any[] = [];
    let allCategories: any[] = [];
    let allTransactions: any[] = [];
    let allRecurringTemplates: any[] = [];
    let allBudgets: any[] = [];
    let allBudgetInstances: any[] = [];
    let allSavingGoals: any[] = [];
    let allQuickTasks: any[] = [];
    let allNotifications: any[] = [];

    if (hubIds.length > 0) {
      allAccounts = await db.query.financialAccounts.findMany({
        where: inArray(financialAccounts.hubId, hubIds),
      });

      allCategories = await db.query.transactionCategories.findMany({
        where: inArray(transactionCategories.hubId, hubIds),
      });

      allTransactions = await db.query.transactions.findMany({
        where: inArray(transactions.hubId, hubIds),
      });

      allRecurringTemplates = await db.query.recurringTransactionTemplates.findMany({
        where: inArray(recurringTransactionTemplates.hubId, hubIds),
      });

      const hubBudgets = await db.query.budgets.findMany({
        where: inArray(budgets.hubId, hubIds),
      });
      allBudgets = hubBudgets;

      const budgetIds = hubBudgets.map((b) => b.id);
      if (budgetIds.length > 0) {
        allBudgetInstances = await db.query.budgetInstances.findMany({
          where: inArray(budgetInstances.budgetId, budgetIds),
        });
      }

      allSavingGoals = await db.query.savingGoals.findMany({
        where: inArray(savingGoals.hubId, hubIds),
      });

      allQuickTasks = await db.query.quickTasks.findMany({
        where: inArray(quickTasks.hubId, hubIds),
      });

      allNotifications = await db.query.notifications.findMany({
        where: or(
          inArray(notifications.hubId, hubIds),
          eq(notifications.userId, userId)
        ),
      });
    }

    const fullData = {
      profile: user,
      settings,
      subscription,
      hubs: userHubs,
      memberships,
      accounts: allAccounts,
      categories: allCategories,
      transactions: allTransactions,
      recurringTemplates: allRecurringTemplates,
      budgets: allBudgets,
      budgetInstances: allBudgetInstances,
      savingGoals: allSavingGoals,
      quickTasks: allQuickTasks,
      notifications: allNotifications,
      exportedAt: new Date().toISOString(),
      version: "1.1 (GDPR Full Export)",
    };

    return { success: true, data: fullData };
  } catch (err: any) {
    console.error("Error exporting full user data:", err);
    return { success: false, message: `Failed to export data: ${err.message}` };
  }
}
