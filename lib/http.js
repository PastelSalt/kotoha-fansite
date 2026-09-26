// Small helpers for Vercel Node functions using the plain (req, res) signature.

export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(data === undefined ? '' : JSON.stringify(data));
}

export function sendError(res, status, code, message, fields) {
  send(res, status, { error: { code, message: message || code, ...(fields ? { fields } : {}) } }, {
    'Cache-Control': 'no-store',
  });
}

export function requestUrl(req) {
  return new URL(req.url, 'http://localhost');
}

/**
 * Sub-route inside a grouped function. Works both with the vercel.json rewrite
 * (`/api/public?__route=news`) and with a direct path (`/api/public/news`).
 */
export function routeOf(req, group) {
  const url = requestUrl(req);
  const fromQuery = url.searchParams.get('__route');
  if (fromQuery !== null) return fromQuery.replace(/^\/+|\/+$/g, '');
  const prefix = `/api/${group}`;
  return url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '') : '';
}

export async function readJson(req, limitBytes = 32 * 1024) {
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body; // already parsed by the platform
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '0.0.0.0';
}

/** Rejects cross-site state-changing requests (CSRF defence alongside SameSite=Strict cookies). */
export function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) throw new HttpError(403, 'ORIGIN_REQUIRED', 'Missing Origin header');
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'BAD_ORIGIN', 'Invalid Origin header');
  }
  const allowed = new Set(
    [req.headers['x-forwarded-host'], req.headers.host, process.env.VERCEL_URL]
      .concat((process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim().replace(/^https?:\/\//, '')))
      .filter(Boolean),
  );
  if (!allowed.has(originHost)) throw new HttpError(403, 'CROSS_ORIGIN', 'Cross-origin request rejected');
}

/** Wraps a handler: converts HttpError to JSON errors and hides unexpected errors. */
export function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof HttpError) return sendError(res, err.status, err.code, err.message, err.fields);
      console.error('[api] unexpected error:', err);
      return sendError(res, 500, 'SERVER_ERROR', 'Something went wrong');
    }
  };
}

export function methodGuard(req, allowed) {
  if (!allowed.includes(req.method)) {
    throw new HttpError(405, 'METHOD_NOT_ALLOWED', `Use ${allowed.join(' or ')}`);
  }
}

// Cache helpers: public reads are cached at Vercel's edge for 60 s and may be served stale for up to a day
// while revalidating in the background. Neon's free compute sleeps after ~5 min idle and needs ~10 s to wake,
// so visitors get the cached copy instantly instead of waiting for the database.
export const PUBLIC_CACHE = { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400' };
export const NO_STORE = { 'Cache-Control': 'no-store' };
