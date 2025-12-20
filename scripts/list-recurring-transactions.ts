import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { recurringTransactionTemplates } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

const TARGET_EMAIL = "ahsan69999@gmail.com";
const TARGET_HUB_ID = "bc29a94e-e14c-498b-9bcd-173b8a38011d";

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    try {
        console.log(`--- Fetching Recurring Transactions ---`);
        console.log(`User Email: ${TARGET_EMAIL}`);
        console.log(`Hub ID:     ${TARGET_HUB_ID}`);
        console.log("---------------------------------------\n");

        // 1. Get User
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, TARGET_EMAIL),
        });

        if (!user) {
            console.error(`Error: User with email ${TARGET_EMAIL} not found.`);
            return;
        }

        // 2. Fetch templates for this user and hub
        const templates = await db.query.recurringTransactionTemplates.findMany({
            where: (t, { eq, and }) => and(
                eq(t.userId, user.id),
                eq(t.hubId, TARGET_HUB_ID)
            ),
        });

        if (templates.length === 0) {
            console.log("No recurring transaction templates found for this user/hub combination.");
        } else {
            console.log(`Found ${templates.length} recurring template(s):\n`);
            templates.forEach((t, i) => {
                console.log(`${i + 1}. [${t.type.toUpperCase()}] ${t.source || "Unknown Source"}`);
                console.log(`   Amount:   CHF ${t.amount}`);
                console.log(`   Freq:     Every ${t.frequencyDays} days`);
                console.log(`   Starts:   ${t.startDate.toDateString()}`);
                console.log(`   Ends:     ${t.endDate ? t.endDate.toDateString() : "Never"}`);
                console.log(`   Status:   ${t.status}`);
                console.log(`   ID:       ${t.id}`);
                console.log(`   Category: ${t.transactionCategoryId || "None"}`);
                console.log("   ---");
            });
        }

        // 3. Fetch templates for this HUB (just in case they belong to another user)
        console.log("\n--- Other templates in this HUB (all users) ---");
        const allHubTemplates = await db.query.recurringTransactionTemplates.findMany({
            where: (t, { eq, and, ne }) => and(
                eq(t.hubId, TARGET_HUB_ID),
                ne(t.userId, user.id)
            ),
        });

        if (allHubTemplates.length > 0) {
            allHubTemplates.forEach((t, i) => {
                console.log(`${i + 1}. [${t.type.toUpperCase()}] ${t.source || "Unknown Source"} (User ID: ${t.userId})`);
                console.log(`   Amount: CHF ${t.amount}`);
                console.log("   ---");
            });
        } else {
            console.log("No other users have recurring templates in this hub.");
        }

    } catch (err) {
        console.error("Script error:", err);
    } finally {
        await pool.end();
    }
}

main();
