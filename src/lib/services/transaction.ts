"use server";

import {
  createTransactionDB,
  createTransactionCategoryDB,
  getTransactionsDB,
  updateTransactionDB,
  deleteTransactionDB,
  deleteTransactionsDB,
  getFinancialAccountByType,
  getFinancialAccountById,
  updateFinancialAccountDB,
  deleteAllTransactionsAndCategoriesDB,
  deleteAllTransactionsDB,
  getSubscriptionByUserId,
  getMonthlyTransactionCount,
  getHubMemberRoleDB,
  getOwnedHubDB,
  createRecurringTransactionTemplateDB,
  getRecurringTransactionTemplatesDB,
  getRecurringTransactionTemplateByIdDB,
  updateRecurringTransactionTemplateDB,
  getBudgetsDB,
  getActiveRecurringTemplatesDB,
  updateTemplateLastGeneratedDB,
  markTemplateFailureDB,
} from "@/db/queries";
import type { createTransactionArgs } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import { transactionCategories } from "@/db/schema";
import { revalidatePath } from "next/cache";
import type { Transaction } from "../types/dashboard-types";
import type { TransactionType } from "../types/common-types";
import type { TransactionWithDetails } from "../types/domain-types";
import db from "@/db/db";
import { requireAdminRole } from "@/lib/auth/permissions";
import { addDays, format, isBefore, isAfter, startOfDay, isSameDay, subHours } from "date-fns";
import { sendNotification } from "@/lib/notifications";
import { BUDGET_THRESHOLD_80, BUDGET_THRESHOLD_100, RECURRING_PAYMENT_SUCCESS, RECURRING_PAYMENT_FAILED, RECURRING_PAYMENT_SUMMARY } from "@/lib/notifications/types";
import { transactions, notifications } from "@/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { getMailTranslations } from "@/lib/mail-translations";

