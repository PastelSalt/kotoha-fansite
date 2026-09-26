// Neon over HTTP — one statement per call, or several in one non-interactive transaction.
import { neon, neonConfig } from '@neondatabase/serverless';

// Retry only when the connection itself could not be opened (the query never reached Neon), so a retry can
// never run a statement twice. Rescues flaky local networks; practically never triggers on Vercel.
const SAFE_TO_RETRY = new Set(['UND_ERR_CONNECT_TIMEOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']);
neonConfig.fetchFunction = async (url, init) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      if (attempt >= 3 || !SAFE_TO_RETRY.has(err?.cause?.code)) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
};

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
