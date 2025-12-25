/**
 * Test script for budget rollover service.
 * Run with: npx tsx scripts/test-rollover.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { hubs } from "../src/db/schema";
import {
    getBudgetsDB,
    getHubSettingsDB,
    checkBudgetInstancesExistDB,
    createBudgetInstancesDB,
    getExistingBudgetInstancesDB,
    getBudgetsByMonthDB,
} from "../src/db/queries";

async function ensureBudgetInstancesLocal(
    hubId: string,
    month: number,
    year: number,
) {
    try {
        const exists = await checkBudgetInstancesExistDB(hubId, month, year);
        if (exists) {
            console.log(`  -> Instances already exist for ${month}/${year}`);
            return;
        }

        // Get Settings
        const settingsRes = await getHubSettingsDB(hubId);
        const carryOverEnabled = settingsRes.data?.budgetCarryOver ?? false;
        console.log(`  -> Carry-over enabled: ${carryOverEnabled}`);

        // Get Previous Month Data if Carry Over Enabled
        let prevMonthBudgets: any[] = [];
        if (carryOverEnabled) {
            const prevDate = new Date(Date.UTC(year, month - 1, 1));
            prevDate.setMonth(prevDate.getMonth() - 1);
            const pm = prevDate.getMonth() + 1;
            const py = prevDate.getFullYear();

            const res = await getBudgetsByMonthDB(hubId, pm, py);
            if (res.success && res.data) {
                prevMonthBudgets = res.data;
            }
        }

        // Get Current Templates
        const currentBudgetsRes = await getBudgetsDB(hubId);
        if (!currentBudgetsRes.success || !currentBudgetsRes.data) {
            console.log(`  -> No budgets found for hub`);
            return;
        }

        const currentBudgets = currentBudgetsRes.data;
        console.log(`  -> Found ${currentBudgets.length} budget templates`);

        // Fetch existing instances to avoid duplicates
        const existingInstances = await getExistingBudgetInstancesDB(hubId, month, year);
        const existingInstanceBudgetIds = new Set(existingInstances.map(i => i.budgetId));

        // Filter to find budgets that don't have an instance yet
        const missingBudgets = currentBudgets.filter(b => b.id !== null && !existingInstanceBudgetIds.has(b.id));

        if (missingBudgets.length === 0) {
            console.log(`  -> All instances already exist`);
            return;
        }

        const instances = missingBudgets.map((b) => {
            let carryOver = 0;
            if (carryOverEnabled) {
                const prev = prevMonthBudgets.find((p) => p.id === b.id);
                if (prev) {
                    const allocated = prev.allocatedAmount ?? 0;
                    const carried = prev.carriedOverAmount ?? 0;
                    const spent =
                        (prev.spentAmount ?? 0) + (prev.calculatedSpentAmount ?? 0);
                    carryOver = allocated + carried - spent;
                }
            }

            return {
                budgetId: b.id!,
                month,
                year,
                allocatedAmount: b.allocatedAmount ?? 0,
                carriedOverAmount: carryOver,
            };
        });

        await createBudgetInstancesDB(instances);
        console.log(`  -> Created ${instances.length} new instances`);
    } catch (err) {
        console.error("  -> Error ensuring budget instances:", err);
    }
}

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    console.log("=== Budget Rollover Test Script ===\n");

    try {
        // Get all hubs
        const allHubs = await db.select({ id: hubs.id, name: hubs.name }).from(hubs);
        console.log(`Found ${allHubs.length} hubs\n`);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        console.log(`Testing rollover for ${month}/${year}...\n`);

        let processed = 0;
        let failed = 0;

        for (const hub of allHubs) {
            try {
                console.log(`Processing hub: ${hub.name} (${hub.id})`);
                await ensureBudgetInstancesLocal(hub.id, month, year);
                processed++;
            } catch (err) {
                failed++;
                console.error(`  -> Failed:`, err);
            }
        }

        console.log("\n=== Result ===");
        console.log(`Processed: ${processed}, Failed: ${failed}`);

        // Test next month
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;

        console.log(`\nTesting rollover for next month: ${nextMonth}/${nextYear}...\n`);

        for (const hub of allHubs) {
            try {
                console.log(`Processing hub: ${hub.name} (${hub.id})`);
                await ensureBudgetInstancesLocal(hub.id, nextMonth, nextYear);
            } catch (err) {
                console.error(`  -> Failed:`, err);
            }
        }

        console.log("\n=== Done ===");
    } catch (error) {
        console.error("Test script failed:", error);
    } finally {
        await pool.end();
    }
}

main();