// CREATE Transaction
export async function createTransaction({
  categoryName,
  amount,
  note,
  source,
  transactionType,
  accountId,
  destinationAccountId,
  isRecurring,
  frequencyDays,
  startDate,
  endDate,
  recurringStatus,
  hubIdArg,
  recurringTemplateId,
  userIdArg,
  createdAt,
}: Pick<
  createTransactionArgs,
  | "categoryName"
  | "amount"
  | "note"
  | "source"
  | "transactionType"
  | "destinationAccountId"
  | "createdAt"
> & {
  accountId: string;
  isRecurring?: boolean;
  frequencyDays?: number;
  startDate?: Date;
  endDate?: Date | null;
  recurringStatus?: "active" | "inactive";
  hubIdArg?: string;
  recurringTemplateId?: string;
  userIdArg?: string; // For Lambda/cron context - bypasses auth checks
}) {
  try {
    // For system operations (cron jobs), skip auth checks if userIdArg is provided
    let userId: string;
    let hubId: string;

    if (userIdArg && hubIdArg) {
      // System operation (e.g., recurring transaction generation)
      // Skip auth checks - trust the provided IDs
      userId = userIdArg;
      hubId = hubIdArg;
    } else {
      // Normal user operation - require auth
      const hdrs = await headers();
      const context = await getContext(hdrs, false);
      userId = context.userId;
      hubId = hubIdArg || context.hubId;

      if (!hubId) {
        return { success: false, message: "Hub ID is required." };
      }

      requireAdminRole(context.userRole);
    }

    // Subscription check - skip for system operations
    if (!userIdArg) {
      const subscription = await getSubscriptionByUserId(userId);

      if (!subscription) {
        const txCount = await getMonthlyTransactionCount(userId);
        if (txCount >= 300) {
          return {
            success: false,
            message:
              "Free plan limit reached: You can only create 300 transactions per month.",
          };
        }
      }
    }

    // Get source account by ID
    const account = await getFinancialAccountById(accountId, hubId);
    if (!account) {
      return {
        success: false,
        message: "Source account not found or you don't have access to it.",
      };
    }

    // For transfers, validate destination account
    let destinationAccount = null;
    if (transactionType === "transfer") {
      if (!destinationAccountId) {
        return {
          success: false,
          message: "Destination account is required for transfers.",
        };
      }

      destinationAccount = await getFinancialAccountById(destinationAccountId, hubId);
      if (!destinationAccount) {
        return {
          success: false,
          message: "Destination account not found or you don't have access to it.",
        };
      }

      if (account.id === destinationAccount.id) {
        return {
          success: false,
          message: "Cannot transfer to the same account.",
        };
      }
    }

    // Balance check and update logic
    let newBalance = Number(account.initialBalance ?? 0);
    if (transactionType === "expense") {
      if (newBalance < amount) {
        throw new Error("Insufficient funds in selected account.");
      }
      newBalance -= amount;
    } else if (transactionType === "income") {
      newBalance += amount;
    } else if (transactionType === "transfer") {
      // For transfers, deduct from source account
      if (newBalance < amount) {
        return {
          success: false,
          message: "Insufficient funds in source account.",
        };
      }
      newBalance -= amount;
    }

    await updateFinancialAccountDB({
      hubId,
      accountId: account.id,
      updatedData: { balance: newBalance },
    });

    // For transfers, also update destination account balance
    if (transactionType === "transfer" && destinationAccount) {
      const destinationBalance = Number(destinationAccount.initialBalance ?? 0) + amount;
      await updateFinancialAccountDB({
        hubId,
        accountId: destinationAccount.id,
        updatedData: { balance: destinationBalance },
      });
    }

    // For transfers, category is optional (can be null)
    let transactionCategoryId: string | null = null;

    if (transactionType !== "transfer" && categoryName) {
      const normalizedName = categoryName.trim().toLowerCase();

      const existingCategory = await db.query.transactionCategories.findFirst({
        where: (categories, { and, eq, sql }) =>
          and(
            sql`LOWER(${categories.name}) = ${normalizedName}`,
            eq(categories.hubId, hubId),
          ),
      });

      if (existingCategory) {
        // Use existing category
        transactionCategoryId = existingCategory.id;
      } else {
        // Create new category
        const [newCategory] = await db
          .insert(transactionCategories)
          .values({
            hubId,
            name: normalizedName,
          })
          .returning({ id: transactionCategories.id });

        transactionCategoryId = newCategory.id;
      }
    }

    await createTransactionDB({
      financialAccountId: account.id,
      hubId,
      userId,
      transactionCategoryId,
      amount,
      source,
      note,
      transactionType,
      destinationAccountId: transactionType === "transfer" ? destinationAccountId : null,
      recurringTemplateId: recurringTemplateId || null,
      createdAt,
    });

    // Create recurring transaction template if isRecurring is true
    if (isRecurring && frequencyDays && startDate) {
      const templateResult = await createRecurringTransactionTemplateDB({
        hubId,
        userId,
        financialAccountId: account.id,
        transactionCategoryId,
        type: transactionType,
        source: source || null,
        amount,
        note: note || null,
        frequencyDays,
        startDate,
        endDate: endDate || null,
        status: recurringStatus || "active",
        destinationAccountId: transactionType === "transfer" ? destinationAccountId : null,
      });

      if (!templateResult.success) {
        console.error("Failed to create recurring template:", templateResult.message);
        // Don't fail the transaction creation if template creation fails
      }
    }

    // Check budget thresholds if this is an expense with a category
    if (transactionType === "expense" && transactionCategoryId) {
      try {
        // Get all budgets for this category in the hub
        const budgetsResult = await getBudgetsDB(hubId);
        if (budgetsResult.success && budgetsResult.data) {
          const categoryBudgets = budgetsResult.data.filter(
            (b) => b.transactionCategoryId === transactionCategoryId,
          );

          for (const budget of categoryBudgets) {
            // Calculate total spent amount for this category (sum of all expense transactions)
            const spentResult = await db
              .select({
                totalSpent: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
              })
              .from(transactions)
              .where(
                and(
                  eq(transactions.hubId, hubId),
                  eq(transactions.transactionCategoryId, transactionCategoryId),
                  eq(transactions.type, "expense"),
                ),
              );

            const totalSpent = Number(spentResult[0]?.totalSpent ?? 0);
            const allocatedAmount = Number(budget.allocatedAmount ?? 0);

            if (allocatedAmount > 0) {
              const currentPercentage = totalSpent / allocatedAmount;
              // Calculate PREVIOUS percentage (before this transaction)
              const previousSpent = totalSpent - amount;
              const previousPercentage = previousSpent / allocatedAmount;

              // Get current month boundaries for duplicate checking
              const now = new Date();
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

              // Check existing notifications for this budget this month
              const monthlyNotificationsResult = await db
                .select()
                .from(notifications)
                .where(
                  and(
                    eq(notifications.hubId, hubId),
                    gte(notifications.createdAt, startOfMonth),
                  ),
                );

              // Find the most recent notification for this budget to check if it was "reset"
              const budgetNotifications = monthlyNotificationsResult.filter((n) => {
                if (!n.metadata) return false;
                try {
                  const metadata =
                    typeof n.metadata === "string"
                      ? JSON.parse(n.metadata)
                      : n.metadata;
                  return metadata.budgetId === budget.id;
                } catch {
                  return false;
                }
              });

              // Check if we've already sent 80% or 100% notification this month
              const has80Notification = budgetNotifications.some((n) => {
                try {
                  const metadata =
                    typeof n.metadata === "string"
                      ? JSON.parse(n.metadata)
                      : n.metadata;
                  return metadata.thresholdType === "80";
                } catch {
                  return false;
                }
              });

              const has100Notification = budgetNotifications.some((n) => {
                try {
                  const metadata =
                    typeof n.metadata === "string"
                      ? JSON.parse(n.metadata)
                      : n.metadata;
                  return metadata.thresholdType === "100";
                } catch {
                  return false;
                }
              });

              // Check if budget was reset (dropped below 60% after a notification)
              // We look for a "reset" marker in notifications or check if previous was below 60%
              const wasReset = budgetNotifications.some((n) => {
                try {
                  const metadata =
                    typeof n.metadata === "string"
                      ? JSON.parse(n.metadata)
                      : n.metadata;
                  return metadata.thresholdType === "reset";
                } catch {
                  return false;
                }
              });

              // Only send notification if:
              // 1. We're actually CROSSING the threshold (previous < threshold, current >= threshold)
              // 2. AND no notification for this threshold exists this month (or was reset)

              const shouldSend100 =
                currentPercentage >= 1 &&
                previousPercentage < 1 &&
                (!has100Notification || wasReset);

              const shouldSend80 =
                currentPercentage >= 0.8 &&
                currentPercentage < 1 &&
                previousPercentage < 0.8 &&
                (!has80Notification || wasReset);

              if (shouldSend100) {
                // Budget exceeded (100%) - hub-wide notification, emails sent to all hub members
                await sendNotification({
                  typeKey: BUDGET_THRESHOLD_100,
                  hubId,
                  userId: null, // Hub-wide notification, visible to all members
                  metadata: {
                    budgetId: budget.id,
                    categoryName: budget.categoryName,
                    spentAmount: totalSpent,
                    allocatedAmount: allocatedAmount,
                    thresholdType: "100",
                  },
                });
              } else if (shouldSend80) {
                // Budget reached 80% threshold - hub-wide notification, emails sent to all hub members
                await sendNotification({
                  typeKey: BUDGET_THRESHOLD_80,
                  hubId,
                  userId: null, // Hub-wide notification, visible to all members
                  metadata: {
                    budgetId: budget.id,
                    categoryName: budget.categoryName,
                    spentAmount: totalSpent,
                    allocatedAmount: allocatedAmount,
                    thresholdType: "80",
                  },
                });
              }
            }
          }
        }
      } catch (err) {
        // Don't fail transaction creation if notification check fails
        console.error("Error checking budget thresholds:", err);
      }
    }

    revalidatePath("/me/transactions");

    return { success: true };
  } catch (err: any) {
    console.error("Error in CreateTransaction:", err);
    return {
      success: false,
      message: err.message || "Failed to create transaction",
    };
  }
}

