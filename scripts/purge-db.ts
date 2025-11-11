import 'dotenv/config';

import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

// Clears all data, tables and indexes from the database
async function purgeDatabase() {
  console.log('🔄 Starting database purge...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    // Get all tables from the schema
    const tablesSchema = db._.schema;
    if (!tablesSchema) {
      throw new Error('Schema not loaded');
    }

    console.log('🗑️  Truncating all tables...');

    // Use TRUNCATE with CASCADE to clear all data and handle foreign key constraints
    await db.transaction(async (trx) => {
      // Disable foreign key checks temporarily for faster truncation
      await trx.execute(sql`SET session_replication_role = 'replica';`);

      for (const table of Object.values(tablesSchema)) {
        const tableName = table.dbName;
        console.log(`  🧨 Truncating table: ${tableName}`);
        await trx.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE;`));
      }

      // Re-enable foreign key checks
      await trx.execute(sql`SET session_replication_role = 'origin';`);
    });

    // Drop all enums
    console.log('🗑️  Dropping all enums...');
    
    await db.execute(sql`
      DROP TYPE IF EXISTS budgets_type CASCADE;
      DROP TYPE IF EXISTS account_type CASCADE;
      DROP TYPE IF EXISTS transaction_type CASCADE;
      DROP TYPE IF EXISTS access_role CASCADE;
    `);

    // Drop the drizzle migrations table if it exists
    console.log('🗑️  Dropping migrations table...');
    
    await db.execute(sql`
      DROP TABLE IF EXISTS __drizzle_migrations CASCADE;
    `);

    console.log('✅ Database purged successfully!');
    console.log('💡 Run "pnpm db:push" to recreate the schema.');
    
  } catch (error) {
    console.error('❌ Error purging database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

purgeDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

