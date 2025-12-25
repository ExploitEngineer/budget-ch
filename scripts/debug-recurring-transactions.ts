import db from "../src/db/db";
import { transactions, recurringTransactionTemplates } from "../src/db/schema";
import { eq } from "drizzle-orm";

/**
 * Debug script to check recurring transactions for a specific hub
 * Usage: pnpm tsx scripts/debug-recurring-transactions.ts
 */

async function debugRecurringTransactions() {
    const hubId = "bc29a94e-e14c-498b-9bcd-173b8a38011d";
    const userEmail = "ahsan69999@gmail.com";

    console.log("🔍 Debugging Recurring Transactions");
    console.log("=====================================");
    console.log(`Hub ID: ${hubId}`);
    console.log(`User Email: ${userEmail}\n`);

    try {
        // 1. Check recurring transaction templates
        console.log("📋 Step 1: Checking Recurring Transaction Templates");
        console.log("---------------------------------------------------");
        const templates = await db
            .select()
            .from(recurringTransactionTemplates)
            .where(eq(recurringTransactionTemplates.hubId, hubId));

        console.log(`Found ${templates.length} recurring templates:\n`);
        templates.forEach((template, idx) => {
            console.log(`Template ${idx + 1}:`);
            console.log(`  ID: ${template.id}`);
            console.log(`  Amount: ${template.amount}`);
            console.log(`  Frequency (days): ${template.frequencyDays}`);
            console.log(`  Status: ${template.status}`);
            console.log(`  Start Date: ${template.startDate}`);
            console.log(`  End Date: ${template.endDate || "No end date"}`);
            console.log("");
        });

        // 2. Check all transactions for this hub
        console.log("\n💰 Step 2: Checking All Transactions");
        console.log("-------------------------------------");
        const allTransactions = await db
            .select()
            .from(transactions)
            .where(eq(transactions.hubId, hubId));

        console.log(`Found ${allTransactions.length} total transactions\n`);

        // 3. Check transactions linked to recurring templates
        console.log("\n🔗 Step 3: Checking Transactions with Recurring Template IDs");
        console.log("------------------------------------------------------------");
        const recurringTransactions = allTransactions.filter(
            (tx) => tx.recurringTemplateId !== null
        );

        console.log(
            `Found ${recurringTransactions.length} transactions linked to recurring templates:\n`
        );
        recurringTransactions.forEach((tx, idx) => {
            console.log(`Transaction ${idx + 1}:`);
            console.log(`  ID: ${tx.id}`);
            console.log(`  Source: ${tx.source}`);
            console.log(`  Amount: ${tx.amount}`);
            console.log(`  Type: ${tx.type}`);
            console.log(`  Created At: ${tx.createdAt}`);
            console.log(`  Recurring Template ID: ${tx.recurringTemplateId}`);
            console.log("");
        });

        // 4. Summary
        console.log("\n📊 Summary");
        console.log("==========");
        console.log(`Total Recurring Templates: ${templates.length}`);
        console.log(`Total Transactions: ${allTransactions.length}`);
        console.log(
            `Transactions with Recurring Template ID: ${recurringTransactions.length}`
        );
        if (allTransactions.length > 0) {
            console.log(
                `Percentage: ${((recurringTransactions.length / allTransactions.length) * 100).toFixed(2)}%`
            );
        }

        // 5. Check for orphaned links
        console.log("\n⚠️  Step 4: Checking for Data Integrity Issues");
        console.log("----------------------------------------------");
        const templateIds = new Set(templates.map((t) => t.id));
        const orphanedTransactions = recurringTransactions.filter(
            (tx) => tx.recurringTemplateId && !templateIds.has(tx.recurringTemplateId)
        );

        if (orphanedTransactions.length > 0) {
            console.log(
                `❌ Found ${orphanedTransactions.length} transactions with invalid recurring template IDs!`
            );
            orphanedTransactions.forEach((tx) => {
                console.log(
                    `   Transaction ${tx.id} references non-existent template ${tx.recurringTemplateId}`
                );
            });
        } else {
            console.log("✅ All recurring transactions have valid template references");
        }

        // 6. Sample raw transaction data
        console.log("\n🔬 Step 5: Sample Raw Transaction Data (first 3)");
        console.log("-------------------------------------------------");
        allTransactions.slice(0, 3).forEach((tx, idx) => {
            console.log(`\nTransaction ${idx + 1} (RAW):`);
            console.log(JSON.stringify(tx, null, 2));
        });

    } catch (error) {
        console.error("❌ Error during debugging:", error);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Run the debug function
debugRecurringTransactions();
