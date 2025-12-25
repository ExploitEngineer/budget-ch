import { generateRecurringTransactions } from "@/lib/services/transaction";

/**
 * Lambda handler for recurring transaction generation.
 * This function is called by AWS EventBridge (cron) daily at 2 AM UTC.
 */
export async function handler() {
    try {
        console.log("🔄 Starting recurring transaction generation job...");
        const result = await generateRecurringTransactions();

        if (result.success) {
            console.log(
                `✅ Recurring transaction generation completed. Success: ${result.stats.success}, Failed: ${result.stats.failed}, Skipped: ${result.stats.skipped}`,
            );

            if (result.stats.errors && result.stats.errors.length > 0) {
                console.warn("⚠️ Errors encountered:", result.stats.errors);
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: result.message,
                    stats: result.stats,
                }),
            };
        } else {
            console.error("❌ Recurring transaction generation failed:", result.message);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    message: result.message,
                    stats: result.stats,
                }),
            };
        }
    } catch (error) {
        console.error("💥 Unexpected error in recurring transaction generator:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: (error as Error).message || "Unexpected error occurred",
                stats: { success: 0, failed: 0, skipped: 0 },
            }),
        };
    }
}
