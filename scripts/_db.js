// Shared helper for command-line scripts (not deployed).
// Uses the direct (unpooled) connection so multi-statement SQL files run in one transaction.
import { Pool } from '@neondatabase/serverless';

export function openPool() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Missing DATABASE_URL_UNPOOLED / DATABASE_URL. Run scripts via npm (they load .env.local).');
    process.exit(1);
  }
  return new Pool({ connectionString });
}

export async function inTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
