
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debugAuth() {
    console.log("--- Auth Debugger Script ---");

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const db = drizzle(pool, { schema });

    const testEmail = 'abbasiahsan699@gmail.com';

    console.log(`\n1. Checking User table for: ${testEmail}`);
    const user = await db.query.users.findFirst({
        where: eq(sql`lower(${schema.users.email})`, testEmail.toLowerCase()),
    });

    if (!user) {
        console.log("❌ User NOT found in database.");
        // Check without lower just in case
        const userExact = await db.query.users.findFirst({
            where: eq(schema.users.email, testEmail),
        });
        if (userExact) {
            console.log("⚠️ User found with EXACT match but LOWER test failed? This should not happen.");
        }
    } else {
        console.log("✅ User found:");
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Verified: ${user.emailVerified}`);
        console.log(`   - Stripe ID: ${user.stripeCustomerId}`);
    }

    console.log(`\n2. Checking Accounts table (for password/credentials)`);
    if (user) {
        const accounts = await db.select().from(schema.accounts).where(eq(schema.accounts.userId, user.id));
        if (accounts.length === 0) {
            console.log("❌ No account record found for this user. This is why sign-in says 'account not found'.");
        } else {
            accounts.forEach(acc => {
                console.log(`✅ Account found: Provider=${acc.providerId}, HasPassword=${!!acc.password}`);
            });
        }
    }

    console.log(`\n3. Checking Verifications table`);
    const verification = await db.select().from(schema.verifications).where(eq(schema.verifications.identifier, testEmail));
    if (verification.length === 0) {
        console.log("❌ No verification tokens found for this email.");
    } else {
        console.log(`✅ Found ${verification.length} verification records.`);
        verification.forEach(v => {
            console.log(`   - Expires: ${v.expiresAt} (Past? ${v.expiresAt < new Date()})`);
        });
    }

    console.log(`\n4. Testing SMTP Mailer Connection`);
    const mailer = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    try {
        await mailer.verify();
        console.log("✅ SMTP connection verified successfully.");
    } catch (err) {
        console.log("❌ SMTP connection FAILED.");
        console.error(err);
    }

    await pool.end();
}

debugAuth().catch(console.error);
