import { checkBudgetThresholds } from "@/lib/notifications/scheduled";

/**
 * Lambda handler for periodic budget threshold checks
 * This function is called by AWS EventBridge (cron) every 30 minutes
 */
export async function handler() {
    try {
        console.log("Starting periodic budget alerts job...");
        const result = await checkBudgetThresholds();

        if (result.success) {
            console.log(
                `Budget alerts completed successfully. Processed: ${result.processed}`,
            );
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: result.message,
                    processed: result.processed,
                }),
            };
        } else {
            console.error("Budget alerts failed:", result.message);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    message: result.message,
                }),
            };
        }
    } catch (error) {
        console.error("Unexpected error in budget alerts handler:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: (error as Error).message || "Unexpected error occurred",
            }),
        };
    }
}
