import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import { reset } from "drizzle-seed";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const db = drizzle(process.env.DATABASE_URL!);
  await reset(db, schema);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
