"use server";

import db from "@/db/db";
import {
    transactions,
    transactionCategories,
    financialAccounts,
    budgets,
    budgetInstances,
    savingGoals,
} from "@/db/schema";
import { eq, and, inArray, sql, gte, lte } from "drizzle-orm";
import { getContext } from "../auth/actions";
import { headers } from "next/headers";
import { requireAdminRole } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import type { ImportType, ImportMode, ValidationReport, FullJsonValidationReport } from "./import-export-types";

/**
 * Import Service
 * Handles bulk data processing for transactions, budgets, accounts, and saving goals.
 * Supports "Append" and "Replace" modes.
 */

// --- KEY MAPPING HELPERS ---

const KEY_MAPPINGS = {
    transactions: {
        date: ["date", "datum", "data", "échéance"],
        amount: ["amount", "amount(chf)", "betrag", "betrag(chf)", "importo", "importo(chf)", "montant", "montant(chf)"],
        category: ["category", "kategorie", "kategorien", "categoria", "catégorie", "catégories", "group", "genre"],
        account: ["account", "konto", "conto", "compte"],
        type: ["type", "typ", "tipo"],
        source: ["source", "recipient", "quelle", "empfänger", "destinatario", "bénéficiaire"],
        note: ["note", "notiz", "nota", "remarque"],
    },
    budgets: {
        category: ["category", "kategorie", "kategorien", "categoria", "catégorie", "catégories", "group", "genre"],
        amount: ["allocated", "allocatedamount", "budget", "importo", "montant", "budget(chf)", "importo(chf)", "montant(chf)"],
        spent: ["spent", "spentamount", "ist", "effettivo", "réel", "actual", "effettivo(chf)", "réel(chf)", "ist(chf)", "spent(chf)"],
        month: ["month", "monat", "mese", "mois"],
        year: ["year", "jahr", "anno", "année"],
        warning: ["warningpercentage", "warning", "avviso", "alerte", "warningat(%)", "alerteà(%)", "warnungbei(%)", "avvisoa(%)"],
        color: ["markercolor", "color", "indicatore", "marqueur", "colormarker", "farbmarker", "indicatorecolore", "marqueurdecouleur"],
    },
    accounts: {
        name: ["name", "accountname", "konto", "conto", "compte"],
        balance: ["balance", "initialbalance", "initialbalance(chf)", "kontostand", "saldo", "startingbalance(chf)", "startsaldo(chf)", "saldoiniziale(chf)", "soldeinitial(chf)", "initial(chf)"],
        type: ["type", "typ", "tipo"],
        iban: ["iban", "iban/note", "iban/notiz", "iban/nota", "iban/remarque"],
        note: ["note", "notiz", "nota", "remarque", "iban/note", "iban/notiz", "iban/nota", "iban/remarque"],
    },
    savingGoals: {
        name: ["name", "nom", "nome", "label", "titel"],
        account: ["account", "konto", "conto", "compte"],
        goal: ["goalamount", "goal", "target", "targetamount", "betrag", "importo", "montant", "ziel", "obiettivo", "targetamount(chf)", "zielbetrag(chf)", "importoobiettivo(chf)", "montantcible(chf)", "goal(chf)", "target(chf)"],
        saved: ["amountsaved", "saved", "gespart", "risparmiato", "épargné", "alreadysaved(chf)", "bereitsgespart(chf)", "giàrisparmiato(chf)", "déjàéconomisé(chf)", "saved(chf)"],
        allocation: ["monthlyallocation", "monthlyallocated", "rate", "assegnazione", "allocation", "monthlyallocation(chf)", "monatlichezuweisung(chf)", "assegnazionemensile(chf)", "allocationmensuelle(chf)", "monthly(chf)"],
        dueDate: ["duedate", "due_date", "datum", "data", "échéance", "due"],
    },
    transfers: {
        date: ["date", "datum", "data", "échéance"],
        from: ["from", "von", "da", "de"],
        to: ["to", "an", "a", "à"],
        amount: ["amount", "amount(chf)", "betrag", "betrag(chf)", "importo", "importo(chf)", "montant", "montant(chf)"],
        note: ["note", "notiz", "nota", "remarque"],
    },
};

function getMappedValue(item: any, mappings: string[]) {
    for (const key of mappings) {
        if (item[key] !== undefined && item[key] !== null) {
            return item[key];
        }
    }
    return undefined;
}

// --- CATEGORY HELPERS ---

async function getOrCreateCategory(hubId: string, categoryName: string | null) {
    if (!categoryName || categoryName === "—" || categoryName === "Uncategorized") {
        return null;
    }

    // Find existing
    const existing = await db.query.transactionCategories.findFirst({
        where: (tc) => and(eq(tc.hubId, hubId), eq(tc.name, categoryName)),
    });

    if (existing) return existing.id;

    // Create new
    const [newCat] = await db
        .insert(transactionCategories)
        .values({ hubId, name: categoryName })
        .returning({ id: transactionCategories.id });

    return newCat.id;
}

