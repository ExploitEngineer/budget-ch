"use server";

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
import { eq, or, inArray } from "drizzle-orm";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";

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
