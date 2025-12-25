import { performMonthlyRollover } from "@/lib/services/budget-rollover";

/**
 * Lambda handler for monthly budget rollover.
 * This function is called by AWS EventBridge (cron) on the 1st of each month.
 */
export async function handler() {
    try {
        console.log("Starting monthly budget rollover job...");
        const result = await performMonthlyRollover();

        if (result.success) {
            console.log(
                `Budget rollover completed successfully. Processed: ${result.processed}, Failed: ${result.failed}`,
            );
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: result.message,
                    processed: result.processed,
                    failed: result.failed,
                }),
            };
        } else {
            console.error("Budget rollover failed:", result.message);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    message: result.message,
                }),
            };
        }
    } catch (error) {
        console.error("Unexpected error in budget rollover handler:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: (error as Error).message || "Unexpected error occurred",
            }),
        };
    }
}