// --- ACCOUNT HELPERS ---

async function getAccountIdByName(hubId: string, accountName: string | null) {
    if (!accountName || accountName === "—") return null;

    const existing = await db.query.financialAccounts.findFirst({
        where: (fa) => and(eq(fa.hubId, hubId), eq(fa.name, accountName)),
    });

    return existing?.id ?? null;
}

async function getOrCreateAccount(tx: any, hubId: string, userId: string, accountName: string) {
    if (!accountName || accountName === "—") return null;

    // Check in DB (using tx to see uncommitted changes in same transaction)
    const existing = await tx.query.financialAccounts.findFirst({
        where: (fa: any) => and(eq(fa.hubId, hubId), eq(fa.name, accountName)),
    });

    if (existing) return existing.id;

    const [newAccount] = await tx.insert(financialAccounts).values({
        hubId,
        userId,
        name: accountName,
        type: "cash", // Default to cash
        initialBalance: 0,
    }).returning({ id: financialAccounts.id });

    return newAccount.id;
}

// --- NORMALIZATION HELPER ---

function normalizeItem(item: any) {
    const normalized: any = {};
    for (const key in item) {
        normalized[key.toLowerCase().replace(/\s/g, "")] = item[key];
    }
    return normalized;
}

/**
 * Normalizes date strings to proper Date objects
 * Handles formats: DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY (ISO fallback)
 */
function normalizeDate(dateStr: string | Date | null | undefined): Date | null {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;

    const str = String(dateStr).trim();

    // Try DD/MM/YYYY or DD.MM.YYYY format first (common European format)
    const euroMatch = str.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/);
    if (euroMatch) {
        const [, day, month, year] = euroMatch;
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        if (!isNaN(date.getTime())) return date;
    }

    // Try YYYY-MM-DD (ISO format)
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        if (!isNaN(date.getTime())) return date;
    }

    // Fallback to native parsing (handles ISO strings with time, etc.)
    const fallback = new Date(str);
    if (!isNaN(fallback.getTime())) return fallback;

    return null;
}

// --- BULK IMPORTERS ---

export async function importTransactions(
    hubId: string,
    userId: string,
    data: any[],
    mode: "append" | "replace",
    autoCreateAccounts: boolean = false,
    skipDuplicates: boolean = false
) {
    return await db.transaction(async (tx) => {
        if (mode === "replace") {
            await tx.delete(transactions).where(eq(transactions.hubId, hubId));
        }

        let existingTransactions: any[] = [];
        if (skipDuplicates && data.length > 0) {
            const dateValues = data.map(d => {
                const item = normalizeItem(d);
                const date = normalizeDate(item.date || item.datum || item.data);
                return date ? date.getTime() : NaN;
            }).filter(d => !isNaN(d));
            if (dateValues.length > 0) {
                const firstDate = new Date(Math.min(...dateValues));
                firstDate.setHours(0, 0, 0, 0); // Start of day
                const lastDate = new Date(Math.max(...dateValues));
                lastDate.setHours(23, 59, 59, 999); // End of day

                existingTransactions = await tx.query.transactions.findMany({
                    where: (t: any) => and(
                        eq(t.hubId, hubId),
                        gte(t.createdAt, firstDate),
                        lte(t.createdAt, lastDate)
                    ),
                });
            }
        }

        let insertedCount = 0;
        let skippedCount = 0;
        const createdAccountsMap = new Map<string, string>(); // name -> id cache

        for (let item of data) {
            item = normalizeItem(item);

            const amount = Number(getMappedValue(item, KEY_MAPPINGS.transactions.amount) ?? 0);
            const dateStr = getMappedValue(item, KEY_MAPPINGS.transactions.date);
            const parsedDate = normalizeDate(dateStr);
            const source = (getMappedValue(item, KEY_MAPPINGS.transactions.source) || "").trim();
            const note = (getMappedValue(item, KEY_MAPPINGS.transactions.note) || "").trim();

            if (skipDuplicates) {
                const itemDate = parsedDate ? parsedDate.toISOString().split('T')[0] : '';
                const itemSource = source.toLowerCase();
                const itemNote = note.toLowerCase();

                const isDuplicate = existingTransactions.some(et => {
                    const etAmount = et.amount;
                    const etDate = et.createdAt.toISOString().split('T')[0];
                    const etSource = (et.source || "").trim().toLowerCase();
                    const etNote = (et.note || "").trim().toLowerCase();
                    return etAmount === amount && etDate === itemDate && etSource === itemSource && etNote === itemNote;
                });

                if (isDuplicate) {
                    skippedCount++;
                    continue;
                }
            }

            const catName = (getMappedValue(item, KEY_MAPPINGS.transactions.category) || "").trim();
            const categoryId = await getOrCreateCategory(hubId, catName);
            const accountName = (getMappedValue(item, KEY_MAPPINGS.transactions.account) || "").trim();
            let accountId = null;

            if (accountName) {
                // Check if we already created it in this batch
                if (createdAccountsMap.has(accountName.toLowerCase())) {
                    accountId = createdAccountsMap.get(accountName.toLowerCase());
                } else {
                    // Check DB or Create
                    accountId = await getOrCreateAccount(tx, hubId, userId, accountName);
                    if (accountId) {
                        createdAccountsMap.set(accountName.toLowerCase(), accountId);
                    }
                }
            }

            if (!accountId) {
                // Fallback: use first account if not specified or found
                const firstAccount = await tx.query.financialAccounts.findFirst({
                    where: (fa) => eq(fa.hubId, hubId),
                });
                if (!firstAccount) continue; // Skip if no accounts exist at all
                accountId = firstAccount.id;
            }

            await tx.insert(transactions).values({
                hubId,
                userId,
                financialAccountId: accountId,
                transactionCategoryId: categoryId,
                amount: amount,
                type: (getMappedValue(item, KEY_MAPPINGS.transactions.type) || "expense") as any,
                source: source || null,
                note: note || null,
                createdAt: parsedDate || new Date(),
            });
            insertedCount++;
        }

        return { success: true, count: insertedCount, skipped: skippedCount };
    });
}

