import 'dotenv/config';

import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

async function resetDatabase() {
  console.log('🔄 Starting database reset...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    const tablesSchema = db._.schema;
    if (!tablesSchema) {
      throw new Error('Schema not loaded');
    }

    console.log('🧹 Clearing data from all tables...');

    await db.transaction(async (trx) => {
      await trx.execute(sql`SET session_replication_role = 'replica';`);

      for (const table of Object.values(tablesSchema)) {
        const tableName = table.dbName;
        console.log(`  ✨ Truncating table: ${tableName}`);
        await trx.execute(
          sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`),
        );
      }

      await trx.execute(sql`SET session_replication_role = 'origin';`);
    });

    console.log('✅ Database reset complete!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

resetDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
