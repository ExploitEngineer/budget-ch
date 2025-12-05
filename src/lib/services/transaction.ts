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
} from "@/db/queries";
import type { createTransactionArgs } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import { transactionCategories } from "@/db/schema";
import { revalidatePath } from "next/cache";
import type { Transaction } from "../types/dashboard-types";
import type { TransactionType } from "../types/common-types";
import db from "@/db/db";
import { requireAdminRole } from "@/lib/auth/permissions";
import { addDays, format, isBefore, isAfter, startOfDay, isSameDay } from "date-fns";

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
}: Pick<
  createTransactionArgs,
  | "categoryName"
  | "amount"
  | "note"
  | "source"
  | "transactionType"
  | "destinationAccountId"
> & {
  accountId: string;
  isRecurring?: boolean;
  frequencyDays?: number;
  startDate?: Date;
  endDate?: Date | null;
  recurringStatus?: "active" | "inactive";
}) {
  try {
    const hdrs = await headers();
    const { userId, userRole, hubId } = await getContext(hdrs, false);

    requireAdminRole(userRole);

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
export async function getTransactions(): Promise<{
  success: boolean;
  message?: string;
  data: Transaction[];
}> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const res = await getTransactionsDB(hubId, {
      id: true,
      date: true,
      recipient: true,
      type: true,
      category: true,
      note: true,
      amount: true,
      accountId: true,
      destinationAccountId: true,
      recurringTemplateId: true,
    });

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message ?? "Failed to fetch data",
        data: [],
      };
    }

    const transactions = res.data.map((tx: any) => ({
      id: tx.id,
      date: tx.date ? new Date(tx.date).toLocaleDateString("en-GB") : null,
      recipient: tx.recipient || null,
      type: tx.type,
      category: tx.category || null,
      note: tx.note ?? null,
      amount: tx.amount ?? 0,
      accountId: tx.accountId || null,
      destinationAccountId: tx.destinationAccountId || null,
      recurringTemplateId: tx.recurringTemplateId || null,
      isRecurring: !!tx.recurringTemplateId,
    }));

    return { success: true, data: transactions as Transaction[] };
  } catch (err: any) {
    console.error("Error in getTransactionsTable:", err);
    return {
      success: false,
      message: err.message || "Failed to load transactions table data",
      data: [],
    };
  }
}

// GET Recent Transactions
export async function getRecentTransactions() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const res = await getTransactionsDB(
      hubId,
      {
        id: true,
        date: true,
        recipient: true,
        category: true,
        note: true,
        amount: true,
      },
      4,
    );

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || "Failed to fetch recent transactions",
      };
    }

    const transactions = res.data.map((tx: any) => ({
      id: tx.id,
      date: tx.date ? new Date(tx.date).toLocaleDateString("en-GB") : "—",
      recipient: tx.recipient || "—",
      category: tx.category || "—",
      note: tx.note ?? null,
      amount: tx.amount ?? 0,
    }));

    return { success: true, data: transactions };
  } catch (err: any) {
    console.error("Server action error in getRecentTransactions:", err);
    return {
      success: false,
      message: err?.message || "Unexpected server error.",
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
): Promise<{
  success: boolean;
  data?: UpcomingRecurringTransaction[];
  message?: string;
}> {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    const templates = await getRecurringTransactionTemplatesDB(hubId);

    const today = startOfDay(new Date());
    const nextDays = addDays(today, days);
    const upcomingTransactions: UpcomingRecurringTransaction[] = [];

    for (const template of templates) {
      const startDate = startOfDay(new Date(template.startDate));
      let currentDate = startDate;

      // If start date is in the past, calculate next occurrence
      if (isBefore(startDate, today)) {
        // Calculate next occurrence after today
        const daysSinceStart = Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const occurrencesSinceStart = Math.floor(
          daysSinceStart / template.frequencyDays,
        );
        currentDate = startOfDay(
          addDays(startDate, (occurrencesSinceStart + 1) * template.frequencyDays),
        );
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
    frequencyDays?: number;
    startDate?: Date;
    endDate?: Date | null;
    status?: "active" | "inactive";
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
) {
  try {
    const hdrs = await headers();
    const { hubId, userRole, financialAccountId } = await getContext(
      hdrs,
      true,
    );

    requireAdminRole(userRole);

    if (!financialAccountId) {
      return {
        success: false,
        message: "No financial account found in context",
      };
    }

    const source = formData.get("source")?.toString().trim() || "";
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const note = formData.get("note")?.toString() || null;
    const addedAtStr = formData.get("addedAt")?.toString() || "";
    const addedAt = addedAtStr ? new Date(addedAtStr) : new Date();
    const transactionType = formData.get("transactionType")?.toString() as TransactionType | undefined;
    const destinationAccountId = formData.get("destinationAccountId")?.toString() || null;

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

    const res = await updateTransactionDB({
      hubId,
      transactionId,
      updatedData: {
        source,
        amount,
        note,
        addedAt,
        financialAccountId,
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

    revalidatePath("/dashboard/transactions");

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
export async function deleteTransaction(transactionId: string) {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, true);

    requireAdminRole(userRole);

    const res = await deleteTransactionDB({ hubId, transactionId });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to delete transaction.",
      };
    }

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
    const { hubId, userRole } = await getContext(hdrs, true);

    requireAdminRole(userRole);

    if (!transactionIds || transactionIds.length === 0) {
      return {
        success: false,
        message: "No transactions selected for deletion.",
      };
    }

    const res = await deleteTransactionsDB({ hubId, transactionIds });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to delete transactions.",
      };
    }

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
    const { hubId, userRole } = await getContext(hdrs, true);

    requireAdminRole(userRole);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await deleteAllTransactionsDB(hubId);

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Failed to delete all transactions.",
      };
    }

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

// DELETE ALL Transactions and related Categories [Action]
export async function deleteAllTransactionsAndCategories() {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, true);

    requireAdminRole(userRole);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    const res = await deleteAllTransactionsAndCategoriesDB(hubId);

    if (!res.success) {
      return {
        success: false,
        message:
          res.message || "Failed to delete all transactions and categories.",
      };
    }

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