export async function importBudgets(
    hubId: string,
    userId: string,
    data: any[],
    mode: "append" | "replace"
) {
    const now = new Date();
    const defaultMonth = now.getMonth() + 1;
    const defaultYear = now.getFullYear();

    return await db.transaction(async (tx) => {
        if (mode === "replace") {
            // Deleting budgets also deletes instances due to cascade
            await tx.delete(budgets).where(eq(budgets.hubId, hubId));
        }

        let processedCount = 0;

        for (let item of data) {
            item = normalizeItem(item);
            const categoryName = (getMappedValue(item, KEY_MAPPINGS.budgets.category) || "").trim();
            const categoryId = await getOrCreateCategory(hubId, categoryName);
            if (!categoryId) continue;

            const month = Number(getMappedValue(item, KEY_MAPPINGS.budgets.month) || defaultMonth);
            const year = Number(getMappedValue(item, KEY_MAPPINGS.budgets.year) || defaultYear);
            const amount = Number(getMappedValue(item, KEY_MAPPINGS.budgets.amount) || 0);
            const spentAmount = Number(getMappedValue(item, KEY_MAPPINGS.budgets.spent) || 0);
            const warningPercentage = Number(getMappedValue(item, KEY_MAPPINGS.budgets.warning) || 80);
            const markerColor = (getMappedValue(item, KEY_MAPPINGS.budgets.color) || "").trim();

            // 1. Find or Create Budget (the definition)
            const existingBudgets = await tx.select().from(budgets).where(and(eq(budgets.hubId, hubId), eq(budgets.transactionCategoryId, categoryId))).limit(1);
            const existingBudget = existingBudgets[0];

            let budgetId = existingBudget?.id;

            if (!existingBudget) {
                const [newBudget] = await tx
                    .insert(budgets)
                    .values({
                        hubId,
                        userId,
                        transactionCategoryId: categoryId,
                        allocatedAmount: amount,
                        spentAmount: spentAmount,
                        warningPercentage,
                        markerColor,
                    })
                    .returning({ id: budgets.id });
                budgetId = newBudget.id;
            } else if (mode === "append") {
                // In append mode, we update the master definition if it changed
                await tx.update(budgets)
                    .set({ allocatedAmount: amount, spentAmount: spentAmount, warningPercentage, markerColor })
                    .where(eq(budgets.id, existingBudget.id));
            }

            // 2. Create or update instance for specific month/year
            const existingInstances = await tx.select().from(budgetInstances).where(
                and(
                    eq(budgetInstances.budgetId, budgetId!),
                    eq(budgetInstances.month, month),
                    eq(budgetInstances.year, year)
                )
            ).limit(1);
            const existingInstance = existingInstances[0];

            if (!existingInstance) {
                await tx.insert(budgetInstances).values({
                    budgetId: budgetId!,
                    month,
                    year,
                    allocatedAmount: amount,
                });
            } else {
                // Upsert behavior for instances: update amount if it exists
                await tx.update(budgetInstances)
                    .set({ allocatedAmount: amount })
                    .where(eq(budgetInstances.id, existingInstance.id));
            }
            processedCount++;
        }

        return { success: true, count: processedCount };
    });
}

