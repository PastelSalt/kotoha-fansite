// First-party, cookieless analytics: event validation, JST daily rollups and dashboard aggregation.
// Days/weeks/months are Japan time (Asia/Tokyo); weeks start on Monday. Only `production` traffic is counted.
import { createHash } from 'node:crypto';
import { sql, query } from './db.js';

export const EVENT_TYPES = new Set([
  'page_view', 'section_dwell', 'video_play', 'outbound_click', 'news_link_click',
  'gallery_open', 'gallery_credit_click', 'language_switch', 'loader_timing',
]);
const SECTIONS = new Set(['home', 'about', 'news', 'discography', 'gallery', 'footer']);
const CONTENT_TYPES = new Set(['video', 'news', 'achievement', 'discography', 'gallery', 'social']);
const DEVICES = new Set(['mobile', 'tablet', 'desktop']);
const RAW_RETENTION_DAYS = 90;
const MAX_DURATION_MS = 60 * 60 * 1000;          // one flush never reports more than an hour in a section

const JST_OFFSET_MS = 9 * 3600 * 1000;
export const jstDay = (date = new Date()) => new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
export const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
/** Start of a JST calendar day as a UTC instant. */
const jstStart = (day) => new Date(Date.parse(`${day}T00:00:00+09:00`));

export const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|curl|wget|python|node-fetch|axios|go-http/i;

export function environment() {
  const env = process.env.VERCEL_ENV;
  return env === 'production' || env === 'preview' ? env : 'development';
}

export function visitorHash(ip, ua) {
  const salt = process.env.ANALYTICS_SALT || (environment() === 'production' ? null : 'dev-salt');
  if (!salt) throw new Error('ANALYTICS_SALT is not set');
  return createHash('sha256').update(`${salt}|${jstDay()}|${ip}|${ua}`).digest('hex').slice(0, 32);
}

export function browserOf(ua) {
  if (/\bLine\//i.test(ua)) return 'LINE';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV/.test(ua)) return 'Facebook';
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/Firefox\/|FxiOS/.test(ua)) return 'Firefox';
  if (/CriOS|Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

export function deviceOf(ua, hint) {
  if (DEVICES.has(hint)) return hint;
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile';
  return ua ? 'desktop' : 'unknown';
}

function cleanHost(value, ownHost) {
  if (typeof value !== 'string' || !value) return null;
  const host = value.toLowerCase().replace(/^www\./, '').slice(0, 100);
  if (!/^[a-z0-9.-]+$/.test(host)) return null;
  if (ownHost && host === ownHost.toLowerCase().replace(/^www\./, '')) return null;
  return host;
}

const cleanTarget = (v) => (typeof v === 'string' && /^[a-z0-9_.:-]{1,60}$/i.test(v) ? v : null);
const cleanId = (v) => (Number.isSafeInteger(v) && v > 0 ? v : null);

/**
 * Turns one beacon payload into rows. Unknown or malformed events are dropped silently
 * (analytics must never break the page or throw at visitors).
 */
export function parseBeacon(body, ctx) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.e)) return [];
  const visitId = typeof body.v === 'string' && /^[a-z0-9-]{8,64}$/i.test(body.v) ? body.v : null;
  if (!visitId) return [];
  const lang = body.l === 'ja' || body.l === 'en' ? body.l : null;
  const base = {
    visitId,
    visitorHash: ctx.visitorHash,
    device: deviceOf(ctx.ua, body.d),
    browser: browserOf(ctx.ua),
    country: /^[A-Z]{2}$/.test(ctx.country || '') ? ctx.country : null,
    environment: ctx.environment,
  };
  const rows = [];
  for (const e of body.e.slice(0, 50)) {
    if (!e || typeof e !== 'object' || !EVENT_TYPES.has(e.t)) continue;
    const row = {
      ...base,
      type: e.t,
      section: SECTIONS.has(e.s) ? e.s : null,
      durationMs: Number.isInteger(e.ms) && e.ms >= 0 ? Math.min(e.ms, MAX_DURATION_MS) : null,
      contentType: CONTENT_TYPES.has(e.ct) ? e.ct : null,
      contentId: cleanId(e.id),
      target: cleanTarget(e.tg),
      language: e.l === 'ja' || e.l === 'en' ? e.l : lang,
      referrerHost: e.t === 'page_view' ? cleanHost(body.r, ctx.ownHost) : null,
    };
    if (row.type === 'section_dwell' && (!row.section || !row.durationMs)) continue;
    if (row.type === 'loader_timing' && row.durationMs === null) continue;
    rows.push(row);
  }
  return rows;
}

