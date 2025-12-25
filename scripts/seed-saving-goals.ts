import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { savingGoals, financialAccounts } from "../src/db/schema";
import { eq } from "drizzle-orm";

const HUB_ID = "3988f642-fdee-4bbe-b633-1e4fb73779c2";
const USER_EMAIL = "abbasiahsan699@gmail.com";

async function seedSavingGoals() {
    console.log("🚀 Starting Savings Goals Brutal Test Data Seed...\n");

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    try {
        // Step 1: Find the user ID by email
        console.log(`📧 Looking up user: ${USER_EMAIL}`);
        const userResult = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.email, USER_EMAIL),
        });

        if (!userResult) {
            throw new Error(`User with email ${USER_EMAIL} not found!`);
        }

        const userId = userResult.id;
        console.log(`✅ Found user: ${userId}\n`);

        // Step 2: Get a financial account for this hub (or use null)
        console.log(`🏦 Looking up financial accounts for hub: ${HUB_ID}`);
        const accountsResult = await db
            .select()
            .from(financialAccounts)
            .where(eq(financialAccounts.hubId, HUB_ID))
            .limit(1);

        const financialAccountId = accountsResult.length > 0 ? accountsResult[0].id : null;

        if (financialAccountId) {
            console.log(`✅ Found account: ${financialAccountId}\n`);
        } else {
            console.log(`⚠️  No accounts found, using null for financialAccountId\n`);
        }

        // Step 3: Delete existing savings goals for this hub
        console.log(`🗑️  Clearing existing savings goals for hub: ${HUB_ID}`);
        await db.delete(savingGoals).where(eq(savingGoals.hubId, HUB_ID));
        console.log(`✅ Cleared old data\n`);

        // Step 4: Create brutal test data
        console.log(`📊 Creating test savings goals...\n`);

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const goalsToCreate = [
            // 1. EDGE CASE: 0% Complete - Just Started
            {
                name: "🆕 New Emergency Fund",
                goalAmount: 10000,
                amountSaved: 0,
                monthlyAllocation: 500,
                dueDate: nextMonth,
                financialAccountId,
                autoAllocationEnabled: true,
            },

            // 2. EDGE CASE: 25% Complete - Early Progress
            {
                name: "🏖️ Vacation to Switzerland",
                goalAmount: 8000,
                amountSaved: 2000,
                monthlyAllocation: 400,
                dueDate: nextMonth,
                financialAccountId,
                autoAllocationEnabled: true,
            },

            // 3. EDGE CASE: 50% Complete - Halfway There
            {
                name: "💻 New Laptop Fund",
                goalAmount: 3000,
                amountSaved: 1500,
                monthlyAllocation: 250,
                dueDate: nextWeek,
                financialAccountId,
                autoAllocationEnabled: false,
            },

            // 4. EDGE CASE: 75% Complete - Almost There!
            {
                name: "🚗 Car Down Payment",
                goalAmount: 20000,
                amountSaved: 15000,
                monthlyAllocation: 1000,
                dueDate: nextMonth,
                financialAccountId,
                autoAllocationEnabled: true,
            },

            // 5. EDGE CASE: 100% Complete - EXACTLY Achieved
            {
                name: "✅ Wedding Fund (Achieved!)",
                goalAmount: 15000,
                amountSaved: 15000,
                monthlyAllocation: 0,
                dueDate: tomorrow,
                financialAccountId,
                autoAllocationEnabled: false,
            },

            // 6. EDGE CASE: Over 100% - Over-Achieved!
            {
                name: "🎉 Savings Cushion (Over-Achieved)",
                goalAmount: 5000,
                amountSaved: 6500,
                monthlyAllocation: 0,
                dueDate: nextWeek,
                financialAccountId,
                autoAllocationEnabled: false,
            },

            // 7. EDGE CASE: Overdue + Not Achieved (RED FLAG!)
            {
                name: "⚠️ OVERDUE Tax Reserve",
                goalAmount: 12000,
                amountSaved: 4000,
                monthlyAllocation: 600,
                dueDate: lastWeek,
                financialAccountId,
                autoAllocationEnabled: true,
            },

            // 8. EDGE CASE: Overdue + Over-Achieved (Strange but possible)
            {
                name: "🤔 Overdue but Over-Saved",
                goalAmount: 3000,
                amountSaved: 3500,
                monthlyAllocation: 0,
                dueDate: lastMonth,
                financialAccountId,
                autoAllocationEnabled: false,
            },

            // 9. EDGE CASE: No Due Date (Null)
            {
                name: "♾️ Long-Term Retirement",
                goalAmount: 100000,
                amountSaved: 25000,
                monthlyAllocation: 800,
                dueDate: null,
                financialAccountId,
                autoAllocationEnabled: true,
            },

            // 10. EDGE CASE: No Monthly Allocation (Manual only)
            {
                name: "🎯 Gift Fund (Manual)",
                goalAmount: 2000,
                amountSaved: 800,
                monthlyAllocation: 0,
                dueDate: nextMonth,
                financialAccountId,
                autoAllocationEnabled: false,
            },

            // 11. EDGE CASE: No Account Link (NULL financialAccountId)
            {
                name: "💰 General Savings (No Account)",
                goalAmount: 7500,
                amountSaved: 3200,
                monthlyAllocation: 300,
                dueDate: nextMonth,
                financialAccountId: null,
                autoAllocationEnabled: false,
            },

            // 12. EDGE CASE: Low Amount Goal
            {
                name: "🍕 Pizza Party Fund",
                goalAmount: 100,
                amountSaved: 75,
                monthlyAllocation: 10,
                dueDate: nextWeek,
                financialAccountId,
                autoAllocationEnabled: true,
            },

            // 13. EDGE CASE: Huge Amount Goal
            {
                name: "🏡 House Down Payment",
                goalAmount: 250000,
                amountSaved: 87500,
                monthlyAllocation: 2500,
                dueDate: null,
                financialAccountId,
                autoAllocationEnabled: true,
            },

            // 14. EDGE CASE: 99.9% Complete - So Close!
            {
                name: "😓 Almost There - Christmas Fund",
                goalAmount: 5000,
                amountSaved: 4995,
                monthlyAllocation: 100,
                dueDate: nextWeek,
                financialAccountId,
                autoAllocationEnabled: true,
            },

            // 15. EDGE CASE: 1% Complete - Barely Started
            {
                name: "🌱 Just Started - College Fund",
                goalAmount: 50000,
                amountSaved: 500,
                monthlyAllocation: 400,
                dueDate: null,
                financialAccountId,
                autoAllocationEnabled: true,
            },
        ];

        for (const goal of goalsToCreate) {
            await db.insert(savingGoals).values({
                hubId: HUB_ID,
                userId,
                name: goal.name,
                goalAmount: goal.goalAmount,
                amountSaved: goal.amountSaved,
                monthlyAllocation: goal.monthlyAllocation,
                dueDate: goal.dueDate,
                financialAccountId: goal.financialAccountId,
                autoAllocationEnabled: goal.autoAllocationEnabled,
            });

            const percentage = ((goal.amountSaved / goal.goalAmount) * 100).toFixed(1);
            const status = goal.dueDate && new Date(goal.dueDate) < today ? "⏰ OVERDUE" : "✅";
            console.log(`  ${status} ${goal.name}`);
            console.log(`     💰 CHF ${goal.amountSaved.toLocaleString()} / CHF ${goal.goalAmount.toLocaleString()} (${percentage}%)`);
        }

        console.log(`\n✅ Created ${goalsToCreate.length} savings goals!\n`);
        console.log(`📊 Summary:`);
        console.log(`   - 0% complete: 1`);
        console.log(`   - In Progress (1-99%): 9`);
        console.log(`   - 100% achieved: 1`);
        console.log(`   - Over 100%: 2`);
        console.log(`   - Overdue: 2`);
        console.log(`   - No due date: 3`);
        console.log(`   - No monthly allocation: 2`);
        console.log(`   - No account link: 1`);
        console.log(`\n🎉 Seeding complete!`);

    } catch (error: any) {
        console.error("\n❌ Error seeding savings goals:", error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seedSavingGoals();
