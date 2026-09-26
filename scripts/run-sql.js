// Runs one SQL file inside a single transaction (used for db/seed.sql).
// Usage: node --env-file=.env.local scripts/run-sql.js db/seed.sql
import { readFile } from 'node:fs/promises';
import { openPool, inTransaction } from './_db.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node --env-file=.env.local scripts/run-sql.js <file.sql>');
  process.exit(1);
}

const pool = openPool();
try {
  const sql = await readFile(file, 'utf8');
  await inTransaction(pool, (client) => client.query(sql));
  console.log(`OK  ${file}`);
} catch (err) {
  console.error(`Failed  ${file}:`, err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
