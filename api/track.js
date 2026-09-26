// POST /api/track — first-party analytics beacon (cookieless). Always answers 204 so tracking can never
// break the page; bad events are dropped. Admins (session cookie present), bots and floods are ignored.
import { parseBeacon, insertEvents, rollupIfStale, visitorHash, environment, BOT_UA } from '../lib/analytics.js';
import { readJson, clientIp } from '../lib/http.js';

const WINDOW_MS = 5 * 60 * 1000;
const MAX_EVENTS_PER_WINDOW = 200;       // per visitor per function instance (best effort)
const buckets = new Map();

function overLimit(key, n) {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (now - b.start > WINDOW_MS) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || now - b.start > WINDOW_MS) { buckets.set(key, { start: now, count: n }); return false; }
  b.count += n;
  return b.count > MAX_EVENTS_PER_WINDOW;
}

function done(res) {
  res.statusCode = 204;
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

async function readBeacon(req) {
  // sendBeacon posts a string as text/plain; the platform may hand it over parsed, as a string or as a stream.
  const body = req.body;
  if (typeof body === 'string') return JSON.parse(body);
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString('utf8'));
  return readJson(req, 16 * 1024);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end();
  }
  try {
    const ua = String(req.headers['user-agent'] || '');
    const cookies = String(req.headers.cookie || '');
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
    const origin = req.headers.origin;
    if (!ua || BOT_UA.test(ua) || /(?:^|;\s*)(?:__Host-kf_session|kf_session_dev)=/.test(cookies)) return done(res);
    if (origin && new URL(origin).host !== host) return done(res);

    const ip = clientIp(req);
    const vh = visitorHash(ip, ua);
    const rows = parseBeacon(await readBeacon(req), {
      ua,
      visitorHash: vh,
      country: req.headers['x-vercel-ip-country'],
      environment: environment(),
      ownHost: host.split(':')[0],
    });
    if (!rows.length || overLimit(vh, rows.length)) return done(res);
    await insertEvents(rows);
    // Roll finished JST days into daily totals (once per instance per day; a no-op otherwise). Done before
    // answering because the platform may freeze the function after the response; the beacon doesn't wait anyway.
    await rollupIfStale().catch((err) => console.error('[track] rollup failed:', err));
    done(res);
  } catch (err) {
    if (!res.writableEnded) done(res);
    if (!(err instanceof SyntaxError)) console.error('[track] error:', err);
  }
}
