import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as relations from './relations';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const sql = neon(process.env.DATABASE_URL);

// Run migration queries inline to ensure columns exist in Neon (CLI push is blocked by environment)
sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee numeric(10, 2) NOT NULL DEFAULT '0.00';`
  .catch(err => console.error("Inline migration for shipping_fee failed:", err));

sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS packing_fee numeric(10, 2) NOT NULL DEFAULT '0.00';`
  .catch(err => console.error("Inline migration for packing_fee failed:", err));

export const db = drizzle({ client: sql, schema: { ...schema, ...relations } });
