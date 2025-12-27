import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { recurringTransactionTemplates, financialAccounts } from "../src/db/schema";
import { subDays, addDays } from "date-fns";

const HUB_ID = "bc29a94e-e14c-498b-9bcd-173b8a38011d";

async function seedRecurringTemplates() {
    console.log("🌱 Seeding recurring transaction templates for testing...\n");

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    try {
        // Get hub info
        const hub = await db.query.hubs.findFirst({
            where: (h, { eq }) => eq(h.id, HUB_ID),
        });

        if (!hub) {
            console.error(`❌ Hub ${HUB_ID} not found`);
            await pool.end();
            return;
        }

        console.log(`✅ Found hub: ${hub.name}`);
        console.log(`   Owner: ${hub.userId}\n`);

        // Get accounts for this hub
        const accounts = await db.query.financialAccounts.findMany({
            where: (a, { eq }) => eq(a.hubId, HUB_ID),
        });

        if (accounts.length === 0) {
            console.error(`❌ No accounts found for hub ${HUB_ID}`);
            await pool.end();
            return;
        }

        console.log(`✅ Found ${accounts.length} account(s):`);
        accounts.forEach(acc => {
            console.log(`   - ${acc.name}: CHF ${acc.initialBalance}`);
        });

        const primaryAccount = accounts[0];
        const secondAccount = accounts.length > 1 ? accounts[1] : accounts[0];

        // Get user info
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, hub.userId),
        });

        if (!user) {
            console.error(`❌ User not found`);
            await pool.end();
            return;
        }

        console.log(`\n👤 User language: ${user.language || 'en'}\n`);

        // Get categories
        const categories = await db.query.transactionCategories.findMany({
            where: (c, { eq }) => eq(c.hubId, HUB_ID),
        });

        const categoryId = categories.length > 0 ? categories[0].id : null;

        console.log("🔨 Creating test recurring templates...\n");

        const today = new Date();
        const templates = [
            {
                id: crypto.randomUUID(),
                hubId: HUB_ID,
                userId: hub.userId,
                financialAccountId: primaryAccount.id,
                transactionCategoryId: categoryId,
                type: "expense" as const,
                source: "Netflix Subscription",
                amount: 15.99,
                note: "Monthly streaming service",
                frequencyDays: 30,
                startDate: subDays(today, 35), // Started 35 days ago, so it's DUE
                endDate: null,
                status: "active" as const,
                lastGeneratedDate: subDays(today, 35), // Last generated 35 days ago
                consecutiveFailures: 0,
            },
            {
                id: crypto.randomUUID(),
                hubId: HUB_ID,
                userId: hub.userId,
                financialAccountId: primaryAccount.id,
                transactionCategoryId: categoryId,
                type: "expense" as const,
                source: "Gym Membership",
                amount: 99999.99, // HUGE amount - will fail with insufficient funds
                note: "Monthly gym fee - WILL FAIL",
                frequencyDays: 30,
                startDate: subDays(today, 32),
                endDate: null,
                status: "active" as const,
                lastGeneratedDate: subDays(today, 32),
                consecutiveFailures: 0,
            },
            {
                id: crypto.randomUUID(),
                hubId: HUB_ID,
                userId: hub.userId,
                financialAccountId: secondAccount.id,
                transactionCategoryId: categoryId,
                type: "income" as const,
                source: "Freelance Payment",
                amount: 500.00,
                note: "Weekly freelance income",
                frequencyDays: 7,
                startDate: subDays(today, 10), // Started 10 days ago
                endDate: null,
                status: "active" as const,
                lastGeneratedDate: subDays(today, 3), // Last generated 3 days ago, NOT DUE yet (needs 7 days)
                consecutiveFailures: 0,
            },
            {
                id: crypto.randomUUID(),
                hubId: HUB_ID,
                userId: hub.userId,
                financialAccountId: primaryAccount.id,
                transactionCategoryId: categoryId,
                type: "expense" as const,
                source: "Coffee Subscription",
                amount: 12.50,
                note: "Daily coffee - first time generation",
                frequencyDays: 1,
                startDate: today, // Starts today, never generated
                endDate: null,
                status: "active" as const,
                lastGeneratedDate: null, // Never generated - WILL BE DUE
                consecutiveFailures: 0,
            },
            {
                id: crypto.randomUUID(),
                hubId: HUB_ID,
                userId: hub.userId,
                financialAccountId: primaryAccount.id,
                transactionCategoryId: categoryId,
                type: "expense" as const,
                source: "Future Subscription",
                amount: 25.00,
                note: "Starts next week - NOT DUE",
                frequencyDays: 30,
                startDate: addDays(today, 7), // Starts in the future
                endDate: null,
                status: "active" as const,
                lastGeneratedDate: null,
                consecutiveFailures: 0,
            },
        ];

        // Insert templates
        await db.insert(recurringTransactionTemplates).values(templates);

        console.log("✅ Created templates:\n");
        templates.forEach((t, i) => {
            console.log(`${i + 1}. ${t.source}`);
            console.log(`   Amount: CHF ${t.amount}`);
            console.log(`   Type: ${t.type}`);
            console.log(`   Frequency: Every ${t.frequencyDays} day(s)`);
            console.log(`   Last Generated: ${t.lastGeneratedDate ? t.lastGeneratedDate.toISOString().split('T')[0] : 'Never'}`);
            console.log(`   Expected: ${getExpectedBehavior(t, today)}`);
            console.log("");
        });

        console.log("🎉 Seeding complete!");
        console.log("\n💡 Run: npx tsx scripts/test-recurring-payments.ts");

    } catch (error) {
        console.error("❌ Error seeding templates:", error);
    } finally {
        await pool.end();
    }
}

function getExpectedBehavior(template: any, today: Date): string {
    if (template.source === "Gym Membership") {
        return "❌ FAIL - Insufficient funds";
    }
    if (template.source === "Freelance Payment") {
        return "⏭️ SKIP - Not due yet (needs 7 days, only 3 passed)";
    }
    if (template.source === "Future Subscription") {
        return "⏭️ SKIP - Start date in future";
    }
    if (template.source === "Netflix Subscription" || template.source === "Coffee Subscription") {
        return "✅ SUCCESS - Should be generated";
    }
    return "Unknown";
}

seedRecurringTemplates().catch(console.error);
