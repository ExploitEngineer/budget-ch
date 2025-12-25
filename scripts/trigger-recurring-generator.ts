import "dotenv/config";
import { handler } from "../src/functions/recurring-transactions-generator";

/**
 * Manual test script to trigger the recurring transaction generator
 * This simulates the cron job execution
 */

async function main() {
    console.log("🚀 Manually Triggering Recurring Transaction Generator");
    console.log("=".repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log("=".repeat(60) + "\n");

    const startTime = performance.now();

    try {
        const result = await handler();
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log("\n" + "=".repeat(60));
        console.log("✅ EXECUTION COMPLETED");
        console.log("=".repeat(60));
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`📊 Status Code: ${result.statusCode}`);
        console.log("\n📝 Response:");
        console.log(JSON.stringify(JSON.parse(result.body), null, 2));
        console.log("=".repeat(60));

        process.exit(result.statusCode === 200 ? 0 : 1);
    } catch (error) {
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.error("\n" + "=".repeat(60));
        console.error("❌ EXECUTION FAILED");
        console.error("=".repeat(60));
        console.error(`⏱️  Duration: ${duration}s`);
        console.error("\n💥 Error:");
        console.error(error);
        console.error("=".repeat(60));

        process.exit(1);
    }
}

main();
