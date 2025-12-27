import "dotenv/config";
import { generateRecurringTransactions } from "@/lib/services/transaction";
import { getActiveRecurringTemplatesDB } from "@/db/queries";
import { startOfDay, format } from "date-fns";

const TARGET_HUB_ID = "bc29a94e-e14c-498b-9bcd-173b8a38011d";

async function testRecurringPayments() {
    console.log(`🔍 Testing Recurring Payments for Hub: ${TARGET_HUB_ID}\n`);
    console.log("=".repeat(80));

    try {
        // Step 1: Fetch all active recurring templates
        console.log("\n📋 Step 1: Fetching active recurring templates...");
        const templatesResult = await getActiveRecurringTemplatesDB();

        if (!templatesResult.success || !templatesResult.data) {
            console.error("❌ Failed to fetch templates:", templatesResult.message);
            return;
        }

        // Filter for this specific hub
        const hubTemplates = templatesResult.data.filter(t => t.hubId === TARGET_HUB_ID);

        if (hubTemplates.length === 0) {
            console.log(`⚠️  No active recurring templates found for hub ${TARGET_HUB_ID}`);
            return;
        }

        console.log(`✅ Found ${hubTemplates.length} active template(s) for this hub:\n`);

        const today = startOfDay(new Date());

        // Step 2: Display template details
        hubTemplates.forEach((template, index) => {
            console.log(`\n📝 Template ${index + 1}:`);
            console.log(`   ID: ${template.id}`);
            console.log(`   Name: ${template.source || template.categoryName || "Unnamed"}`);
            console.log(`   Amount: CHF ${template.amount.toFixed(2)}`);
            console.log(`   Type: ${template.type}`);
            console.log(`   Frequency: Every ${template.frequencyDays} days`);
            console.log(`   Start Date: ${format(new Date(template.startDate), "dd.MM.yyyy")}`);
            console.log(`   Last Generated: ${template.lastGeneratedDate ? format(new Date(template.lastGeneratedDate), "dd.MM.yyyy HH:mm") : "Never"}`);
            console.log(`   User Language: ${template.userLanguage || "en"}`);
            console.log(`   Status: ${template.status}`);
            console.log(`   Consecutive Failures: ${template.consecutiveFailures || 0}`);
        });

        console.log("\n" + "=".repeat(80));

        // Step 3: Run the actual generation process
        console.log("\n🚀 Step 2: Running recurring transaction generation...\n");
        const result = await generateRecurringTransactions();

        console.log("\n" + "=".repeat(80));
        console.log("\n📊 RESULTS:");
        console.log("=".repeat(80));

        if (result.success) {
            console.log(`✅ Success: ${result.stats.success} transaction(s) generated`);
            console.log(`❌ Failed: ${result.stats.failed} transaction(s)`);
            console.log(`⏭️  Skipped: ${result.stats.skipped} transaction(s) (not due yet)`);

            if (result.stats.errors && result.stats.errors.length > 0) {
                console.log("\n⚠️  Errors encountered:");
                result.stats.errors.forEach((err, i) => {
                    console.log(`   ${i + 1}. Template ${err.templateId}: ${err.error}`);
                });
            }
        } else {
            console.error(`\n❌ Generation failed: ${result.message}`);
        }

        console.log("\n" + "=".repeat(80));
        console.log("\n✨ Test completed!\n");

    } catch (error) {
        console.error("\n💥 Unexpected error:", error);
    }
}

// Run the test
testRecurringPayments().catch(console.error);
