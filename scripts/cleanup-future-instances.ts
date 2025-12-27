/**
 * Cleanup script to delete future month budget instances for a specific hub.
 * Run with: npx tsx scripts/cleanup-future-instances.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq, or, gt, sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { budgetInstances, budgets } from "../src/db/schema";

const HUB_ID = "bc29a94e-e14c-498b-9bcd-173b8a38011d";

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    console.log("=== Cleanup Future Budget Instances ===\n");
    console.log(`Hub ID: ${HUB_ID}`);

    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-indexed
        const currentYear = now.getFullYear();

        console.log(`Current date: ${currentMonth}/${currentYear}`);
        console.log("Looking for instances in future months...\n");

        // Find all budget IDs for this hub
        const hubBudgets = await db
            .select({ id: budgets.id })
            .from(budgets)
            .where(eq(budgets.hubId, HUB_ID));

        const budgetIds = hubBudgets.map(b => b.id);
        console.log(`Found ${budgetIds.length} budgets for this hub`);

        if (budgetIds.length === 0) {
            console.log("No budgets found. Exiting.");
            await pool.end();
            return;
        }

        // Find future instances
        const futureInstances = await db
            .select({
                id: budgetInstances.id,
                budgetId: budgetInstances.budgetId,
                month: budgetInstances.month,
                year: budgetInstances.year,
                allocatedAmount: budgetInstances.allocatedAmount,
                carriedOverAmount: budgetInstances.carriedOverAmount,
            })
            .from(budgetInstances)
            .innerJoin(budgets, eq(budgetInstances.budgetId, budgets.id))
            .where(
                and(
                    eq(budgets.hubId, HUB_ID),
                    or(
                        gt(budgetInstances.year, currentYear),
                        and(
                            eq(budgetInstances.year, currentYear),
                            gt(budgetInstances.month, currentMonth)
                        )
                    )
                )
            );

        console.log(`Found ${futureInstances.length} future instances to delete:\n`);

        for (const instance of futureInstances) {
            console.log(`  - ${instance.month}/${instance.year}: allocated=${instance.allocatedAmount}, carryOver=${instance.carriedOverAmount}`);
        }

        if (futureInstances.length === 0) {
            console.log("\nNo future instances to delete. Exiting.");
            await pool.end();
            return;
        }

        // Delete future instances
        const instanceIds = futureInstances.map(i => i.id);

        console.log(`\nDeleting ${instanceIds.length} future instances...`);

        for (const id of instanceIds) {
            await db.delete(budgetInstances).where(eq(budgetInstances.id, id));
        }

        console.log("✅ Cleanup complete!");
        console.log("\nFuture months will now show template values directly.");

    } catch (error) {
        console.error("Cleanup script failed:", error);
    } finally {
        await pool.end();
    }
}

main();
