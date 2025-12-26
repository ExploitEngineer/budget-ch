/**
 * Script to add test notifications for all notification types
 * Run with: npx tsx scripts/seed-test-notifications.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

const HUB_ID = "3988f642-fdee-4bbe-b633-1e4fb73779c2";

// Notification type configurations (same as config.ts)
const notificationConfigs = {
    BUDGET_THRESHOLD_80: (categoryName: string) => ({
        type: "warning" as const,
        title: "Budget Threshold Reached",
        message: `Your budget for "${categoryName}" has reached 80% of the allocated amount.`,
    }),
    BUDGET_THRESHOLD_100: (categoryName: string) => ({
        type: "error" as const,
        title: "Budget Exceeded",
        message: `Your budget for "${categoryName}" has been exceeded.`,
    }),
    SUBSCRIPTION_EXPIRING_3_DAYS: () => ({
        type: "warning" as const,
        title: "Subscription Expiring Soon",
        message: "Your subscription will expire in 3 days. Please renew to continue using all features.",
    }),
    SUBSCRIPTION_EXPIRING_1_DAY: () => ({
        type: "error" as const,
        title: "Subscription Expiring Tomorrow",
        message: "Your subscription will expire tomorrow. Please renew immediately to avoid service interruption.",
    }),
    SUBSCRIPTION_EXPIRED: () => ({
        type: "error" as const,
        title: "Subscription Expired",
        message: "Your subscription has expired. Please renew to restore access to all features.",
    }),
};

async function seedTestNotifications() {
    console.log("🔄 Seeding test notifications for hub:", HUB_ID);

    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema });

    try {
        const notificationsToSeed = [
            {
                ...notificationConfigs.BUDGET_THRESHOLD_80("Groceries"),
                hubId: HUB_ID,
                userId: null,
                channel: "both" as const,
                metadata: {
                    budgetId: "test-budget-1",
                    categoryName: "Groceries",
                    spentAmount: 400,
                    allocatedAmount: 500,
                },
                isRead: false,
                emailSent: false,
            },
            {
                ...notificationConfigs.BUDGET_THRESHOLD_100("Entertainment"),
                hubId: HUB_ID,
                userId: null,
                channel: "both" as const,
                metadata: {
                    budgetId: "test-budget-2",
                    categoryName: "Entertainment",
                    spentAmount: 250,
                    allocatedAmount: 200,
                },
                isRead: false,
                emailSent: false,
            },
            {
                ...notificationConfigs.SUBSCRIPTION_EXPIRING_3_DAYS(),
                hubId: HUB_ID,
                userId: null,
                channel: "both" as const,
                metadata: {
                    subscriptionId: "test-sub-1",
                    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    daysRemaining: 3,
                },
                isRead: false,
                emailSent: false,
            },
            {
                ...notificationConfigs.SUBSCRIPTION_EXPIRING_1_DAY(),
                hubId: HUB_ID,
                userId: null,
                channel: "both" as const,
                metadata: {
                    subscriptionId: "test-sub-2",
                    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                    daysRemaining: 1,
                },
                isRead: false,
                emailSent: false,
            },
            {
                ...notificationConfigs.SUBSCRIPTION_EXPIRED(),
                hubId: HUB_ID,
                userId: null,
                channel: "both" as const,
                metadata: {
                    subscriptionId: "test-sub-3",
                    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    daysRemaining: 0,
                },
                isRead: false,
                emailSent: false,
            },
        ];

        console.log("📝 Inserting notifications...");

        for (const notification of notificationsToSeed) {
            const [inserted] = await db
                .insert(schema.notifications)
                .values(notification)
                .returning({ id: schema.notifications.id, title: schema.notifications.title });

            console.log(`  ✅ Created: ${inserted.title}`);
        }

        console.log(`\n✅ Done! Created ${notificationsToSeed.length} test notifications.`);
    } catch (error) {
        console.error("❌ Error seeding notifications:", error);
        throw error;
    } finally {
        await pool.end();
    }
}

seedTestNotifications()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Script failed:", err);
        process.exit(1);
    });
