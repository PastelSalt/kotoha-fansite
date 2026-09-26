// Applies db/migrations/*.sql in filename order, each in its own transaction.
// Usage: npm run db:migrate      (apply pending)
//        npm run db:status       (list applied / pending)
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPool, inTransaction } from './_db.js';

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');
const statusOnly = process.argv.includes('--status');

const pool = openPool();

try {
  await pool.query(`
    create table if not exists schema_migrations (
      name        text primary key,
      applied_at  timestamptz not null default now()
    )`);

  const { rows } = await pool.query('select name, applied_at from schema_migrations order by name');
  const applied = new Map(rows.map((r) => [r.name, r.applied_at]));
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  const pending = files.filter((f) => !applied.has(f));

  if (statusOnly) {
    for (const f of files) {
      const at = applied.get(f);
      console.log(`${at ? 'applied ' : 'PENDING '} ${f}${at ? `  (${new Date(at).toISOString()})` : ''}`);
    }
    if (!files.length) console.log('No migration files found.');
  } else if (!pending.length) {
    console.log('Database is up to date.');
  } else {
    for (const f of pending) {
      const sql = await readFile(path.join(migrationsDir, f), 'utf8');
      await inTransaction(pool, async (client) => {
        await client.query(sql);
        await client.query('insert into schema_migrations (name) values ($1)', [f]);
      });
      console.log(`applied  ${f}`);
    }
  }
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
