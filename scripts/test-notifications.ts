import { checkSubscriptionExpiry, checkBudgetThresholds } from "../src/lib/notifications/scheduled";

async function test() {
    console.log("🚀 Starting MANUAL Notification Diagnostic Test...");
    console.log("-----------------------------------------------");

    try {
        console.log("\n[1/2] Testing Subscription Expiry Check...");
        const subResult = await checkSubscriptionExpiry();
        if (subResult.success) {
            console.log(`✅ Subscriptions: ${subResult.message} (${subResult.processed} processed)`);
        }

        console.log("\n[2/2] Testing Budget Threshold Check...");
        const budgetResult = await checkBudgetThresholds();
        if (budgetResult.success) {
            console.log(`✅ Budgets: ${budgetResult.message} (${budgetResult.processed} processed)`);
        }

        console.log("\n✨ Diagnostic complete!");
    } catch (err) {
        console.error("💥 CRASHED!");
        console.error(err);
    } finally {
        console.log("-----------------------------------------------");
        process.exit(0);
    }
}

test();
