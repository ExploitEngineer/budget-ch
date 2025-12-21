import "dotenv/config";
import { generateRecurringTransactions } from "@/lib/services/transaction";
import db from "@/db/db";
import {
    recurringTransactionTemplates,
    transactions,
    financialAccounts,
    transactionCategories,
    hubs,
    users,
    notifications
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Test script for recurring transaction generation
 * 
 * This script:
 * 1. Creates test data (hub, user, account, category, template)
 * 2. Runs the recurring transaction generator
 * 3. Verifies transactions are created correctly
 * 4. Tests edge cases (insufficient funds, etc.)
 * 5. Cleans up test data
 */

async function testRecurringTransactionGeneration() {
    console.log("🧪 Starting Recurring Transaction Generation Test\n");

    let testHubId: string | null = null;
    let testUserId: string | null = null;
    let testAccountId: string | null = null;
    let testCategoryId: string | null = null;
    let testTemplateIds: string[] = [];

    try {
        // ============================================
        // STEP 1: Setup Test Data
        // ============================================
        console.log("📦 Step 1: Creating test data...");

        // Create test user
        const [testUser] = await db.insert(users).values({
            id: `test-user-${Date.now()}`,
            name: "Test User",
            email: `test-${Date.now()}@example.com`,
            emailVerified: true,
        }).returning();
        testUserId = testUser.id;
        console.log(`✅ Created test user: ${testUserId}`);

        // Create test hub
        const [testHub] = await db.insert(hubs).values({
            userId: testUserId,
            name: "Test Hub for Recurring Transactions",
        }).returning();
        testHubId = testHub.id;
        console.log(`✅ Created test hub: ${testHubId}`);

        // Create test account with CHF 5000 balance
        const [testAccount] = await db.insert(financialAccounts).values({
            hubId: testHubId,
            userId: testUserId,
            name: "Test Checking Account",
            type: "checking",
            initialBalance: 5000,
        }).returning();
        testAccountId = testAccount.id;
        console.log(`✅ Created test account: ${testAccountId} (Balance: CHF 5000)`);

        // Create test category
        const [testCategory] = await db.insert(transactionCategories).values({
            hubId: testHubId,
            name: "Test Recurring Expense",
        }).returning();
        testCategoryId = testCategory.id;
        console.log(`✅ Created test category: ${testCategoryId}\n`);

        // ============================================
        // STEP 2: Create Test Templates
        // ============================================
        console.log("📝 Step 2: Creating recurring templates...");

        // Template 1: Should generate (start date is today, never generated before)
        const today = new Date();
        const [template1] = await db.insert(recurringTransactionTemplates).values({
            hubId: testHubId,
            userId: testUserId,
            financialAccountId: testAccountId,
            transactionCategoryId: testCategoryId,
            type: "expense",
            source: "Test Recurring Rent",
            amount: 1000,
            note: "Monthly rent payment",
            frequencyDays: 30,
            startDate: today,
            status: "active",
        }).returning();
        testTemplateIds.push(template1.id);
        console.log(`✅ Template 1: "Test Recurring Rent" - CHF 1000 (Should generate)`);

        // Template 2: Should skip (start date is in the future)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        const [template2] = await db.insert(recurringTransactionTemplates).values({
            hubId: testHubId,
            userId: testUserId,
            financialAccountId: testAccountId,
            transactionCategoryId: testCategoryId,
            type: "expense",
            source: "Test Future Expense",
            amount: 500,
            note: "Future expense",
            frequencyDays: 30,
            startDate: futureDate,
            status: "active",
        }).returning();
        testTemplateIds.push(template2.id);
        console.log(`✅ Template 2: "Test Future Expense" - CHF 500 (Should skip - future start date)`);

        // Template 3: Should fail (insufficient funds)
        const [template3] = await db.insert(recurringTransactionTemplates).values({
            hubId: testHubId,
            userId: testUserId,
            financialAccountId: testAccountId,
            transactionCategoryId: testCategoryId,
            type: "expense",
            source: "Test Expensive Item",
            amount: 10000, // More than account balance
            note: "Expensive item",
            frequencyDays: 30,
            startDate: today,
            status: "active",
        }).returning();
        testTemplateIds.push(template3.id);
        console.log(`✅ Template 3: "Test Expensive Item" - CHF 10000 (Should fail - insufficient funds)\n`);

        // ============================================
        // STEP 3: Run Generator
        // ============================================
        console.log("🔄 Step 3: Running recurring transaction generator...\n");

        const result = await generateRecurringTransactions();

        console.log("📊 Generation Results:");
        console.log(`   Success: ${result.stats.success}`);
        console.log(`   Failed: ${result.stats.failed}`);
        console.log(`   Skipped: ${result.stats.skipped}`);

        if (result.stats.errors && result.stats.errors.length > 0) {
            console.log(`\n⚠️  Errors:`);
            result.stats.errors.forEach(err => {
                console.log(`   - Template ${err.templateId}: ${err.error}`);
            });
        }
        console.log();

        // ============================================
        // STEP 4: Verify Results
        // ============================================
        console.log("✅ Step 4: Verifying results...\n");

        // Check Template 1 - Should have generated transaction
        const template1Updated = await db.query.recurringTransactionTemplates.findFirst({
            where: eq(recurringTransactionTemplates.id, template1.id),
        });

        console.log("📋 Template 1 Verification:");
        if (template1Updated?.lastGeneratedDate) {
            console.log(`   ✅ lastGeneratedDate: ${template1Updated.lastGeneratedDate.toISOString()}`);
            console.log(`   ✅ consecutiveFailures: ${template1Updated.consecutiveFailures}`);

            // Check if transaction was created
            const generatedTransaction = await db.query.transactions.findFirst({
                where: and(
                    eq(transactions.recurringTemplateId, template1.id),
                    eq(transactions.hubId, testHubId)
                ),
            });

            if (generatedTransaction) {
                console.log(`   ✅ Transaction created: ID ${generatedTransaction.id}`);
                console.log(`   ✅ Amount: CHF ${generatedTransaction.amount}`);
                console.log(`   ✅ Source: ${generatedTransaction.source}`);
            } else {
                console.log(`   ❌ ERROR: Transaction not found!`);
            }

            // Check account balance
            const updatedAccount = await db.query.financialAccounts.findFirst({
                where: eq(financialAccounts.id, testAccountId),
            });
            console.log(`   ✅ Account balance: CHF ${updatedAccount?.initialBalance} (should be 4000)`);

            // Check for success notification
            const successNotification = await db.query.notifications.findFirst({
                where: and(
                    eq(notifications.hubId, testHubId),
                    eq(notifications.type, "success")
                ),
            });

            if (successNotification) {
                console.log(`   ✅ Success notification sent: "${successNotification.title}"`);
            } else {
                console.log(`   ⚠️  No success notification found`);
            }
        } else {
            console.log(`   ❌ ERROR: lastGeneratedDate not updated!`);
        }

        // Check Template 2 - Should have been skipped
        const template2Updated = await db.query.recurringTransactionTemplates.findFirst({
            where: eq(recurringTransactionTemplates.id, template2.id),
        });

        console.log("\n📋 Template 2 Verification:");
        if (!template2Updated?.lastGeneratedDate) {
            console.log(`   ✅ Correctly skipped (future start date)`);
            console.log(`   ✅ lastGeneratedDate: null`);
        } else {
            console.log(`   ❌ ERROR: Should not have generated!`);
        }

        // Check Template 3 - Should have failed
        const template3Updated = await db.query.recurringTransactionTemplates.findFirst({
            where: eq(recurringTransactionTemplates.id, template3.id),
        });

        console.log("\n📋 Template 3 Verification:");
        if (template3Updated?.lastFailedDate) {
            console.log(`   ✅ Correctly failed (insufficient funds)`);
            console.log(`   ✅ lastFailedDate: ${template3Updated.lastFailedDate.toISOString()}`);
            console.log(`   ✅ failureReason: ${template3Updated.failureReason}`);
            console.log(`   ✅ consecutiveFailures: ${template3Updated.consecutiveFailures}`);

            // Check for warning notification
            const warningNotification = await db.query.notifications.findFirst({
                where: and(
                    eq(notifications.hubId, testHubId),
                    eq(notifications.type, "warning")
                ),
            });

            if (warningNotification) {
                console.log(`   ✅ Warning notification sent: "${warningNotification.title}"`);
            } else {
                console.log(`   ⚠️  No warning notification found`);
            }
        } else {
            console.log(`   ❌ ERROR: Should have failed!`);
        }

        // ============================================
        // STEP 5: Test Summary
        // ============================================
        console.log("\n" + "=".repeat(60));
        console.log("📊 TEST SUMMARY");
        console.log("=".repeat(60));

        const expectedSuccess = 1;
        const expectedFailed = 1;
        const expectedSkipped = 1;

        const allTestsPassed =
            result.stats.success === expectedSuccess &&
            result.stats.failed === expectedFailed &&
            result.stats.skipped === expectedSkipped;

        if (allTestsPassed) {
            console.log("✅ ALL TESTS PASSED!");
            console.log(`   - Generated: ${result.stats.success}/${expectedSuccess}`);
            console.log(`   - Failed: ${result.stats.failed}/${expectedFailed}`);
            console.log(`   - Skipped: ${result.stats.skipped}/${expectedSkipped}`);
        } else {
            console.log("❌ SOME TESTS FAILED!");
            console.log(`   - Generated: ${result.stats.success}/${expectedSuccess} ${result.stats.success === expectedSuccess ? '✅' : '❌'}`);
            console.log(`   - Failed: ${result.stats.failed}/${expectedFailed} ${result.stats.failed === expectedFailed ? '✅' : '❌'}`);
            console.log(`   - Skipped: ${result.stats.skipped}/${expectedSkipped} ${result.stats.skipped === expectedSkipped ? '✅' : '❌'}`);
        }
        console.log("=".repeat(60) + "\n");

    } catch (error) {
        console.error("\n💥 Test failed with error:", error);
        throw error;
    } finally {
        // ============================================
        // CLEANUP: Remove test data
        // ============================================
        console.log("🧹 Cleaning up test data...");

        try {
            // Delete notifications
            if (testHubId) {
                await db.delete(notifications).where(eq(notifications.hubId, testHubId));
                console.log("   ✅ Deleted test notifications");
            }

            // Delete transactions
            if (testHubId) {
                await db.delete(transactions).where(eq(transactions.hubId, testHubId));
                console.log("   ✅ Deleted test transactions");
            }

            // Delete templates
            for (const templateId of testTemplateIds) {
                await db.delete(recurringTransactionTemplates).where(
                    eq(recurringTransactionTemplates.id, templateId)
                );
            }
            if (testTemplateIds.length > 0) {
                console.log(`   ✅ Deleted ${testTemplateIds.length} test templates`);
            }

            // Delete category
            if (testCategoryId) {
                await db.delete(transactionCategories).where(
                    eq(transactionCategories.id, testCategoryId)
                );
                console.log("   ✅ Deleted test category");
            }

            // Delete account
            if (testAccountId) {
                await db.delete(financialAccounts).where(
                    eq(financialAccounts.id, testAccountId)
                );
                console.log("   ✅ Deleted test account");
            }

            // Delete hub
            if (testHubId) {
                await db.delete(hubs).where(eq(hubs.id, testHubId));
                console.log("   ✅ Deleted test hub");
            }

            // Delete user
            if (testUserId) {
                await db.delete(users).where(eq(users.id, testUserId));
                console.log("   ✅ Deleted test user");
            }

            console.log("\n✨ Cleanup complete!\n");
        } catch (cleanupError) {
            console.error("⚠️  Error during cleanup:", cleanupError);
        }
    }
}

// Run the test
testRecurringTransactionGeneration()
    .then(() => {
        console.log("✅ Test script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Test script failed:", error);
        process.exit(1);
    });
