import db from "@/db/db";
import { savingGoals } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Lambda handler for monthly savings goal auto-allocation.
 * This runs on the 1st of each month (e.g., 01:00 UTC) via AWS EventBridge.
 * 
 * Logic:
 * 1. Find all saving goals where autoAllocationEnabled is TRUE.
 * 2. Increment amountSaved by monthlyAllocation.
 * 3. Cap at goalAmount (if goalAmount > 0).
 */
export async function handler() {
    try {
        console.log("Starting savings goal auto-allocation job...");

        // 1. Fetch all enabled goals
        const enabledGoals = await db
            .select()
            .from(savingGoals)
            .where(eq(savingGoals.autoAllocationEnabled, true));

        console.log(`Found ${enabledGoals.length} goals with auto-allocation enabled.`);

        let processed = 0;
        let failed = 0;

        // 2. Process each goal
        for (const goal of enabledGoals) {
            try {
                // Skip if allocation is 0 or goal is fully funded (optional, but good practice)
                if (goal.monthlyAllocation <= 0) continue;

                const currentSaved = goal.amountSaved || 0;
                const target = goal.goalAmount || 0;
                const allocation = goal.monthlyAllocation;

                // Check if already reached target (if target exists)
                if (target > 0 && currentSaved >= target) {
                    continue; // Skip fully funded goals
                }

                // Calculate new amount, capping at target
                let newSaved = currentSaved + allocation;
                if (target > 0 && newSaved > target) {
                    newSaved = target;
                }

                // Update the goal
                await db
                    .update(savingGoals)
                    .set({
                        amountSaved: newSaved,
                        updatedAt: new Date(),
                    })
                    .where(eq(savingGoals.id, goal.id));

                processed++;
            } catch (err) {
                console.error(`Failed to process goal ${goal.id}:`, err);
                failed++;
            }
        }

        console.log(
            `Auto-allocation completed. Processed: ${processed}, Failed: ${failed}`
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: "Auto-allocation completed",
                processed,
                failed,
            }),
        };

    } catch (error) {
        console.error("Critical error in savings goal auto-allocation:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: (error as Error).message || "Unexpected error",
            }),
        };
    }
}
