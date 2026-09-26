// Admin API client: JSON in/out, same-origin cookies, friendly error codes, "waking up" hint for slow calls.
import { t } from '../shared/i18n-core.js';

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

let onSlow = null;
let onUnauthenticated = null;
export const setSlowHandler = (fn) => { onSlow = fn; };
export const setUnauthenticatedHandler = (fn) => { onUnauthenticated = fn; };

export async function api(path, { method = 'GET', body } = {}) {
  const opts = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const slowTimer = setTimeout(() => onSlow?.(true), 2500);
  let res;
  try {
    res = await fetch(`/api/${path}`, opts);
  } catch {
    throw new ApiError(0, 'NETWORK', t('common.networkError'));
  } finally {
    clearTimeout(slowTimer);
    onSlow?.(false);
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const e = data?.error || {};
    const err = new ApiError(res.status, e.code || 'ERROR', e.message || t('common.error'), e.fields);
    if (err.code === 'UNAUTHENTICATED' && onUnauthenticated) onUnauthenticated();
    throw err;
  }
  return data;
}

/** Human-readable, translated message for an API error. */
export function errorText(err) {
  if (!err) return t('common.error');
  const key = `errors.${err.code}`;
  const translated = t(key);
  return translated !== key ? translated : (err.message || t('common.error'));
}
