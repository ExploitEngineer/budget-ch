import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, inArray } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

// Deletes all financial data for a specified user email
async function clearUserData(email: string) {
    console.log(`🔄 Starting data cleanup for user: ${email}...`);

    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema });

    try {
        // 1. Find user
        const user = await db.query.users.findFirst({
            where: (u) => eq(u.email, email),
        });

        if (!user) {
            console.error(`❌ User with email ${email} not found.`);
            return;
        }

        console.log(`👤 Found user: ${user.name} (ID: ${user.id})`);

        // 2. Find all hubs user is part of
        const members = await db.query.hubMembers.findMany({
            where: (hm) => eq(hm.userId, user.id),
            columns: {
                hubId: true,
            }
        });

        const hubIds = members.map(m => m.hubId);

        if (hubIds.length === 0) {
            console.log('ℹ️ User is not a member of any hubs. Nothing to clear.');
            return;
        }

        console.log(`🏘️  Found ${hubIds.length} hubs. Clearing data...`);

        // 3. Delete data (Order matters if foreign keys are not all cascade, but they seem to be)
        // We use a transaction to be safe
        await db.transaction(async (tx) => {
            // Deleting in order that respects dependencies

            console.log('  🧨 Clearing transactions...');
            await tx.delete(schema.transactions).where(inArray(schema.transactions.hubId, hubIds));

            console.log('  🧨 Clearing recurring templates...');
            await tx.delete(schema.recurringTransactionTemplates).where(inArray(schema.recurringTransactionTemplates.hubId, hubIds));

            console.log('  🧨 Clearing budget instances...');
            // budgetInstances cascade from budgets, but let's be explicit if needed. 
            // Actually budgets has cascade to budgetInstances

            console.log('  🧨 Clearing budgets...');
            await tx.delete(schema.budgets).where(inArray(schema.budgets.hubId, hubIds));

            console.log('  🧨 Clearing saving goals...');
            await tx.delete(schema.savingGoals).where(inArray(schema.savingGoals.hubId, hubIds));

            console.log('  🧨 Clearing financial accounts...');
            await tx.delete(schema.financialAccounts).where(inArray(schema.financialAccounts.hubId, hubIds));

            console.log('  🧨 Clearing transaction categories...');
            await tx.delete(schema.transactionCategories).where(inArray(schema.transactionCategories.hubId, hubIds));

            console.log('  🧨 Clearing notifications...');
            await tx.delete(schema.notifications).where(inArray(schema.notifications.hubId, hubIds));

            console.log('  🧨 Clearing quick tasks...');
            await tx.delete(schema.quickTasks).where(inArray(schema.quickTasks.hubId, hubIds));
        });

        console.log(`✅ All data for ${email} has been cleared successfully!`);
        console.log('💡 User, Hubs, and Memberships are preserved.');

    } catch (error) {
        console.error('❌ Error clearing user data:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

const emailArg = process.argv[2];

if (!emailArg) {
    console.error('❌ Please provide an email address as an argument.');
    console.log('Usage: npx tsx scripts/clear-user-data.ts user@example.com');
    process.exit(1);
}

clearUserData(emailArg)
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
