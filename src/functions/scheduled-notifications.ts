import { checkSubscriptionExpiry } from "@/lib/notifications/scheduled";

/**
 * Lambda handler for scheduled subscription notifications
 * This function is called by AWS EventBridge (cron) daily at 9 AM UTC
 */
export async function handler() {
  try {
    console.log("Starting scheduled subscription notifications job...");
    const result = await checkSubscriptionExpiry();

    if (result.success) {
      console.log(
        `Scheduled notifications completed successfully. Processed: ${result.processed}`,
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
      console.error("Scheduled notifications failed:", result.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: result.message,
        }),
      };
    }
  } catch (error) {
    console.error("Unexpected error in scheduled notifications handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: (error as Error).message || "Unexpected error occurred",
      }),
    };
  }
}