// CREATE Transaction Category
export async function createTransactionCategory(
  categoryName: string,
  hubId: string,
) {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    // Verify user has access to this hub
    const hubMember = await getHubMemberRoleDB(userId, hubId);
    const ownedHub = await getOwnedHubDB(userId);

    if (!hubMember && ownedHub?.id !== hubId) {
      return {
        success: false,
        message: "You don't have access to this hub",
      };
    }

    const normalized = categoryName.trim().toLowerCase();
    const category = await createTransactionCategoryDB(normalized, hubId);

    return { success: true, category };
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      return { success: false, reason: "DUPLICATE_CATEGORY" };
    }
    console.error(err);
    return { success: false, message: "Failed to create category" };
  }
}

// GET Transactions
export async function getTransactions(hubId: string): Promise<{
  success: boolean;
  message?: string;
  data: TransactionWithDetails[];
}> {
  try {
    const res = await getTransactionsDB(hubId);

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message ?? "Failed to fetch data",
        data: [],
      };
    }

    return { success: true, data: res.data };
  } catch (err: any) {
    console.error("Error in getTransactions:", err);
    return {
      success: false,
      message: err.message || "Failed to load transactions data",
      data: [],
    };
  }
}

// GET Recent Transactions
export async function getRecentTransactions(hubId: string): Promise<{
  success: boolean;
  message?: string;
  data: TransactionWithDetails[];
}> {
  try {
    const res = await getTransactionsDB(hubId, 4);

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch recent transactions",
        data: [],
      };
    }

    return { success: true, data: res.data };
  } catch (err: any) {
    console.error("Server action error in getRecentTransactions:", err);
    return {
      success: false,
      message: err?.message || "Unexpected server error.",
      data: [],
    };
  }
}

// GET Upcoming Recurring Transactions
export interface UpcomingRecurringTransaction {
  id: string;
  name: string;
  account: string;
  amount: string;
  date: string;
  templateId: string;
}

