import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { users, subscriptions } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function updateSubscription() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL environment variable is not set");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    const email = "ahsan69999@gmail.com";
    const newPlan = "family";

    try {
        console.log(`Updating plan for ${email} to ${newPlan}...`);

        // 1. Find user
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            return;
        }

        console.log(`Found user: ${user.name} (ID: ${user.id})`);

        // 2. Check if subscription exists
        const subscription = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.userId, user.id),
        });

        if (subscription) {
            // Update existing subscription
            await db
                .update(subscriptions)
                .set({
                    subscriptionPlan: newPlan,
                    status: "active",
                    updatedAt: new Date(),
                })
                .where(eq(subscriptions.userId, user.id));
            console.log(`Successfully updated plan to ${newPlan} for user ${user.id}`);
        } else {
            // Create new subscription entry
            await db.insert(subscriptions).values({
                userId: user.id,
                subscriptionPlan: newPlan,
                status: "active",
                stripeSubscriptionId: `mock_sub_${Date.now()}`,
                stripeCustomerId: user.stripeCustomerId || `mock_cus_${Date.now()}`,
                stripePriceId: "mock_price_id",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            });
            console.log(`No existing subscription found. Created a new ${newPlan} subscription for user ${user.id}`);
        }
    } catch (err) {
        console.error("Error updating subscription:", err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

updateSubscription();
