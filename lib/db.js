// Neon over HTTP — one statement per call, or several in one non-interactive transaction.
import { neon } from '@neondatabase/serverless';

let client;

/** Tagged-template SQL client: sql`select … where id = ${id}` (always parameterized). */
export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    client = neon(url);
  }
  return client;
}

/** Dynamic query with positional parameters: query('select … where id = $1', [id]). */
export function query(text, params = []) {
  return sql().query(text, params);
}

/** Runs several queries atomically. Pass functions (s) => s`…` so they share the same client. */
export function transaction(build) {
  const s = sql();
  return s.transaction((txn) => build(txn));
}
