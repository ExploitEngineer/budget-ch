/**
 * Test carry-over functionality specifically.
 * Run with: npx tsx scripts/test-carryover.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { hubs, budgetInstances } from "../src/db/schema";
import {
    getBudgetsDB,
    getHubSettingsDB,
    checkBudgetInstancesExistDB,
    createBudgetInstancesDB,
    getBudgetsByMonthDB,
} from "../src/db/queries";

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    console.log("=== Testing Carry-Over Functionality ===\n");

    try {
        // Delete Feb 2026 instances to test fresh
        await db.delete(budgetInstances).where(
            and(eq(budgetInstances.month, 2), eq(budgetInstances.year, 2026))
        );
        console.log("Cleared Feb 2026 instances for fresh test.\n");

        // Find hub with carry-over enabled
        const allHubs = await db.select({ id: hubs.id, name: hubs.name }).from(hubs);

        let foundCarryOverHub = false;

        for (const hub of allHubs) {
            const settings = await getHubSettingsDB(hub.id);

            if (settings.data?.budgetCarryOver) {
                foundCarryOverHub = true;
                console.log(`✅ Found hub with carry-over ENABLED: ${hub.name}\n`);

                // Check Jan 2026 data (previous month)
                console.log("Fetching January 2026 data (previous month)...");
                const janData = await getBudgetsByMonthDB(hub.id, 1, 2026);

                if (!janData.data || janData.data.length === 0) {
                    console.log("  No January 2026 data found. Creating some test instances...");

                    // Create Jan 2026 instances first
                    const budgetsRes = await getBudgetsDB(hub.id);
                    if (budgetsRes.data && budgetsRes.data.length > 0) {
                        const janInstances = budgetsRes.data.filter(b => b.id).map((b) => ({
                            budgetId: b.id!,
                            month: 1,
                            year: 2026,
                            allocatedAmount: b.allocatedAmount ?? 0,
                            carriedOverAmount: 0,
                        }));
                        await createBudgetInstancesDB(janInstances);
                        console.log(`  Created ${janInstances.length} instances for Jan 2026\n`);
                    }
                }

                // Fetch Jan 2026 data again
                const janDataRefresh = await getBudgetsByMonthDB(hub.id, 1, 2026);
                console.log(`\nJan 2026 budgets: ${janDataRefresh.data?.length || 0}`);

                if (janDataRefresh.data) {
                    for (const b of janDataRefresh.data) {
                        const spent = Number(b.calculatedSpentAmount ?? 0) + Number(b.spentAmount ?? 0);
                        const surplus = (b.allocatedAmount ?? 0) + (b.carriedOverAmount ?? 0) - spent;
                        console.log(`  - ${b.categoryName}: allocated=${b.allocatedAmount}, spent=${spent}, surplus=${surplus}`);
                    }
                }

                // Now create Feb 2026 instances with carry-over
                console.log("\nCreating Feb 2026 instances WITH carry-over calculation...");

                const exists = await checkBudgetInstancesExistDB(hub.id, 2, 2026);
                console.log(`Feb 2026 instances already exist: ${exists}`);

                if (!exists) {
                    const budgetsRes = await getBudgetsDB(hub.id);
                    if (budgetsRes.data && budgetsRes.data.length > 0) {
                        const febInstances = budgetsRes.data.filter(b => b.id).map((b) => {
                            const prev = janDataRefresh.data?.find((p) => p.id === b.id);
                            let carryOver = 0;
                            if (prev) {
                                const allocated = prev.allocatedAmount ?? 0;
                                const carried = prev.carriedOverAmount ?? 0;
                                const spent = (prev.spentAmount ?? 0) + (prev.calculatedSpentAmount ?? 0);
                                carryOver = allocated + carried - spent;
                            }
                            console.log(`  Creating: ${b.categoryName} -> carryOver=${carryOver}`);
                            return {
                                budgetId: b.id!,
                                month: 2,
                                year: 2026,
                                allocatedAmount: b.allocatedAmount ?? 0,
                                carriedOverAmount: carryOver,
                            };
                        });
                        await createBudgetInstancesDB(febInstances);
                        console.log(`\n✅ Created ${febInstances.length} instances for Feb 2026 with carry-over!`);
                    }
                }

                // Verify Feb 2026 data
                console.log("\nVerifying Feb 2026 data...");
                const febData = await getBudgetsByMonthDB(hub.id, 2, 2026);
                if (febData.data) {
                    for (const b of febData.data) {
                        console.log(`  - ${b.categoryName}: allocated=${b.allocatedAmount}, carriedOver=${b.carriedOverAmount}`);
                    }
                }

                break;
            }
        }

        if (!foundCarryOverHub) {
            console.log("❌ No hub found with carry-over enabled. Please enable it for a hub first.");
        }

        console.log("\n=== Test Complete ===");
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await pool.end();
    }
}

main();