export async function importTransfers(
    hubId: string,
    userId: string,
    data: any[],
    mode: "append" | "replace",
    autoCreateAccounts: boolean = false
) {
    return await db.transaction(async (tx) => {
        if (mode === "replace") {
            await tx.delete(transactions).where(and(eq(transactions.hubId, hubId), eq(transactions.type, "transfer")));
        }

        let insertedCount = 0;
        const createdAccountsMap = new Map<string, string>();

        for (let item of data) {
            item = normalizeItem(item);
            const date = normalizeDate(getMappedValue(item, KEY_MAPPINGS.transfers.date)) || new Date();
            const fromAccountName = (getMappedValue(item, KEY_MAPPINGS.transfers.from) || "").trim();
            const toAccountName = (getMappedValue(item, KEY_MAPPINGS.transfers.to) || "").trim();
            const amount = Math.abs(Number(getMappedValue(item, KEY_MAPPINGS.transfers.amount) || 0));
            const note = getMappedValue(item, KEY_MAPPINGS.transfers.note) || null;

            if (!fromAccountName || !toAccountName || isNaN(amount) || !date) continue;

            // Get From Account
            let fromAccountId = null;
            if (createdAccountsMap.has(fromAccountName.toLowerCase())) {
                fromAccountId = createdAccountsMap.get(fromAccountName.toLowerCase());
            } else {
                fromAccountId = await getOrCreateAccount(tx, hubId, userId, fromAccountName);
                if (fromAccountId) createdAccountsMap.set(fromAccountName.toLowerCase(), fromAccountId);
            }

            // Get To Account
            let toAccountId = null;
            if (createdAccountsMap.has(toAccountName.toLowerCase())) {
                toAccountId = createdAccountsMap.get(toAccountName.toLowerCase());
            } else {
                toAccountId = await getOrCreateAccount(tx, hubId, userId, toAccountName);
                if (toAccountId) createdAccountsMap.set(toAccountName.toLowerCase(), toAccountId);
            }

            if (!fromAccountId || !toAccountId) continue;

            await tx.insert(transactions).values({
                hubId,
                userId,
                financialAccountId: fromAccountId,
                destinationAccountId: toAccountId,
                type: "transfer",
                amount: amount,
                note: note,
                createdAt: date,
            });
            insertedCount++;
        }

        return { success: true, count: insertedCount };
    });
}

export async function importAccounts(
    hubId: string,
    userId: string,
    data: any[],
    mode: "append" | "replace"
) {
    return await db.transaction(async (tx) => {
        if (mode === "replace") {
            await tx.delete(financialAccounts).where(eq(financialAccounts.hubId, hubId));
        }

        let processedCount = 0;

        for (let item of data) {
            item = normalizeItem(item);
            const accountName = (getMappedValue(item, KEY_MAPPINGS.accounts.name) || "").trim();
            if (!accountName) continue;

            const initialBalance = Number(getMappedValue(item, KEY_MAPPINGS.accounts.balance) || 0);
            const accountType = (getMappedValue(item, KEY_MAPPINGS.accounts.type) || "checking") as any;
            const iban = getMappedValue(item, KEY_MAPPINGS.accounts.iban) || null;
            const note = getMappedValue(item, KEY_MAPPINGS.accounts.note) || null;

            if (mode === "append") {
                const existing = await tx.query.financialAccounts.findFirst({
                    where: (fa: any) => and(eq(fa.hubId, hubId), eq(fa.name, accountName)),
                });

                if (existing) {
                    await tx.update(financialAccounts)
                        .set({
                            type: accountType,
                            initialBalance,
                            iban: iban || existing.iban,
                            note: note || existing.note,
                        })
                        .where(eq(financialAccounts.id, existing.id));
                    processedCount++;
                    continue;
                }
            }

            await tx.insert(financialAccounts).values({
                hubId,
                userId,
                name: accountName,
                type: accountType,
                initialBalance,
                iban,
                note,
            });
            processedCount++;
        }

        return { success: true, count: processedCount };
    });
}

export async function importSavingGoals(
    hubId: string,
    userId: string,
    data: any[],
    mode: "append" | "replace",
    autoCreateAccounts: boolean = false
) {
    return await db.transaction(async (tx) => {
        if (mode === "replace") {
            await tx.delete(savingGoals).where(eq(savingGoals.hubId, hubId));
        }

        let processedCount = 0;

        for (let item of data) {
            item = normalizeItem(item);
            const goalName = (getMappedValue(item, KEY_MAPPINGS.savingGoals.name) || "").trim();
            if (!goalName) continue;

            const accountName = (getMappedValue(item, KEY_MAPPINGS.savingGoals.account) || "").trim();
            let accountId = null;
            if (accountName) {
                if (autoCreateAccounts) {
                    accountId = await getOrCreateAccount(tx, hubId, userId, accountName);
                } else {
                    accountId = await getAccountIdByName(hubId, accountName);
                }
            }

            const goalAmount = Number(getMappedValue(item, KEY_MAPPINGS.savingGoals.goal) || 0);
            const amountSaved = Number(getMappedValue(item, KEY_MAPPINGS.savingGoals.saved) || 0);
            const monthlyAllocation = Number(getMappedValue(item, KEY_MAPPINGS.savingGoals.allocation) || 0);
            const dueDateStr = getMappedValue(item, KEY_MAPPINGS.savingGoals.dueDate);
            const dueDate = normalizeDate(dueDateStr);

            if (mode === "append") {
                const existing = await tx.query.savingGoals.findFirst({
                    where: (sg: any) => and(eq(sg.hubId, hubId), eq(sg.name, goalName)),
                });

                if (existing) {
                    await tx.update(savingGoals)
                        .set({
                            goalAmount,
                            amountSaved,
                            monthlyAllocation,
                            financialAccountId: accountId || existing.financialAccountId,
                            dueDate: dueDate || existing.dueDate,
                        })
                        .where(eq(savingGoals.id, existing.id));
                    processedCount++;
                    continue;
                }
            }

            await tx.insert(savingGoals).values({
                hubId,
                userId,
                name: goalName,
                goalAmount,
                amountSaved,
                monthlyAllocation,
                financialAccountId: accountId,
                dueDate: (dueDate && !isNaN(dueDate.getTime())) ? dueDate : null,
            });
            processedCount++;
        }

        return { success: true, count: processedCount };
    });
}