export async function getUpcomingRecurringTransactions(
  days: number = 14,
  hubIdArg?: string,
): Promise<{
  success: boolean;
  data?: UpcomingRecurringTransaction[];
  message?: string;
}> {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Missing hubId" };
    }

    const templates = await getRecurringTransactionTemplatesDB(hubId);

    const today = startOfDay(new Date());
    const nextDays = addDays(today, days);
    const upcomingTransactions: UpcomingRecurringTransaction[] = [];

    for (const template of templates) {
      const startDate = startOfDay(new Date(template.startDate));
      let currentDate = startDate;

      // If start date is in the past, calculate next occurrence
      if (template.frequencyDays > 0) {
        while (isBefore(currentDate, today)) {
          currentDate = startOfDay(addDays(currentDate, template.frequencyDays));
        }
      }

      // Generate occurrences up to specified days ahead
      let iterations = 0;
      const maxIterations = 100; // Safety limit

      while (
        (isBefore(currentDate, nextDays) || isSameDay(currentDate, nextDays)) &&
        iterations < maxIterations
      ) {
        iterations++;

        // Check if endDate exists and if currentDate is after endDate
        if (template.endDate) {
          const endDate = startOfDay(new Date(template.endDate));
          if (isAfter(currentDate, endDate)) {
            break;
          }
        }

        // Only add if date is today or in the future (within specified days)
        if (
          (isSameDay(currentDate, today) || isAfter(currentDate, today)) &&
          (isBefore(currentDate, nextDays) || isSameDay(currentDate, nextDays))
        ) {
          upcomingTransactions.push({
            id: `${template.id}-${currentDate.getTime()}`,
            name: template.source || template.categoryName || "—",
            account: template.accountName || "—",
            amount: `CHF ${template.amount.toFixed(2)}`,
            date: format(currentDate, "d.M.yyyy"),
            templateId: template.id,
          });

          // Optimization: Only show the next occurrence for each recurring template 
          // to prevent high-frequency transactions (e.g., daily) from crowding out others.
          break;
        }

        // Move to next occurrence
        currentDate = startOfDay(addDays(currentDate, template.frequencyDays));

        // Stop if we've gone past the specified day window
        if (isAfter(currentDate, nextDays)) {
          break;
        }
      }
    }

    // Sort by date
    upcomingTransactions.sort((a, b) => {
      const dateA = new Date(a.date.split(".").reverse().join("-"));
      const dateB = new Date(b.date.split(".").reverse().join("-"));
      return dateA.getTime() - dateB.getTime();
    });

    // Limit to first 10 upcoming transactions
    return {
      success: true,
      data: upcomingTransactions.slice(0, 10),
    };
  } catch (err: any) {
    console.error("Server action error in getUpcomingRecurringTransactions:", err);
    return {
      success: false,
      message: err?.message || "Unexpected server error.",
    };
  }
}

// GET All Recurring Transaction Templates (for templates management)
export async function getRecurringTransactionTemplates(
  hubIdArg?: string,
  statusFilter: 'active' | 'inactive' | 'all' = 'all'
): Promise<{
  success: boolean;
  data?: any[];
  message?: string;
}> {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Missing hubId" };
    }

    const templates = await getRecurringTransactionTemplatesDB(hubId, statusFilter);

    return {
      success: true,
      data: templates,
    };
  } catch (err: any) {
    console.error("Server action error in getRecurringTransactionTemplates:", err);
    return {
      success: false,
      message: err?.message || "Unexpected server error.",
    };
  }
}

// GET Single Recurring Transaction Template
export async function getRecurringTransactionTemplate(templateId: string): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const template = await getRecurringTransactionTemplateByIdDB(templateId, hubId);

    if (!template) {
      return {
        success: false,
        message: "Recurring transaction template not found",
      };
    }

    return { success: true, data: template };
  } catch (err: any) {
    console.error("Server action error in getRecurringTransactionTemplate:", err);
    return {
      success: false,
      message: err?.message || "Unexpected server error.",
    };
  }
}

// UPDATE Recurring Transaction Template
export async function updateRecurringTransactionTemplate(
  templateId: string,
  updatedData: {
    // Recurrence settings
    frequencyDays?: number;
    startDate?: Date;
    endDate?: Date | null;
    status?: "active" | "inactive";
    // Transaction details
    source?: string | null;
    amount?: number;
    financialAccountId?: string;
    transactionCategoryId?: string | null;
    destinationAccountId?: string | null;
    type?: TransactionType;
    note?: string | null;
  },
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, false);

    requireAdminRole(userRole);

    const res = await updateRecurringTransactionTemplateDB({
      templateId,
      hubId,
      updatedData,
    });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to update recurring transaction template.",
      };
    }

    revalidatePath("/me/dashboard");
    revalidatePath("/me/transactions");

    return {
      success: true,
      message: "Recurring transaction template updated successfully!",
      data: res.data,
    };
  } catch (err: any) {
    console.error("Error in updateRecurringTransactionTemplate:", err);
    return {
      success: false,
      message: err.message || "Unexpected error while updating recurring transaction template.",
    };
  }
}

