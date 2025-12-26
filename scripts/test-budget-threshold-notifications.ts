/**
 * Script to test budget threshold notification logic
 * Run with: npx tsx scripts/test-budget-threshold-notifications.ts
 * 
 * This script tests the following scenarios:
 * 1. Creating expense that crosses 80% threshold -> Should send email
 * 2. Creating expense when already above 80% -> Should NOT send email
 * 3. Creating expense that crosses 100% threshold -> Should send email
 * 4. Creating expense when already above 100% -> Should NOT send email
 * 5. Deleting expense to drop below 60% -> Should create reset marker
 * 6. Creating expense that crosses 80% after reset -> Should send email again
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const HUB_ID = "bc29a94e-e14c-498b-9bcd-173b8a38011d";
const TEST_CATEGORY_NAME = "test-budget-threshold-category";
const TEST_BUDGET_AMOUNT = 100; // CHF 100 budget for easy percentage calculation

async function testBudgetThresholdNotifications() {
    console.log("🧪 Testing Budget Threshold Notification Logic");
    console.log("━".repeat(60));
    console.log(`Hub ID: ${HUB_ID}`);
    console.log(`Test Budget: CHF ${TEST_BUDGET_AMOUNT}`);
    console.log("━".repeat(60));

    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema });

    try {
        // Step 1: Get hub info and validate
        console.log("\n📋 Step 1: Validating hub...");
        const hub = await db.query.hubs.findFirst({
            where: eq(schema.hubs.id, HUB_ID),
        });

        if (!hub) {
            throw new Error(`Hub ${HUB_ID} not found`);
        }
        console.log(`  ✅ Found hub: ${hub.name}`);

        // Step 2: Get or create a test category
        console.log("\n📋 Step 2: Setting up test category...");
        let category = await db.query.transactionCategories.findFirst({
            where: and(
                eq(schema.transactionCategories.hubId, HUB_ID),
                eq(schema.transactionCategories.name, TEST_CATEGORY_NAME)
            ),
        });

        if (!category) {
            const [newCategory] = await db
                .insert(schema.transactionCategories)
                .values({
                    hubId: HUB_ID,
                    name: TEST_CATEGORY_NAME,
                })
                .returning();
            category = newCategory;
            console.log(`  ✅ Created test category: ${category.name}`);
        } else {
            console.log(`  ✅ Using existing category: ${category.name}`);
        }

        // Step 3: Get or create a test budget
        console.log("\n📋 Step 3: Setting up test budget...");
        let budget = await db.query.budgets.findFirst({
            where: and(
                eq(schema.budgets.hubId, HUB_ID),
                eq(schema.budgets.transactionCategoryId, category.id)
            ),
        });

        if (!budget) {
            const [newBudget] = await db
                .insert(schema.budgets)
                .values({
                    hubId: HUB_ID,
                    transactionCategoryId: category.id,
                    allocatedAmount: TEST_BUDGET_AMOUNT,
                    spentAmount: 0,
                    warningPercentage: 80,
                    markerColor: "standard",
                    updatedAt: new Date(),
                })
                .returning();
            budget = newBudget;
            console.log(`  ✅ Created test budget: CHF ${TEST_BUDGET_AMOUNT}`);
        } else {
            // Reset budget for clean test
            await db
                .update(schema.budgets)
                .set({
                    allocatedAmount: TEST_BUDGET_AMOUNT,
                    spentAmount: 0,
                })
                .where(eq(schema.budgets.id, budget.id));
            console.log(`  ✅ Reset existing budget to CHF ${TEST_BUDGET_AMOUNT}`);
        }

        // Step 4: Get a financial account for transactions
        console.log("\n📋 Step 4: Getting financial account...");
        const account = await db.query.financialAccounts.findFirst({
            where: eq(schema.financialAccounts.hubId, HUB_ID),
        });

        if (!account) {
            throw new Error(`No financial account found for hub ${HUB_ID}`);
        }
        console.log(`  ✅ Using account: ${account.name}`);

        // Step 5: Clean up any existing test transactions and notifications
        console.log("\n📋 Step 5: Cleaning up previous test data...");

        // Delete test transactions
        const deletedTx = await db
            .delete(schema.transactions)
            .where(
                and(
                    eq(schema.transactions.hubId, HUB_ID),
                    eq(schema.transactions.transactionCategoryId, category.id)
                )
            )
            .returning({ id: schema.transactions.id });
        console.log(`  ✅ Deleted ${deletedTx.length} previous test transactions`);

        // Delete test notifications for this budget
        const existingNotifications = await db
            .select()
            .from(schema.notifications)
            .where(eq(schema.notifications.hubId, HUB_ID));

        let deletedNotifications = 0;
        for (const n of existingNotifications) {
            if (n.metadata) {
                const metadata = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
                if (metadata.budgetId === budget.id) {
                    await db.delete(schema.notifications).where(eq(schema.notifications.id, n.id));
                    deletedNotifications++;
                }
            }
        }
        console.log(`  ✅ Deleted ${deletedNotifications} previous test notifications`);

        // Step 6: Show current state
        console.log("\n📊 Current State:");
        console.log(`  Budget ID: ${budget.id}`);
        console.log(`  Category ID: ${category.id}`);
        console.log(`  Allocated: CHF ${TEST_BUDGET_AMOUNT}`);
        console.log(`  Current Spent: CHF 0`);
        console.log(`  Current %: 0%`);

        // Step 7: Instructions for manual testing
        console.log("\n" + "━".repeat(60));
        console.log("🧪 MANUAL TEST INSTRUCTIONS");
        console.log("━".repeat(60));
        console.log("\nNow manually test the notification logic by creating expenses:");
        console.log("\n1️⃣  Create expense for CHF 85 (85%)");
        console.log("   → Expected: Receive 80% threshold email");
        console.log("\n2️⃣  Create expense for CHF 5 (total: 90%)");
        console.log("   → Expected: NO email (already above 80%)");
        console.log("\n3️⃣  Create expense for CHF 15 (total: 105%)");
        console.log("   → Expected: Receive 100% exceeded email");
        console.log("\n4️⃣  Create expense for CHF 10 (total: 115%)");
        console.log("   → Expected: NO email (already above 100%)");
        console.log("\n5️⃣  Delete expenses to drop below 60%");
        console.log("   → Expected: Reset marker created (no email)");
        console.log("\n6️⃣  Create expense for CHF 85 again");
        console.log("   → Expected: Receive 80% threshold email again");

        console.log("\n" + "━".repeat(60));
        console.log("📧 Test Data Ready!");
        console.log("━".repeat(60));
        console.log(`\nCategory to use: "${TEST_CATEGORY_NAME}"`);
        console.log(`Budget amount: CHF ${TEST_BUDGET_AMOUNT}`);
        console.log("\nCheck the notifications table for results after each step.");

        // Helper: Show how to query notifications
        console.log("\n📝 To check notifications, run:");
        console.log(`   SELECT title, type, metadata FROM notifications WHERE hub_id = '${HUB_ID}' ORDER BY created_at DESC LIMIT 10;`);

    } catch (error) {
        console.error("\n❌ Error:", error);
        throw error;
    } finally {
        await pool.end();
    }
}

testBudgetThresholdNotifications()
    .then(() => {
        console.log("\n✅ Test setup complete!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Script failed:", err);
        process.exit(1);
    });