// --- FULL EXPORT IMPORT ---

async function importFullExport(
    hubId: string,
    userId: string,
    rawData: any,
    mode: ImportMode
) {
    // Handle case where data is wrapped in an array (from JSON parsing)
    let data = Array.isArray(rawData) ? rawData[0] : rawData;

    // If data has a 'data' property (standardized format), use that
    if (data && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        data = data.data;
    }

    // Data is expected to be an object with keys: transactions, budgets, accounts, saving-goals/goals, transfers
    // Import order matters: accounts first, then budgets (which create categories), then transactions/goals/transfers
    let totalCount = 0;
    const results: Record<string, number> = {};

    // 1. Import Accounts first (other things depend on them)
    if (data.accounts && Array.isArray(data.accounts)) {
        const res = await importAccounts(hubId, userId, data.accounts, mode);
        totalCount += res.count;
        results.accounts = res.count;
    }

    // 2. Import Budgets (will create categories if needed)
    if (data.budgets && Array.isArray(data.budgets)) {
        const res = await importBudgets(hubId, userId, data.budgets, mode);
        totalCount += res.count;
        results.budgets = res.count;
    }

    // 3. Import Transactions (depends on accounts and categories)
    if (data.transactions && Array.isArray(data.transactions)) {
        const res = await importTransactions(hubId, userId, data.transactions, mode, true); // autoCreateAccounts = true
        totalCount += res.count;
        results.transactions = res.count;
    }

    // 4. Import Saving Goals (depends on accounts)
    const goalsData = data["saving-goals"] || data.goals || data.savingGoals;
    if (goalsData && Array.isArray(goalsData)) {
        const res = await importSavingGoals(hubId, userId, goalsData, mode, true); // autoCreateAccounts = true
        totalCount += res.count;
        results.savingGoals = res.count;
    }

    // 5. Import Transfers (depends on accounts)
    if (data.transfers && Array.isArray(data.transfers)) {
        const res = await importTransfers(hubId, userId, data.transfers, mode, true); // autoCreateAccounts = true
        totalCount += res.count;
        results.transfers = res.count;
    }

    return { success: true, count: totalCount, details: results };
}

/**
 * Validates Full JSON data before import
 * Returns a summary of what will be imported
 */