// UPDATE Transaction
export async function updateTransaction(
  transactionId: string,
  formData: FormData,
  hubIdArg?: string,
) {
  try {
    const hdrs = await headers();
    const { userId, userRole, hubId: sessionHubId } = await getContext(
      hdrs,
      false,
    );
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Hub ID is required." };
    }

    requireAdminRole(userRole);

    // Get the existing transaction to handle balance reversal
    const existingTxResult = await getTransactionsDB(hubId);
    if (!existingTxResult.success || !existingTxResult.data) {
      return { success: false, message: "Could not fetch existing transaction for update." };
    }
    const existingTx = existingTxResult.data.find(t => t.id === transactionId);

    if (!existingTx) {
      return { success: false, message: "Transaction not found." };
    }

    const source = formData.get("source")?.toString().trim() || "";
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const note = formData.get("note")?.toString() || null;
    const createdAtStr = formData.get("createdAt")?.toString() || "";
    const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();

    /* 
    console.log('DEBUG: updateTransaction - formData entries:');
    formData.forEach((v, k) => console.log(`  ${k}: ${v}`));

    console.log('DEBUG: updateTransaction - parsed date:', {
      createdAtStr,
      parsedDate: createdAt.toISOString(),
      isDefaulted: !createdAtStr
    });
    */

    const transactionType = formData.get("transactionType")?.toString() as TransactionType | undefined;
    const accountId = formData.get("accountId")?.toString(); // Get new account ID from form
    const destinationAccountId = formData.get("destinationAccountId")?.toString() || null;

    if (!accountId) {
      return { success: false, message: "Account ID is required." };
    }

    const categoryName =
      formData.get("categoryName")?.toString().trim().toLowerCase() || null;

    let transactionCategoryId: string | null = null;

    if (categoryName && transactionType !== "transfer") {
      const existingCategory = await db.query.transactionCategories.findFirst({
        where: (categories, { and, eq, sql }) =>
          and(
            eq(categories.hubId, hubId),
            sql`LOWER(${categories.name}) = ${categoryName}`,
          ),
      });

      if (existingCategory) {
        transactionCategoryId = existingCategory.id;
      } else {
        const [newCategory] = await db
          .insert(transactionCategories)
          .values({
            hubId,
            name: categoryName,
          })
          .returning({ id: transactionCategories.id });

        transactionCategoryId = newCategory.id;
      }
    }

    // --- BALANCE SYNCHRONIZATION LOGIC ---

    // 1. Reverse old transaction impact
    const oldAccount = await getFinancialAccountById(existingTx.financialAccountId, hubId);
    if (oldAccount) {
      let restoredBalance = Number(oldAccount.initialBalance ?? 0);
      if (existingTx.type === "expense") {
        restoredBalance += Number(existingTx.amount);
      } else if (existingTx.type === "income") {
        restoredBalance -= Number(existingTx.amount);
      } else if (existingTx.type === "transfer") {
        restoredBalance += Number(existingTx.amount);
        // Also reverse destination account for transfers
        if (existingTx.destinationAccountId) {
          const oldDestAccount = await getFinancialAccountById(existingTx.destinationAccountId, hubId);
          if (oldDestAccount) {
            const restoredDestBalance = Number(oldDestAccount.initialBalance ?? 0) - Number(existingTx.amount);
            await updateFinancialAccountDB({
              hubId,
              accountId: oldDestAccount.id,
              updatedData: { balance: restoredDestBalance },
            });
          }
        }
      }
      await updateFinancialAccountDB({
        hubId,
        accountId: oldAccount.id,
        updatedData: { balance: restoredBalance },
      });
    }

    // 2. Apply new transaction impact
    const newAccount = await getFinancialAccountById(accountId, hubId);
    if (!newAccount) {
      return { success: false, message: "Target account not found." };
    }

    let nextBalance = Number(newAccount.initialBalance ?? 0);
    if (transactionType === "expense") {
      if (nextBalance < amount) {
        throw new Error("Insufficient funds in selected account.");
      }
      nextBalance -= amount;
    } else if (transactionType === "income") {
      nextBalance += amount;
    } else if (transactionType === "transfer") {
      if (nextBalance < amount) {
        return { success: false, message: "Insufficient funds in source account." };
      }
      nextBalance -= amount;
      // Also apply to destination account for transfers
      if (destinationAccountId) {
        const newDestAccount = await getFinancialAccountById(destinationAccountId, hubId);
        if (newDestAccount) {
          const nextDestBalance = Number(newDestAccount.initialBalance ?? 0) + amount;
          await updateFinancialAccountDB({
            hubId,
            accountId: newDestAccount.id,
            updatedData: { balance: nextDestBalance },
          });
        }
      }
    }

    await updateFinancialAccountDB({
      hubId,
      accountId: newAccount.id,
      updatedData: { balance: nextBalance },
    });

    const res = await updateTransactionDB({
      hubId,
      transactionId,
      updatedData: {
        source,
        amount,
        note,
        createdAt,
        financialAccountId: accountId,
        transactionCategoryId,
        destinationAccountId: transactionType === "transfer" ? destinationAccountId : null,
        transactionType,
      },
    });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to update transaction.",
      };
    }

    revalidatePath("/me/transactions");

    return {
      success: true,
      message: "Transaction updated successfully!",
      data: res.data,
    };
  } catch (err: any) {
    console.error("Error in updateTransaction:", err);
    return {
      success: false,
      message: err.message || "Unexpected error while updating transaction.",
    };
  }
}