export async function insertEvents(rows) {
  if (!rows.length) return;
  const cols = ['event_type', 'visit_id', 'visitor_hash', 'section', 'duration_ms', 'content_type', 'content_id', 'target',
    'device_type', 'browser', 'language', 'country', 'referrer_host', 'environment'];
  const params = [];
  const tuples = rows.map((r) => {
    const values = [r.type, r.visitId, r.visitorHash, r.section, r.durationMs, r.contentType, r.contentId, r.target,
      r.device, r.browser, r.language, r.country, r.referrerHost, r.environment];
    const start = params.length;
    params.push(...values);
    return `(${values.map((_, i) => `$${start + i + 1}`).join(', ')})`;
  });
  await query(`insert into analytics_events (${cols.join(', ')}) values ${tuples.join(', ')}`, params);
}

// ---------------------------------------------------------------------------
// Aggregation: one query computes every dashboard metric per JST day for a time window.
// Used both to roll finished days into analytics_daily and to compute not-yet-rolled days live.
// ---------------------------------------------------------------------------
const AGGREGATE_SQL = `
with ev as (
  select *, (occurred_at at time zone 'Asia/Tokyo')::date as day
  from analytics_events
  where occurred_at >= $1 and occurred_at < $2 and environment = 'production'
),
pv as (select * from ev where event_type = 'page_view'),
dw as (select day, visit_id, section, sum(duration_ms)::bigint as ms from ev where event_type = 'section_dwell' group by 1, 2, 3),
vt as (select day, visit_id, sum(ms)::bigint as ms from dw group by 1, 2),
m (day, metric, dimension, value) as (
            select day, 'visits', '', count(distinct visit_id) from pv group by 1
  union all select day, 'uniques', '', count(distinct visitor_hash) from pv group by 1
  union all select day, 'page_views', '', count(*) from pv group by 1
  union all select day, 'device', device_type, count(*) from pv group by 1, 3
  union all select day, 'browser', coalesce(browser, 'Other'), count(*) from pv group by 1, 3
  union all select day, 'language', coalesce(language, '?'), count(*) from pv group by 1, 3
  union all select day, 'country', coalesce(country, '??'), count(*) from pv group by 1, 3
  union all select day, 'source', coalesce(referrer_host, ''), count(*) from pv group by 1, 3
  union all select day, 'hour', extract(hour from occurred_at at time zone 'Asia/Tokyo')::int::text, count(*) from pv group by 1, 3
  union all select day, 'lang_switch', coalesce(language, '?'), count(*) from ev where event_type = 'language_switch' group by 1, 3
  union all select day, 'dwell_ms', section, sum(ms)::bigint from dw group by 1, 3
  union all select day, 'reach', section, count(distinct visit_id) from dw group by 1, 3
  union all select day, 'visit_ms', '', sum(ms)::bigint from vt group by 1
  union all select day, 'visits_timed', '', count(*) from vt group by 1
  union all select day, 'video_play', coalesce(content_id::text, target, '?'), count(*) from ev where event_type = 'video_play' group by 1, 3
  union all select day, 'outbound', coalesce(target, '?'), count(*) from ev where event_type = 'outbound_click' group by 1, 3
  union all select day, 'news_link', coalesce(content_id::text, '?'), count(*) from ev where event_type = 'news_link_click' group by 1, 3
  union all select day, 'gallery_open', coalesce(content_id::text, '?'), count(*) from ev where event_type = 'gallery_open' group by 1, 3
  union all select day, 'gallery_credit', coalesce(content_id::text, '?'), count(*) from ev where event_type = 'gallery_credit_click' group by 1, 3
  union all select day, 'loader_ms', '', sum(duration_ms)::bigint from ev where event_type = 'loader_timing' group by 1
  union all select day, 'loader_n', '', count(*) from ev where event_type = 'loader_timing' group by 1
)`;

/** Live metrics for [fromDay, toDayExclusive) (JST days). Returns [{ day, metric, dimension, value }]. */
export async function aggregateLive(fromDay, toDayExclusive) {
  const rows = await query(`${AGGREGATE_SQL}
    select to_char(day, 'YYYY-MM-DD') as day, metric, dimension, value::bigint as value from m where value > 0`,
  [jstStart(fromDay), jstStart(toDayExclusive)]);
  return rows.map((r) => ({ ...r, value: Number(r.value) }));
}

/** Last JST day already rolled into analytics_daily (a '_rolled' marker row is written for every processed day). */
export async function lastRolledDay() {
  const [row] = await sql()`select to_char(max(day), 'YYYY-MM-DD') as day from analytics_daily where metric = '_rolled'`;
  return row?.day || null;
}

let rolledThisDay = null;   // per-instance memo: skip the check after a successful rollup today
let lastAttempt = 0;        // …and don't retry a failing rollup more than every 10 minutes

