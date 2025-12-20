import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { transactions, transactionCategories, budgets, budgetInstances } from "../src/db/schema";
import { eq, and, gte, lte, or, sql } from "drizzle-orm";
import * as fs from "fs";

const TARGET_HUB_ID = "bc29a94e-e14c-498b-9bcd-173b8a38011d";
const YEAR = 2025;
const MONTH = 12;

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        const startDate = new Date(Date.UTC(YEAR, MONTH - 1, 1));
        const endDate = new Date(Date.UTC(YEAR, MONTH, 0, 23, 59, 59, 999));

        log(`--- Expense Audit for Hub: ${TARGET_HUB_ID} ---`);
        log(`Period: ${MONTH}/${YEAR} (${startDate.toDateString()} - ${endDate.toDateString()})`);
        log("--------------------------------------------------\n");

        // 1. Fetch All Budgets for this Month/Year
        const allBudgets = await db
            .select({
                id: budgets.id,
                catId: budgets.transactionCategoryId,
                catName: transactionCategories.name,
                allocated: sql<number>`COALESCE(${budgetInstances.allocatedAmount}, ${budgets.allocatedAmount})`,
                ist: budgets.spentAmount,
            })
            .from(budgets)
            .innerJoin(transactionCategories, eq(budgets.transactionCategoryId, transactionCategories.id))
            .leftJoin(budgetInstances, and(
                eq(budgetInstances.budgetId, budgets.id),
                eq(budgetInstances.month, MONTH),
                eq(budgetInstances.year, YEAR)
            ))
            .where(eq(budgets.hubId, TARGET_HUB_ID));

        const budgetCategoryIds = new Set(allBudgets.map(b => b.catId));

        // 2. Fetch All Transactions for this hub/period
        const rawTransactions = await db
            .select({
                id: transactions.id,
                amount: transactions.amount,
                type: transactions.type,
                createdAt: transactions.createdAt,
                catId: transactions.transactionCategoryId,
                catName: transactionCategories.name,
            })
            .from(transactions)
            .leftJoin(transactionCategories, eq(transactions.transactionCategoryId, transactionCategories.id))
            .where(and(
                eq(transactions.hubId, TARGET_HUB_ID),
                gte(transactions.createdAt, startDate),
                lte(transactions.createdAt, endDate)
            ));

        const expenses = rawTransactions.filter(t => t.type === 'expense');
        const incomes = rawTransactions.filter(t => t.type === 'income');
        const transfers = rawTransactions.filter(t => t.type === 'transfer');

        log(`Found ${expenses.length} Expenses, ${incomes.length} Incomes, ${transfers.length} Transfers.\n`);

        // --- Logic A: The Bar Chart (Gross Expenses) ---
        const totalGrossExpenses = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
        log(`[CHART LOGIC] Total Gross Expenses: CHF ${totalGrossExpenses.toFixed(2)}`);

        // --- Logic B: The Budget Card (Net Categorized Expenses + IST) ---
        let categorizedWithBudgetTotal = 0;
        let categorizedNoBudgetTotal = 0;
        let uncategorizedTotal = 0;
        let istTotal = allBudgets.reduce((acc, b) => acc + Number(b.ist || 0), 0);

        log("\n--- Breakdown ---");

        // Group expenses by category
        const expenseByCat: any = {};
        expenses.forEach(t => {
            const catId = t.catId || "none";
            const catName = t.catName || "Uncategorized";
            if (!expenseByCat[catId]) expenseByCat[catId] = { name: catName, amount: 0, hasBudget: budgetCategoryIds.has(catId) };
            expenseByCat[catId].amount += Number(t.amount);
        });

        // Group incomes by category (to see net)
        const incomeByCat: any = {};
        incomes.forEach(t => {
            const catId = t.catId || "none";
            if (!incomeByCat[catId]) incomeByCat[catId] = 0;
            incomeByCat[catId] += Number(t.amount);
        });

        Object.keys(expenseByCat).forEach(catId => {
            const item = expenseByCat[catId];
            const netAmount = Math.max(item.amount - (incomeByCat[catId] || 0), 0);

            if (catId === "none") {
                log(`- [Uncategorized] Gross: ${item.amount.toFixed(2)}, Net: ${netAmount.toFixed(2)}`);
                uncategorizedTotal += netAmount;
            } else if (item.hasBudget) {
                log(`- [Has Budget] ${item.name}: Gross: ${item.amount.toFixed(2)}, Net: ${netAmount.toFixed(2)}`);
                categorizedWithBudgetTotal += netAmount;
            } else {
                log(`- [No Budget]  ${item.name}: Gross: ${item.amount.toFixed(2)}, Net: ${netAmount.toFixed(2)}`);
                categorizedNoBudgetTotal += netAmount;
            }
        });

        const cardTotal = categorizedWithBudgetTotal + istTotal;

        log("\n--- Comparison Summary ---");
        log(`Bar Chart (Gross Total):             CHF ${totalGrossExpenses.toFixed(2)}`);
        log(`Budget Card (Net Budgeted + IST):    CHF ${cardTotal.toFixed(2)}`);
        log(`--------------------------------------------------`);
        log(`Difference (Discrepancy):            CHF ${(totalGrossExpenses - cardTotal).toFixed(2)}`);

        log("\nWhere is the difference? (Explanation of the gap)");
        log(`1. Uncategorized Expenses (ignored by Card): CHF ${uncategorizedTotal.toFixed(2)}`);
        log(`2. Categorized but No Budget (ignored by Card): CHF ${categorizedNoBudgetTotal.toFixed(2)}`);
        log(`3. Netting Effect (Chart shows 100%, Card subtracts refunds): CHF ${(totalGrossExpenses - (categorizedWithBudgetTotal + categorizedNoBudgetTotal + uncategorizedTotal)).toFixed(2)}`);
        log(`4. Managed IST (Card adds IST buffer, Chart doesn't): -CHF ${istTotal.toFixed(2)}`);

        fs.writeFileSync("audit_results.txt", logs.join("\n"), "utf8");
        log("\nResults written to audit_results.txt");

    } catch (err) {
        log(`Script error: ${err}`);
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