// DELETE Transaction
export async function deleteTransaction(
  transactionId: string,
  hubIdArg?: string,
) {
  try {
    const hdrs = await headers();
    const { userId, userRole, hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return { success: false, message: "Hub ID is required." };
    }

    requireAdminRole(userRole);

    // Get transaction details for balance reversal
    const existingTxResult = await getTransactionsDB(hubId);
    const existingTx = existingTxResult.data?.find(t => t.id === transactionId);

    if (existingTx) {
      // Reverse balance impact
      const account = await getFinancialAccountById(existingTx.financialAccountId, hubId);
      if (account) {
        let restoredBalance = Number(account.initialBalance ?? 0);
        if (existingTx.type === "expense") {
          restoredBalance += Number(existingTx.amount);
        } else if (existingTx.type === "income") {
          restoredBalance -= Number(existingTx.amount);
        } else if (existingTx.type === "transfer") {
          restoredBalance += Number(existingTx.amount);
          if (existingTx.destinationAccountId) {
            const destAccount = await getFinancialAccountById(existingTx.destinationAccountId, hubId);
            if (destAccount) {
              const restoredDestBalance = Number(destAccount.initialBalance ?? 0) - Number(existingTx.amount);
              await updateFinancialAccountDB({
                hubId,
                accountId: destAccount.id,
                updatedData: { balance: restoredDestBalance }
              });
            }
          }
        }
        await updateFinancialAccountDB({
          hubId,
          accountId: account.id,
          updatedData: { balance: restoredBalance },
        });
      }
    }

    const res = await deleteTransactionDB({ hubId, transactionId });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to delete transaction.",
      };
    }

    // Check if deleting this expense caused any budget to drop below 60%
    // If so, create a "reset" marker so that future threshold crossings will trigger new emails
    if (existingTx && existingTx.type === "expense" && existingTx.transactionCategoryId) {
      try {
        const budgetsResult = await getBudgetsDB(hubId);
        if (budgetsResult.success && budgetsResult.data) {
          const categoryBudgets = budgetsResult.data.filter(
            (b) => b.transactionCategoryId === existingTx.transactionCategoryId,
          );

          for (const budget of categoryBudgets) {
            // Calculate NEW total spent (after deletion)
            const spentResult = await db
              .select({
                totalSpent: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
              })
              .from(transactions)
              .where(
                and(
                  eq(transactions.hubId, hubId),
                  eq(transactions.transactionCategoryId, existingTx.transactionCategoryId),
                  eq(transactions.type, "expense"),
                ),
              );

            const totalSpent = Number(spentResult[0]?.totalSpent ?? 0);
            const allocatedAmount = Number(budget.allocatedAmount ?? 0);

            if (allocatedAmount > 0) {
              const currentPercentage = totalSpent / allocatedAmount;
              // Calculate what percentage was BEFORE deletion
              const previousSpent = totalSpent + Number(existingTx.amount);
              const previousPercentage = previousSpent / allocatedAmount;

              // If we dropped below 60% from 80%+, create a reset marker
              if (currentPercentage < 0.6 && previousPercentage >= 0.8) {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                // Check if there's already a reset marker this month
                const existingResetResult = await db
                  .select()
                  .from(notifications)
                  .where(
                    and(
                      eq(notifications.hubId, hubId),
                      gte(notifications.createdAt, startOfMonth),
                    ),
                  );

                const hasResetMarker = existingResetResult.some((n) => {
                  try {
                    const metadata =
                      typeof n.metadata === "string"
                        ? JSON.parse(n.metadata)
                        : n.metadata;
                    return metadata?.budgetId === budget.id && metadata?.thresholdType === "reset";
                  } catch {
                    return false;
                  }
                });

                if (!hasResetMarker) {
                  // Create an internal "reset" marker notification (channel: "web" so no email is sent)
                  await sendNotification({
                    hubId,
                    userId: null,
                    type: "info",
                    title: "Budget Reset",
                    message: `${budget.categoryName} budget has dropped below 60%`,
                    channel: "web",
                    metadata: {
                      budgetId: budget.id,
                      categoryName: budget.categoryName,
                      thresholdType: "reset",
                      currentPercentage: Math.round(currentPercentage * 100),
                    },
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        // Don't fail deletion if reset marker creation fails
        console.error("Error creating budget reset marker:", err);
      }
    }

    revalidatePath("/me/transactions");

    return {
      success: true,
      message: "Transaction deleted successfully!",
    };
  } catch (err: any) {
    console.error("Error in deleteTransaction:", err);
    return {
      success: false,
      message: err.message || "Unexpected error while deleting transaction.",
    };
  }
}

// DELETE Multiple Transactions
export async function deleteTransactions(transactionIds: string[]) {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, false);

    requireAdminRole(userRole);

    if (!transactionIds || transactionIds.length === 0) {
      return {
        success: false,
        message: "No transactions selected for deletion.",
      };
    }

    // Get transactions to handle balance reversal
    const existingTxsResult = await getTransactionsDB(hubId);
    const transactionsToReverse = existingTxsResult.data?.filter(t => transactionIds.includes(t.id)) || [];

    for (const tx of transactionsToReverse) {
      const account = await getFinancialAccountById(tx.financialAccountId, hubId);
      if (account) {
        let restoredBalance = Number(account.initialBalance ?? 0);
        if (tx.type === "expense") {
          restoredBalance += Number(tx.amount);
        } else if (tx.type === "income") {
          restoredBalance -= Number(tx.amount);
        } else if (tx.type === "transfer") {
          restoredBalance += Number(tx.amount);
          if (tx.destinationAccountId) {
            const destAccount = await getFinancialAccountById(tx.destinationAccountId, hubId);
            if (destAccount) {
              const restoredDestBalance = Number(destAccount.initialBalance ?? 0) - Number(tx.amount);
              await updateFinancialAccountDB({
                hubId,
                accountId: destAccount.id,
                updatedData: { balance: restoredDestBalance }
              });
            }
          }
        }
        await updateFinancialAccountDB({
          hubId,
          accountId: account.id,
          updatedData: { balance: restoredBalance },
        });
      }
    }

    const res = await deleteTransactionsDB({ hubId, transactionIds });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to delete transactions.",
      };
    }

    revalidatePath("/me/transactions");

    return {
      success: true,
      message: `${res.count || transactionIds.length} transaction(s) deleted successfully!`,
    };
  } catch (err: any) {
    console.error("Error in deleteTransactions:", err);
    return {
      success: false,
      message: err.message || "Unexpected error while deleting transactions.",
    };
  }
}

// DELETE ALL Transactions [Action]
export async function deleteAllTransactions() {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, false);

    requireAdminRole(userRole);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    // Get ALL transactions in the hub to handle balance reversal
    const existingTxsResult = await getTransactionsDB(hubId);
    const transactionsToReverse = existingTxsResult.data || [];

    for (const tx of transactionsToReverse) {
      const account = await getFinancialAccountById(tx.financialAccountId, hubId);
      if (account) {
        let restoredBalance = Number(account.initialBalance ?? 0);
        if (tx.type === "expense") {
          restoredBalance += Number(tx.amount);
        } else if (tx.type === "income") {
          restoredBalance -= Number(tx.amount);
        } else if (tx.type === "transfer") {
          restoredBalance += Number(tx.amount);
          if (tx.destinationAccountId) {
            const destAccount = await getFinancialAccountById(tx.destinationAccountId, hubId);
            if (destAccount) {
              const restoredDestBalance = Number(destAccount.initialBalance ?? 0) - Number(tx.amount);
              await updateFinancialAccountDB({
                hubId,
                accountId: destAccount.id,
                updatedData: { balance: restoredDestBalance }
              });
            }
          }
        }
        await updateFinancialAccountDB({
          hubId,
          accountId: account.id,
          updatedData: { balance: restoredBalance },
        });
      }
    }

    const res = await deleteAllTransactionsDB(hubId);

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to delete all transactions.",
      };
    }

    revalidatePath("/me/transactions");

    return {
      success: true,
      message: "All transactions deleted successfully!",
    };
  } catch (err: any) {
    console.error("Error in deleteAllTransactions:", err);
    return {
      success: false,
      message:
        err.message || "Unexpected error while deleting all transactions.",
    };
  }
}

