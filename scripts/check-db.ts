import db from "../src/db/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        console.log("Listing all tables in the database...");
        const res = await db.execute(sql`
      SELECT tablename, schemaname 
      FROM pg_catalog.pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
    `);
        console.log("Tables found:");
        res.rows.forEach(row => console.log(`- ${row.schemaname}.${row.tablename}`));

        console.log("\nChecking columns for 'hubs'...");
        const colRes = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'hubs'
    `);
        if (colRes.rows.length === 0) {
            console.log("No columns found for table 'hubs' (Check if the table exists or if case matters).");
        } else {
            colRes.rows.forEach(row => console.log(`  - ${row.column_name} (${row.data_type})`));
        }
    } catch (err) {
        console.error("Error diagnostic:", err);
    } finally {
        process.exit(0);
    }
}

check();