export async function validateFullJsonAction(
    data: any,
    hubIdArg?: string
): Promise<FullJsonValidationReport> {
    const hdrs = await headers();
    const { userRole, hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;
    if (!hubId) throw new Error("Hub ID is required");
    requireAdminRole(userRole);

    const report: FullJsonValidationReport = {
        accounts: { count: 0, valid: false },
        budgets: { count: 0, valid: false },
        transactions: { count: 0, valid: false },
        savingGoals: { count: 0, valid: false },
        transfers: { count: 0, valid: false },
        totalItems: 0,
        version: data.version,
        exportedAt: data.exportedAt,
    };

    // Validate accounts
    if (data.accounts && Array.isArray(data.accounts)) {
        report.accounts.count = data.accounts.length;
        report.accounts.valid = data.accounts.every((a: any) => a.name && typeof a.name === "string");
    }

    // Validate budgets
    if (data.budgets && Array.isArray(data.budgets)) {
        report.budgets.count = data.budgets.length;
        report.budgets.valid = data.budgets.every((b: any) => b.category && typeof b.category === "string");
    }

    // Validate transactions
    if (data.transactions && Array.isArray(data.transactions)) {
        report.transactions.count = data.transactions.length;
        report.transactions.valid = data.transactions.every((t: any) => {
            const item = normalizeItem(t);
            const dateStr = getMappedValue(item, KEY_MAPPINGS.transactions.date);
            const amount = getMappedValue(item, KEY_MAPPINGS.transactions.amount);
            const hasDate = dateStr && !isNaN(Date.parse(dateStr));
            const hasAmount = amount !== undefined && !isNaN(Number(amount));
            return hasDate && hasAmount;
        });
    }

    // Validate saving goals (check both keys for backwards compatibility)
    const goalsData = data["saving-goals"] || data.goals || data.savingGoals;
    if (goalsData && Array.isArray(goalsData)) {
        report.savingGoals.count = goalsData.length;
        report.savingGoals.valid = goalsData.every((g: any) => {
            const item = normalizeItem(g);
            const name = getMappedValue(item, KEY_MAPPINGS.savingGoals.name);
            return name && typeof name === "string";
        });
    }

    // Validate transfers
    if (data.transfers && Array.isArray(data.transfers)) {
        report.transfers.count = data.transfers.length;
        report.transfers.valid = data.transfers.every((t: any) => {
            const item = normalizeItem(t);
            const dateStr = getMappedValue(item, KEY_MAPPINGS.transfers.date);
            const from = getMappedValue(item, KEY_MAPPINGS.transfers.from);
            const to = getMappedValue(item, KEY_MAPPINGS.transfers.to);
            const amount = getMappedValue(item, KEY_MAPPINGS.transfers.amount);
            const hasDate = dateStr && !isNaN(Date.parse(dateStr));
            const hasFrom = from && typeof from === "string";
            const hasTo = to && typeof to === "string";
            const hasAmount = amount !== undefined && !isNaN(Number(amount));
            return hasDate && hasFrom && hasTo && hasAmount;
        });
    }

    report.totalItems =
        report.accounts.count +
        report.budgets.count +
        report.transactions.count +
        report.savingGoals.count +
        report.transfers.count;

    return report;
}

/**
 * Validates transaction data before import
 */
export async function validateTransactionsAction(
    data: any[],
    hubIdArg?: string
): Promise<ValidationReport> {
    const hdrs = await headers();
    const { userId, userRole, hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;
    if (!hubId) throw new Error("Hub ID is required");
    requireAdminRole(userRole);

    const report: ValidationReport = {
        validRows: 0,
        invalidRows: 0,
        missingAccounts: [],
        newCategories: [],
        allCategories: [],
        potentialDuplicates: 0,
        totalRows: data.length,
    };

    if (data.length === 0) return report;

    // 1. Get existing accounts and categories
    const existingAccounts = await db.query.financialAccounts.findMany({
        where: (fa) => eq(fa.hubId, hubId),
    });
    const existingCategories = await db.query.transactionCategories.findMany({
        where: (tc) => eq(tc.hubId, hubId),
    });

    const accountNames = new Set(existingAccounts.map(a => a.name.toLowerCase()));
    const categoryNames = new Set(existingCategories.map(c => c.name.toLowerCase()));

    const missingAccountsSet = new Set<string>();
    const newCategoriesSet = new Set<string>();
    const allCategoriesSet = new Set<string>();

    for (let rawItem of data) {
        const item = normalizeItem(rawItem);

        // Validate Date and Amount
        const dateStr = getMappedValue(item, KEY_MAPPINGS.transactions.date);
        const amountStr = getMappedValue(item, KEY_MAPPINGS.transactions.amount);

        if (!dateStr || isNaN(Date.parse(dateStr)) || isNaN(Number(amountStr))) {
            report.invalidRows++;
            continue;
        }

        report.validRows++;

        // Track missing accounts
        const accountName = ((getMappedValue(item, KEY_MAPPINGS.transactions.account) || "") as string).trim();
        if (accountName && !accountNames.has(accountName.toLowerCase())) {
            missingAccountsSet.add(accountName);
        }

        // Track missing categories
        const categoryName = ((getMappedValue(item, KEY_MAPPINGS.transactions.category) || "") as string).trim();
        if (categoryName && categoryName !== "—" && categoryName !== "Uncategorized") {
            allCategoriesSet.add(categoryName);
            if (!categoryNames.has(categoryName.toLowerCase())) {
                newCategoriesSet.add(categoryName);
            }
        }
    }

    report.missingAccounts = Array.from(missingAccountsSet);
    report.newCategories = Array.from(newCategoriesSet);
    report.allCategories = Array.from(allCategoriesSet);

    // 3. Potential Duplicate Check
    const dateValues = data.map(d => {
        const item = normalizeItem(d);
        const date = normalizeDate(item.date || item.datum || item.data);
        return date ? date.getTime() : NaN;
    }).filter(d => !isNaN(d));

    if (dateValues.length > 0) {
        const firstDate = new Date(Math.min(...dateValues));
        firstDate.setHours(0, 0, 0, 0); // Start of day
        const lastDate = new Date(Math.max(...dateValues));
        lastDate.setHours(23, 59, 59, 999); // End of day

        const existingTransactions = await db.query.transactions.findMany({
            where: (t) => and(
                eq(t.hubId, hubId),
                gte(t.createdAt, firstDate),
                lte(t.createdAt, lastDate)
            ),
        });

        for (let rawItem of data) {
            const item = normalizeItem(rawItem);
            const itemAmount = Number(getMappedValue(item, KEY_MAPPINGS.transactions.amount) ?? 0);

            const parsedDate = normalizeDate(getMappedValue(item, KEY_MAPPINGS.transactions.date));
            const itemDate = parsedDate ? parsedDate.toISOString().split('T')[0] : '';
            if (!itemDate) continue; // Skip if date is invalid

            const itemSource = (getMappedValue(item, KEY_MAPPINGS.transactions.source) || "").trim().toLowerCase();
            const itemNote = (getMappedValue(item, KEY_MAPPINGS.transactions.note) || "").trim().toLowerCase();

            const isDuplicate = existingTransactions.some(et => {
                const etAmount = et.amount;
                const etDate = et.createdAt.toISOString().split('T')[0];
                const etSource = (et.source || "").trim().toLowerCase();
                const etNote = (et.note || "").trim().toLowerCase();
                return etAmount === itemAmount && etDate === itemDate && etSource === itemSource && etNote === itemNote;
            });

            if (isDuplicate) report.potentialDuplicates++;
        }
    }

    return report;
}

export async function validateBudgetsAction(
    data: any[],
    hubId?: string
): Promise<ValidationReport> {
    const report: ValidationReport = {
        validRows: 0,
        invalidRows: 0,
        missingAccounts: [],
        newCategories: [],
        allCategories: [],
        potentialDuplicates: 0,
        totalRows: data.length,
    };

    if (!hubId) return report;
    if (data.length === 0) return report;

    const existingCategories = await db.query.transactionCategories.findMany({
        where: (tc) => eq(tc.hubId, hubId),
    });
    const categoryNames = new Set(existingCategories.map(c => c.name.toLowerCase()));

    // For duplicate check
    const existingBudgetsWithInstances = await db
        .select({
            categoryName: transactionCategories.name,
            month: budgetInstances.month,
            year: budgetInstances.year,
        })
        .from(budgets)
        .innerJoin(transactionCategories, eq(budgets.transactionCategoryId, transactionCategories.id))
        .leftJoin(budgetInstances, eq(budgets.id, budgetInstances.budgetId))
        .where(eq(budgets.hubId, hubId));

    const newCategoriesSet = new Set<string>();
    const allCategoriesSet = new Set<string>();

    for (let rawItem of data) {
        const item = normalizeItem(rawItem);

        const categoryName = ((getMappedValue(item, KEY_MAPPINGS.budgets.category) || "") as string).trim();
        const amountStr = getMappedValue(item, KEY_MAPPINGS.budgets.amount);

        if (!categoryName || categoryName === "—" || isNaN(Number(amountStr))) {
            report.invalidRows++;
            continue;
        }

        report.validRows++;
        allCategoriesSet.add(categoryName);
        if (!categoryNames.has(categoryName.toLowerCase())) {
            newCategoriesSet.add(categoryName);
        }

        // Duplicate check (same category + month + year)
        const month = Number(getMappedValue(item, KEY_MAPPINGS.budgets.month) || (new Date().getMonth() + 1));
        const year = Number(getMappedValue(item, KEY_MAPPINGS.budgets.year) || (new Date().getFullYear()));

        const isDuplicate = existingBudgetsWithInstances.some(eb => {
            return (eb.categoryName?.toLowerCase() === categoryName.toLowerCase()) &&
                eb.month === month &&
                eb.year === year;
        });

        if (isDuplicate) report.potentialDuplicates++;
    }

    report.newCategories = Array.from(newCategoriesSet);
    report.allCategories = Array.from(allCategoriesSet);

    return report;
}

export async function validateSavingGoalsAction(
    data: any[],
    hubId?: string
): Promise<ValidationReport> {
    const report: ValidationReport = {
        validRows: 0,
        invalidRows: 0,
        missingAccounts: [],
        newCategories: [],
        allCategories: [],
        potentialDuplicates: 0,
        totalRows: data.length,
    };

    if (!hubId) return report;
    if (data.length === 0) return report;

    const existingAccounts = await db.query.financialAccounts.findMany({
        where: (fa) => eq(fa.hubId, hubId),
    });
    const accountNames = new Set(existingAccounts.map(a => a.name.toLowerCase()));

    const existingGoals = await db.query.savingGoals.findMany({
        where: (sg) => eq(sg.hubId, hubId),
    });
    const goalNames = new Set(existingGoals.map(g => g.name.toLowerCase()));

    const missingAccountsSet = new Set<string>();

    for (let rawItem of data) {
        const item = normalizeItem(rawItem);

        const goalName = (getMappedValue(item, KEY_MAPPINGS.savingGoals.name) || "").trim();
        const goalAmount = getMappedValue(item, KEY_MAPPINGS.savingGoals.goal);

        if (!goalName || isNaN(Number(goalAmount))) {
            report.invalidRows++;
            continue;
        }

        report.validRows++;

        const accountName = ((getMappedValue(item, KEY_MAPPINGS.savingGoals.account) || "") as string).trim();
        if (accountName && !accountNames.has(accountName.toLowerCase())) {
            missingAccountsSet.add(accountName);
        }

        if (goalNames.has(goalName.toLowerCase())) {
            report.potentialDuplicates++;
        }
    }

    return report;
}

export async function validateTransfersAction(
    data: any[],
    hubIdArg?: string
): Promise<ValidationReport> {
    const hdrs = await headers();
    const { userRole, hubId: sessionHubId } = await getContext(hdrs, false);
    const hubId = hubIdArg || sessionHubId;
    if (!hubId) throw new Error("Hub ID is required");
    requireAdminRole(userRole);

    const report: ValidationReport = {
        validRows: 0,
        invalidRows: 0,
        missingAccounts: [],
        newCategories: [],
        allCategories: [],
        potentialDuplicates: 0,
        totalRows: data.length,
    };

    if (data.length === 0) return report;

    const existingAccounts = await db.query.financialAccounts.findMany({
        where: (fa) => eq(fa.hubId, hubId),
    });
    const accountNames = new Set(existingAccounts.map(a => a.name.toLowerCase()));
    const missingAccountsSet = new Set<string>();

    for (let rawItem of data) {
        const item = normalizeItem(rawItem);

        const dateStr = getMappedValue(item, KEY_MAPPINGS.transfers.date);
        const parsedDate = normalizeDate(dateStr);
        const fromAccount = (getMappedValue(item, KEY_MAPPINGS.transfers.from) || "").trim();
        const toAccount = (getMappedValue(item, KEY_MAPPINGS.transfers.to) || "").trim();
        const amount = getMappedValue(item, KEY_MAPPINGS.transfers.amount);

        if (!dateStr || !parsedDate || !fromAccount || !toAccount || isNaN(Number(amount))) {
            report.invalidRows++;
            continue;
        }

        report.validRows++;

        if (fromAccount && !accountNames.has(fromAccount.toLowerCase())) {
            missingAccountsSet.add(fromAccount);
        }
        if (toAccount && !accountNames.has(toAccount.toLowerCase())) {
            missingAccountsSet.add(toAccount);
        }
    }

    report.missingAccounts = Array.from(missingAccountsSet);
    return report;
}

export async function validateAccountsAction(
    data: any[],
    hubId?: string
): Promise<ValidationReport> {
    const report: ValidationReport = {
        validRows: 0,
        invalidRows: 0,
        missingAccounts: [],
        newCategories: [],
        allCategories: [],
        potentialDuplicates: 0,
        totalRows: data.length,
    };

    if (!hubId) return report;
    if (data.length === 0) return report;

    const existingAccounts = await db.query.financialAccounts.findMany({
        where: (fa) => eq(fa.hubId, hubId),
    });
    const accountNames = new Set(existingAccounts.map(a => a.name.toLowerCase()));

    for (let rawItem of data) {
        const item = normalizeItem(rawItem);

        const accountName = (getMappedValue(item, KEY_MAPPINGS.accounts.name) || "").trim();
        const balance = getMappedValue(item, KEY_MAPPINGS.accounts.balance);

        if (!accountName || (balance !== undefined && isNaN(Number(balance)))) {
            report.invalidRows++;
            continue;
        }

        report.validRows++;

        if (accountNames.has(accountName.toLowerCase())) {
            report.potentialDuplicates++;
        }
    }

    return report;
}

// --- MAIN SERVER ACTION ---

export async function importDataAction(
    type: ImportType,
    mode: ImportMode,
    data: any[] | any,
    hubIdArg?: string,
    autoCreateAccounts?: boolean,
    skipDuplicates?: boolean
) {
    try {
        const hdrs = await headers();
        const { userId, hubId: sessionHubId, userRole } = await getContext(hdrs, false);
        const hubId = hubIdArg || sessionHubId;

        if (!hubId) throw new Error("Hub ID is required");

        requireAdminRole(userRole);

        let result;
        switch (type) {
            case "transactions":
                result = await importTransactions(hubId, userId, data, mode, autoCreateAccounts, skipDuplicates);
                break;
            case "budgets":
                result = await importBudgets(hubId, userId, data, mode);
                break;
            case "accounts":
                result = await importAccounts(hubId, userId, data, mode);
                break;
            case "transfers":
                result = await importTransfers(hubId, userId, data, mode, autoCreateAccounts);
                break;
            case "saving-goals":
                result = await importSavingGoals(hubId, userId, data, mode, autoCreateAccounts);
                break;
            case "full-export":
            case "full-json":
                result = await importFullExport(hubId, userId, data, mode);
                break;
            default:
                throw new Error("Unsupported import type");
        }

        revalidatePath("/me/dashboard");
        revalidatePath("/me/transactions");
        revalidatePath("/me/budgets");
        revalidatePath("/me/accounts");
        revalidatePath("/me/saving-goals");

        return { success: true, message: `Successfully imported ${result.count} items.`, data: result };
    } catch (err: any) {
        console.error("Import error:", err);
        return { success: false, message: err.message || "Failed to import data" };
    }
}
