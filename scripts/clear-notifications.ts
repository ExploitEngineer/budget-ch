import db from "../src/db/db";
import { notifications } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function clear() {
    try {
        console.log("Cleaning budget notifications...");
        const res = await db.delete(notifications).where(sql`metadata->>'budgetId' IS NOT NULL`);
        console.log("Cleaned!");
    } catch (err) {
        console.error("Error cleaning notifications:", err);
    } finally {
        process.exit(0);
    }
}

clear();