/**
 * Rolls every finished JST day (up to yesterday) into analytics_daily, then prunes raw events older than
 * 90 days and stale operational rows (expired sessions, old login attempts). Idempotent and safe to run
 * concurrently (upserts). Called lazily from the tracker and the dashboard — no cron needed.
 */
export async function rollupIfStale({ force = false } = {}) {
  const today = jstDay();
  if (!force && (rolledThisDay === today || Date.now() - lastAttempt < 10 * 60 * 1000)) return { skipped: true };
  lastAttempt = Date.now();
  const yesterday = addDays(today, -1);
  const last = await lastRolledDay();
  let from;
  if (last) from = addDays(last, 1);
  else {
    const [first] = await sql()`select to_char(min(occurred_at at time zone 'Asia/Tokyo'), 'YYYY-MM-DD') as day from analytics_events`;
    from = first?.day || today;
  }
  const s = sql();
  let rolled = 0;
  if (from <= yesterday) {
    const params = [jstStart(from), jstStart(today)];
    await s.transaction([
      s.query(`delete from analytics_daily where day >= $1::date and day < $2::date`, [from, today]),
      s.query(`${AGGREGATE_SQL}
        insert into analytics_daily (day, metric, dimension, value)
        select day, metric, dimension, value from m where value > 0
        on conflict (day, metric, dimension) do update set value = excluded.value`, params),
      s.query(`insert into analytics_daily (day, metric, dimension, value)
        select d::date, '_rolled', '', 1 from generate_series($1::date, $2::date, interval '1 day') as d
        on conflict (day, metric, dimension) do nothing`, [from, yesterday]),
    ]);
    rolled = Math.round((Date.parse(yesterday) - Date.parse(from)) / 86400000) + 1;
  }
  // Retention: raw events 90 days (their daily totals stay forever); operational rows 30 days.
  await s.transaction([
    s`delete from analytics_events where occurred_at < now() - make_interval(days => ${RAW_RETENTION_DAYS})
        and (occurred_at at time zone 'Asia/Tokyo')::date <= (select max(day) from analytics_daily where metric = '_rolled')`,
    s`delete from admin_sessions where expires_at < now() - interval '30 days' or revoked_at < now() - interval '30 days'`,
    s`delete from login_attempts where attempted_at < now() - interval '30 days'`,
  ]);
  rolledThisDay = today;
  return { rolled, from, to: yesterday };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
const mondayOf = (day) => {
  const d = new Date(`${day}T00:00:00Z`);
  return addDays(day, -((d.getUTCDay() + 6) % 7));
};

/** Daily metric rows for [fromDay, today]: rolled days from analytics_daily, the rest computed live. */
async function dailyRows(fromDay, today, metrics) {
  const last = await lastRolledDay();
  const liveFrom = last && last >= fromDay ? addDays(last, 1) : fromDay;
  const rolled = last && last >= fromDay
    ? (await sql()`select to_char(day, 'YYYY-MM-DD') as day, metric, dimension, value from analytics_daily
                   where day >= ${fromDay}::date and day <= ${last}::date and metric = any(${metrics})`)
      .map((r) => ({ ...r, value: Number(r.value) }))
    : [];
  const live = (await aggregateLive(liveFrom, addDays(today, 1))).filter((r) => metrics.includes(r.metric));
  return rolled.concat(live);
}

const BREAKDOWN_METRICS = ['visits', 'uniques', 'page_views', 'device', 'browser', 'language', 'lang_switch', 'country',
  'source', 'hour', 'dwell_ms', 'reach', 'visit_ms', 'visits_timed', 'video_play', 'outbound', 'news_link',
  'gallery_open', 'gallery_credit', 'loader_ms', 'loader_n'];

function sumBy(rows, metric) {
  const out = {};
  for (const r of rows) if (r.metric === metric) out[r.dimension] = (out[r.dimension] || 0) + r.value;
  return out;
}
const total = (rows, metric) => rows.reduce((s, r) => (r.metric === metric ? s + r.value : s), 0);
const top = (obj, n = 10) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, value]) => ({ key, value }));

async function names(table, column, ids) {
  const list = ids.map(Number).filter((n) => Number.isSafeInteger(n) && n > 0);
  if (!list.length) return {};
  const rows = await query(`select id, ${column} as name from ${table} where id = any($1)`, [list]);
  return Object.fromEntries(rows.map((r) => [String(r.id), r.name]));
}

