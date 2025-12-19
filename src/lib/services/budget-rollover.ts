/**
 * Budget Rollover Service
 * Performs proactive monthly budget rollovers for all hubs.
 */

import db from "@/db/db";
import { hubs } from "@/db/schema";
import { ensureBudgetInstances } from "@/lib/services/budget";

export interface RolloverResult {
    success: boolean;
    message?: string;
    processed?: number;
    failed?: number;
}

/**
 * Performs monthly rollover for all hubs.
 * Creates budget instances for the target month/year, applying carry-over if enabled.
 */
export async function performMonthlyRollover(
    targetMonth?: number,
    targetYear?: number,
): Promise<RolloverResult> {
    try {
        const now = new Date();
        const month = targetMonth ?? now.getMonth() + 1;
        const year = targetYear ?? now.getFullYear();

        console.log(`[Budget Rollover] Starting rollover for ${month}/${year}...`);

        // Get all hubs
        const allHubs = await db.select({ id: hubs.id, name: hubs.name }).from(hubs);

        let processed = 0;
        let failed = 0;

        for (const hub of allHubs) {
            try {
                await ensureBudgetInstances(hub.id, month, year);
                processed++;
                console.log(`[Budget Rollover] Processed hub: ${hub.name} (${hub.id})`);
            } catch (err) {
                failed++;
                console.error(`[Budget Rollover] Failed for hub ${hub.id}:`, err);
            }
        }

        const message = `Budget rollover completed for ${month}/${year}. Processed: ${processed}, Failed: ${failed}`;
        console.log(`[Budget Rollover] ${message}`);

        return {
            success: true,
            message,
            processed,
            failed,
        };
    } catch (err: any) {
        console.error("[Budget Rollover] Critical error:", err);
        return {
            success: false,
            message: err.message || "Critical error during budget rollover",
        };
    }
}
