import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

/**
 * Completely deletes a user and ALL their data from the database.
 * This includes:
 * - Sessions, accounts (auth), verifications, twoFactor
 * - Hubs (and all hub-related data via cascade)
 * - Subscriptions, userSettings
 * - The user record itself
 */
async function deleteUser(email: string) {
    console.log(`🔄 Starting COMPLETE user deletion for: ${email}...`);
    console.log('⚠️  WARNING: This will permanently delete ALL user data!\n');

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
        console.log(`📧 Email: ${user.email}`);
        console.log(`🆔 Stripe Customer ID: ${user.stripeCustomerId || 'None'}`);

        // 2. Delete in transaction
        await db.transaction(async (tx) => {
            // Delete sessions (cascade might handle this but let's be explicit)
            console.log('  🔐 Deleting sessions...');
            await tx.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));

            // Delete accounts (auth providers - Google, etc.)
            console.log('  🔑 Deleting auth accounts...');
            await tx.delete(schema.accounts).where(eq(schema.accounts.userId, user.id));

            // Delete two-factor settings
            console.log('  🔒 Deleting two-factor settings...');
            await tx.delete(schema.twoFactor).where(eq(schema.twoFactor.userId, user.id));

            // Delete verifications related to user's email
            console.log('  ✉️  Deleting verifications...');
            await tx.delete(schema.verifications).where(eq(schema.verifications.identifier, user.email));

            // Delete subscriptions
            console.log('  💳 Deleting subscriptions...');
            await tx.delete(schema.subscriptions).where(eq(schema.subscriptions.userId, user.id));

            // Delete user settings
            console.log('  ⚙️  Deleting user settings...');
            await tx.delete(schema.userSettings).where(eq(schema.userSettings.userId, user.id));

            // Delete hub memberships (will cascade to hubs if user is owner)
            console.log('  👥 Deleting hub memberships...');
            await tx.delete(schema.hubMembers).where(eq(schema.hubMembers.userId, user.id));

            // Delete hubs owned by user (cascades to all hub data)
            console.log('  🏠 Deleting owned hubs (cascades to all hub data)...');
            await tx.delete(schema.hubs).where(eq(schema.hubs.userId, user.id));

            // Finally, delete the user
            console.log('  👤 Deleting user record...');
            await tx.delete(schema.users).where(eq(schema.users.id, user.id));
        });

        console.log(`\n✅ User ${email} and ALL their data have been PERMANENTLY deleted!`);
        console.log('\n💡 Note: If user had a Stripe subscription, you may want to cancel it manually in Stripe dashboard.');

    } catch (error) {
        console.error('❌ Error deleting user:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

const emailArg = process.argv[2];

if (!emailArg) {
    console.error('❌ Please provide an email address as an argument.');
    console.log('Usage: npx tsx scripts/delete-user.ts user@example.com');
    process.exit(1);
}

// Confirmation prompt
console.log('\n⚠️  DANGER: This will PERMANENTLY delete the user and ALL their data!');
console.log(`   Email: ${emailArg}`);
console.log('\nProceeding in 3 seconds... Press Ctrl+C to cancel.\n');

setTimeout(() => {
    deleteUser(emailArg)
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}, 3000);