// DELETE ALL Transactions and Categories [Action]
export async function deleteAllTransactionsAndCategories() {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, false);

    requireAdminRole(userRole);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    // Get ALL transactions in the hub to handle balance reversal
    const existingTxsResult = await getTransactionsDB(hubId);
    const transactionsToReverse = existingTxsResult.data || [];

    for (const tx of transactionsToReverse) {
      const account = await getFinancialAccountById(tx.financialAccountId, hubId);
      if (account) {
        let restoredBalance = Number(account.initialBalance ?? 0);
        if (tx.type === "expense") {
          restoredBalance += Number(tx.amount);
        } else if (tx.type === "income") {
          restoredBalance -= Number(tx.amount);
        } else if (tx.type === "transfer") {
          restoredBalance += Number(tx.amount);
          if (tx.destinationAccountId) {
            const destAccount = await getFinancialAccountById(tx.destinationAccountId, hubId);
            if (destAccount) {
              const restoredDestBalance = Number(destAccount.initialBalance ?? 0) - Number(tx.amount);
              await updateFinancialAccountDB({
                hubId,
                accountId: destAccount.id,
                updatedData: { balance: restoredDestBalance }
              });
            }
          }
        }
        await updateFinancialAccountDB({
          hubId,
          accountId: account.id,
          updatedData: { balance: restoredBalance },
        });
      }
    }

    const res = await deleteAllTransactionsAndCategoriesDB(hubId);

    if (!res.success) {
      return {
        success: false,
        message:
          res.message || "Failed to delete all transactions and categories.",
      };
    }

    revalidatePath("/me/transactions");

    return {
      success: true,
      message: "All transactions and related categories deleted.",
    };
  } catch (err: any) {
    console.error("Error in deleteAllTransactionsAndCategories:", err);
    return {
      success: false,
      message:
        err.message ||
        "Unexpected error while deleting all transactions and categories.",
    };
  }
}

// Interface for hub-level summary
interface HubSummary {
  hubId: string;
  hubName: string;
  userLanguage: string;
  success: Array<{ name: string; amount: number }>;
  failed: Array<{ name: string; amount: number; reason: string }>;
  skipped: Array<{ name: string; nextDue: string }>;
}

