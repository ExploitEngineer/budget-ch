import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import {
    financialAccounts,
    transactionCategories,
    transactions,
    budgets,
    budgetInstances,
} from "../src/db/schema";
import { eq, and } from "drizzle-orm";

const TARGET_EMAIL = "ahsan69999@gmail.com";
const TARGET_HUB_ID = "bc29a94e-e14c-498b-9bcd-173b8a38011d";

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    try {
        console.log("Starting mock data seeding...");
        console.log(`Target User: ${TARGET_EMAIL}`);
        console.log(`Target Hub: ${TARGET_HUB_ID}`);

        // 1. Verify User and Hub
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, TARGET_EMAIL),
        });

        if (!user) {
            throw new Error(`User ${TARGET_EMAIL} not found.`);
        }

        const hub = await db.query.hubs.findFirst({
            where: (h, { eq }) => eq(h.id, TARGET_HUB_ID),
        });

        if (!hub) {
            throw new Error(`Hub ${TARGET_HUB_ID} not found.`);
        }

        console.log("User and Hub verified.");

        // 2. Ensure Categories Exist
        const categories = [
            "Groceries Mock",
            "Dining Mock",
            "Transport Mock",
            "Salary Mock",
            "Rent Mock"
        ];

        const categoryIds: Record<string, string> = {};

        for (const name of categories) {
            // Check if exists
            let cat = await db.query.transactionCategories.findFirst({
                where: (c, { and, eq, sql }) =>
                    and(
                        eq(c.hubId, TARGET_HUB_ID),
                        sql`LOWER(${c.name}) = ${name.toLowerCase()}`
                    )
            });

            if (!cat) {
                console.log(`Creating category: ${name}`);
                const [newCat] = await db.insert(transactionCategories).values({
                    hubId: TARGET_HUB_ID,
                    name: name.toLowerCase(),
                    createdAt: new Date("2024-01-01T00:00:00Z"), // Old enough to be visible everywhere
                }).returning();
                cat = newCat;
            } else {
                // Update createdAt to be old enough if it's too new, just in case
                await db.update(transactionCategories)
                    .set({ createdAt: new Date("2024-01-01T00:00:00Z") })
                    .where(eq(transactionCategories.id, cat.id));
            }
            categoryIds[name] = cat.id;
        }

        // 3. Ensure Financial Account Exists
        let account = await db.query.financialAccounts.findFirst({
            where: (a, { eq }) => eq(a.hubId, TARGET_HUB_ID)
        });

        if (!account) {
            console.log("Creating mock checking account...");
            const [newAcc] = await db.insert(financialAccounts).values({
                hubId: TARGET_HUB_ID,
                userId: user.id,
                name: "Mock Checking",
                type: "checking",
                initialBalance: 10000,
                formattedBalance: "CHF 10'000.00", // Add dummy formatted balance
                balance: 10000, // Add balance field
                createdAt: new Date("2024-01-01T00:00:00Z"),
            } as any).returning(); // Cast as any if simple insert types are strict
            account = newAcc;
        }

        // 4. Create/Update Budgets (Templates)
        // We set createdAt to 2 months ago to verify "Ghost Budget" Logic (visible in last 2 months, not before)
        const budgetCreationDate = new Date();
        budgetCreationDate.setMonth(budgetCreationDate.getMonth() - 3); // 3 months ago

        const budgetConfigs = [
            { name: "Groceries Mock", amount: 500, warning: 80 },
            { name: "Dining Mock", amount: 300, warning: 80 },
            { name: "Transport Mock", amount: 150, warning: 90 },
        ];

        for (const config of budgetConfigs) {
            const catId = categoryIds[config.name];

            let budget = await db.query.budgets.findFirst({
                where: (b, { and, eq }) =>
                    and(
                        eq(b.hubId, TARGET_HUB_ID),
                        eq(b.transactionCategoryId, catId)
                    )
            });

            if (!budget) {
                console.log(`Creating budget template for ${config.name}`);
                await db.insert(budgets).values({
                    hubId: TARGET_HUB_ID,
                    userId: user.id,
                    transactionCategoryId: catId,
                    allocatedAmount: config.amount,
                    warningPercentage: config.warning,
                    createdAt: budgetCreationDate, // Key for Ghost Budget testing!
                });
            }
        }

        // 5. Generate Past Transactions (and let system lazy-create instances or creating them manually here?)
        // To properly test "Carry Over", we should probably rely on the APP to calculate it, 
        // OR we can manually seed budget_instances if we want to force specific carry-over states.
        // However, the best test is to seed TRANSACTIONS and allow the user to browse and trigger the calculations.

        // We will generate data for:
        // M-3 (3 months ago): No budget should exist (Ghost Budget check).
        // M-2 (2 months ago): Budget starts. Overspending.
        // M-1 (1 month ago): Budget exists. Underspending (should absorb M-2 deficit if carryover on).
        // M0 (Current): Budget exists.

        const today = new Date();

        // Generate transactions helper
        const createTx = async (catName: string, amount: number, type: "expense" | "income", dateOffsetMonths: number) => {
            const date = new Date(today);
            date.setMonth(date.getMonth() + dateOffsetMonths);
            date.setDate(15); // Middle of month

            await db.insert(transactions).values({
                hubId: TARGET_HUB_ID,
                userId: user.id,
                financialAccountId: account!.id,
                transactionCategoryId: categoryIds[catName],
                type: type,
                amount: amount,
                // Schema uses createdAt for transaction date, no explicit date column
                createdAt: date,
                updatedAt: date,
                source: "Mock Script",
                note: `Mock ${type} M${dateOffsetMonths}`,
            });
        };

        console.log("Seeding transactions...");

        // Month -2: Overspending (+300 vs 500 budget? No, expensive!)
        // Budget 500. Spend 600. Deficit -100.
        await createTx("Groceries Mock", 600, "expense", -2); // 600 spent
        await createTx("Dining Mock", 100, "expense", -2);    // 100 spent (Under 300)

        // Month -1: Underspending
        // Budget 500. CarryOver -100 -> Effective 400.
        // Spend 200. Allow carry over of +200 to Month 0.
        await createTx("Groceries Mock", 200, "expense", -1);

        // Month 0 (Current):
        // Budget 500. CarryOver +200 -> Effective 700.
        await createTx("Groceries Mock", 50, "expense", 0);


        console.log("Mock data seeded successfully!");
        console.log("NOTES FOR TESTING:");
        console.log("1. Go to Budget Screen.");
        console.log("2. Navigate only back to THREE months ago. You should see NO budgets for the Mock categories (Ghost Budget functionality).");
        console.log("3. Navigate to TWO months ago. You should see budgets. 'Groceries Mock' should be over budget (600/500).");
        console.log("4. Navigate to ONE month ago. 'Groceries Mock' should show carry over deficit if enabled.");
        console.log("5. Current month should show surplus carry over.");

    } catch (err) {
        console.error("Error seeding mock data:", err);
    } finally {
        await pool.end();
    }
}

main();