/** Everything the dashboard shows. `rangeDays` applies to the breakdowns; the visit charts have fixed spans. */
export async function dashboard(rangeDays) {
  await rollupIfStale().catch((err) => console.error('[analytics] rollup failed:', err));
  const today = jstDay();
  const yearStart = addDays(today, -364);
  const series = await dailyRows(yearStart, today, ['visits', 'uniques', 'page_views']);
  const rangeFrom = addDays(today, -(rangeDays - 1));
  const rows = await dailyRows(rangeFrom, today, BREAKDOWN_METRICS);

  // Visits per day / week (Monday) / month, JST.
  const byDay = {};
  for (const r of series) {
    if (r.metric === 'page_views') continue;
    byDay[r.day] ??= { visits: 0, uniques: 0 };
    byDay[r.day][r.metric] += r.value;
  }
  const daily = [];
  for (let i = 29; i >= 0; i--) { const d = addDays(today, -i); daily.push({ key: d, ...(byDay[d] || { visits: 0, uniques: 0 }) }); }
  const weekly = [];
  const thisMonday = mondayOf(today);
  for (let i = 11; i >= 0; i--) {
    const start = addDays(thisMonday, -7 * i);
    const w = { key: start, visits: 0, uniques: 0 };
    for (let k = 0; k < 7; k++) { const v = byDay[addDays(start, k)]; if (v) { w.visits += v.visits; w.uniques += v.uniques; } }
    weekly.push(w);
  }
  const monthly = [];
  const [y, m] = today.split('-').map(Number);
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m - 1 - i, 1));
    const key = dt.toISOString().slice(0, 7);
    const mo = { key, visits: 0, uniques: 0 };
    for (const [d, v] of Object.entries(byDay)) if (d.startsWith(key)) { mo.visits += v.visits; mo.uniques += v.uniques; }
    monthly.push(mo);
  }
  const sumSince = (from) => Object.entries(byDay).reduce((acc, [d, v]) => {
    if (d >= from) { acc.visits += v.visits; acc.uniques += v.uniques; }
    return acc;
  }, { visits: 0, uniques: 0 });

  const visits = total(rows, 'visits');
  const dwell = sumBy(rows, 'dwell_ms');
  const reach = sumBy(rows, 'reach');
  const videoPlays = top(sumBy(rows, 'video_play'));
  const newsLinks = top(sumBy(rows, 'news_link'));
  const galleryOpens = sumBy(rows, 'gallery_open');
  const galleryCredits = sumBy(rows, 'gallery_credit');
  const galleryIds = [...new Set([...Object.keys(galleryOpens), ...Object.keys(galleryCredits)])];
  const [videoNames, newsNames, galleryNames] = await Promise.all([
    names('videos', 'title', videoPlays.map((v) => v.key)),
    names('news', 'headline', newsLinks.map((v) => v.key)),
    names('gallery_images', 'author_name', galleryIds),
  ]);
  const gallery = galleryIds
    .map((id) => ({ key: id, name: galleryNames[id] || null, opens: galleryOpens[id] || 0, creditClicks: galleryCredits[id] || 0 }))
    .sort((a, b) => b.opens - a.opens || b.creditClicks - a.creditClicks).slice(0, 10);
  const timed = total(rows, 'visits_timed');
  const hours = sumBy(rows, 'hour');
  const loaderN = total(rows, 'loader_n');

  return {
    today,
    rangeDays,
    kpis: {
      today: sumSince(today),
      week: sumSince(thisMonday),
      month: sumSince(`${today.slice(0, 7)}-01`),
      range: { visits, uniques: total(rows, 'uniques'), pageViews: total(rows, 'page_views') },
      avgVisitMs: timed ? Math.round(total(rows, 'visit_ms') / timed) : null,
      avgLoaderMs: loaderN ? Math.round(total(rows, 'loader_ms') / loaderN) : null,
    },
    series: { daily, weekly, monthly },
    sections: ['home', 'about', 'news', 'discography', 'gallery', 'footer'].map((s) => ({
      key: s,
      avgMs: reach[s] ? Math.round((dwell[s] || 0) / reach[s]) : 0,
      reach: reach[s] || 0,
      reachPct: timed ? Math.round(((reach[s] || 0) / timed) * 100) : 0,
    })),
    devices: top(sumBy(rows, 'device')),
    browsers: top(sumBy(rows, 'browser')),
    languages: top(sumBy(rows, 'language')),
    langSwitches: top(sumBy(rows, 'lang_switch')),
    countries: top(sumBy(rows, 'country'), 12),
    sources: top(sumBy(rows, 'source'), 12),
    hours: Array.from({ length: 24 }, (_, h) => ({ key: String(h), value: hours[String(h)] || 0 })),
    videoPlays: videoPlays.map((v) => ({ ...v, name: videoNames[v.key] || null })),
    outbound: top(sumBy(rows, 'outbound')),
    newsLinks: newsLinks.map((v) => ({ ...v, name: newsNames[v.key] || null })),
    gallery,
  };
}
