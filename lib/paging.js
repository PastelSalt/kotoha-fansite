// Keyset (cursor) pagination helpers: newest first, stable on ties via id.
import { HttpError } from './http.js';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

export function parseLimit(value, fallback = DEFAULT_LIMIT) {
  const n = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, MAX_LIMIT);
}

export function encodeCursor(key, id) {
  return Buffer.from(`${key}|${id}`, 'utf8').toString('base64url');
}

/** Returns { key, id } or null. `kind` is 'date' (YYYY-MM-DD) or 'timestamp' (ISO). */
export function decodeCursor(cursor, kind) {
  if (!cursor) return null;
  let raw;
  try {
    raw = Buffer.from(String(cursor), 'base64url').toString('utf8');
  } catch {
    throw new HttpError(400, 'BAD_CURSOR', 'Invalid cursor');
  }
  const [key, idText] = raw.split('|');
  const id = Number.parseInt(idText, 10);
  const keyOk = kind === 'date' ? /^\d{4}-\d{2}-\d{2}$/.test(key) : !Number.isNaN(Date.parse(key));
  if (!keyOk || !Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, 'BAD_CURSOR', 'Invalid cursor');
  return { key, id };
}

/** Given rows fetched with limit+1, returns { items, nextCursor }. */
export function page(rows, limit, keyOf) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore && last ? encodeCursor(keyOf(last), last.id) : null };
}