// GENERATE Recurring Transactions - Hub-Batched Version
export async function generateRecurringTransactions() {
  try {
    const templatesResult = await getActiveRecurringTemplatesDB();

    if (!templatesResult.success || !templatesResult.data) {
      return {
        success: false,
        message: templatesResult.message || "Failed to fetch templates",
        stats: { success: 0, failed: 0, skipped: 0, errors: [] },
      };
    }

    const templates = templatesResult.data;
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ templateId: string; error: string }>,
    };

    const today = startOfDay(new Date());

    // Group templates by hubId for batched notifications
    const hubSummaries: Record<string, HubSummary> = {};

    for (const template of templates) {
      // Initialize hub summary if not exists
      if (!hubSummaries[template.hubId]) {
        hubSummaries[template.hubId] = {
          hubId: template.hubId,
          hubName: "", // We don't have hub name from template, will use generic
          userLanguage: template.userLanguage || "en",
          success: [],
          failed: [],
          skipped: [],
        };
      }

      const hubSummary = hubSummaries[template.hubId];

      try {
        // Check if template is due for generation
        const isDue = isTemplateDue(template, today);

        if (!isDue) {
          results.skipped++;

          // Calculate next due date for skipped items
          const lastGenerated = template.lastGeneratedDate
            ? startOfDay(new Date(template.lastGeneratedDate))
            : startOfDay(new Date(template.startDate));
          const nextDue = addDays(lastGenerated, template.frequencyDays);

          hubSummary.skipped.push({
            name: template.source || template.categoryName || "Unnamed",
            nextDue: format(nextDue, "d.M.yyyy"),
          });
          continue;
        }

        // Process the transaction
        const result = await createTransaction({
          categoryName: template.categoryName || "",
          amount: template.amount,
          note: template.note || "Auto-generated from recurring template",
          source: template.source,
          transactionType: template.type,
          accountId: template.financialAccountId,
          destinationAccountId: template.destinationAccountId,
          hubIdArg: template.hubId,
          userIdArg: template.userId || undefined,
          recurringTemplateId: template.id,
        });

        if (result.success) {
          await updateTemplateLastGeneratedDB(template.id);
          results.success++;

          hubSummary.success.push({
            name: template.source || template.categoryName || "Recurring Payment",
            amount: template.amount,
          });
        } else {
          await markTemplateFailureDB(template.id, result.message || "Unknown error");
          results.failed++;
          results.errors.push({
            templateId: template.id,
            error: result.message || "Unknown error",
          });

          // Translate error message to user's language
          const userLang = template.userLanguage || "en";
          const t = await getMailTranslations(userLang);
          let translatedError = result.message || "Unknown error";
          const errorMessage = result.message?.toLowerCase() || "";

          if (errorMessage.includes("insufficient funds in selected account")) {
            translatedError = t("notifications.errors.transaction.insufficient-funds");
          } else if (errorMessage.includes("insufficient funds in source account")) {
            translatedError = t("notifications.errors.transaction.insufficient-funds-source");
          } else if (errorMessage.includes("account not found") || errorMessage.includes("don't have access")) {
            translatedError = t("notifications.errors.transaction.account-not-found");
          } else if (errorMessage.includes("destination account not found")) {
            translatedError = t("notifications.errors.transaction.destination-account-not-found");
          } else if (errorMessage.includes("cannot transfer to the same account")) {
            translatedError = t("notifications.errors.transaction.same-account-transfer");
          } else {
            translatedError = t("notifications.errors.transaction.unknown-error");
          }

          hubSummary.failed.push({
            name: template.source || template.categoryName || "Recurring Payment",
            amount: template.amount,
            reason: translatedError,
          });
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          templateId: template.id,
          error: error.message || "Unexpected error",
        });

        await markTemplateFailureDB(template.id, error.message || "Unexpected error");

        // Add to hub summary with translated error
        const userLang = template.userLanguage || "en";
        const t = await getMailTranslations(userLang);
        hubSummary.failed.push({
          name: template.source || template.categoryName || "Recurring Payment",
          amount: template.amount,
          reason: t("notifications.errors.transaction.unknown-error"),
        });
      }
    }

    // Send ONE consolidated summary email per hub
    for (const hubId in hubSummaries) {
      const summary = hubSummaries[hubId];

      // Only send if there's activity (success or failed transactions processed)
      if (summary.success.length > 0 || summary.failed.length > 0) {
        await sendNotification({
          typeKey: RECURRING_PAYMENT_SUMMARY,
          hubId: summary.hubId,
          userId: null, // Hub-wide notification
          metadata: {
            hubName: summary.hubName || "Your Hub",
            successCount: summary.success.length,
            failedCount: summary.failed.length,
            skippedCount: summary.skipped.length,
            successItems: summary.success,
            failedItems: summary.failed,
            skippedItems: summary.skipped,
          },
        });
      }
    }

    return {
      success: true,
      message: `Generated ${results.success} transactions, ${results.failed} failed, ${results.skipped} skipped`,
      stats: results,
    };
  } catch (err: any) {
    console.error("Error in generateRecurringTransactions:", err);
    return {
      success: false,
      message: err.message || "Failed to generate recurring transactions",
      stats: { success: 0, failed: 0, skipped: 0, errors: [] },
    };
  }
}

// Helper function to check if a template is due for generation
function isTemplateDue(
  template: {
    lastGeneratedDate: Date | null;
    frequencyDays: number;
    startDate: Date;
  },
  today: Date
): boolean {
  // If never generated, check if start date has passed
  if (!template.lastGeneratedDate) {
    const startDate = startOfDay(new Date(template.startDate));
    return isBefore(startDate, today) || isSameDay(startDate, today);
  }

  // Check if enough days have passed since last generation
  const lastGenerated = startOfDay(new Date(template.lastGeneratedDate));
  const nextDueDate = addDays(lastGenerated, template.frequencyDays);

  return isBefore(nextDueDate, today) || isSameDay(nextDueDate, today);
}
