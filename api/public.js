// Public read-only API: /api/public/{home,geo,videos,news,achievements,discography,gallery}
import { query } from '../lib/db.js';
import { handle, methodGuard, routeOf, requestUrl, send, HttpError, PUBLIC_CACHE, NO_STORE } from '../lib/http.js';
import { parseLimit, decodeCursor, page } from '../lib/paging.js';

const mapVideo = (r) => ({ id: Number(r.id), youtubeId: r.youtube_id, title: r.title, postedOn: r.posted_on });
const mapNews = (r) => ({
  id: Number(r.id),
  postedOn: r.posted_on,
  headline: r.headline,
  summary: r.summary,
  links: (r.links || []).map((l) => ({ url: l.url, labelKey: l.label_key })),
});
const mapAchievement = (r) => ({ id: Number(r.id), achievedOn: r.achieved_on, text: r.text, linkUrl: r.link_url });
const mapRelease = (r) => ({
  id: Number(r.id),
  title: r.title,
  releaseType: r.release_type,
  releasedOn: r.released_on,
  note: r.note,
  youtubeId: r.youtube_id,
  links: (r.links || []).map((l) => ({ url: l.url, labelKey: l.label_key })),
});
const mapImage = (r) => ({
  id: Number(r.id),
  publicId: r.cloudinary_public_id,
  version: Number(r.cloudinary_version),
  url: r.secure_url,
  width: r.width,
  height: r.height,
  authorName: r.author_name,
  sourceUrl: r.source_url,
  createdAt: r.created_at,
});

// Each list: table, date/timestamp sort column, selected columns, mapper.
const LISTS = {
  videos: {
    kind: 'date',
    sql: `select id, youtube_id, title, to_char(posted_on, 'YYYY-MM-DD') as posted_on
            from videos where status = 'published' and ($1::date is null or (posted_on, id) < ($1::date, $2::bigint))
           order by posted_on desc, id desc limit $3`,
    key: (r) => r.posted_on,
    map: mapVideo,
  },
  news: {
    kind: 'date',
    sql: `select id, to_char(posted_on, 'YYYY-MM-DD') as posted_on, headline, summary, links
            from news where status = 'published' and ($1::date is null or (posted_on, id) < ($1::date, $2::bigint))
           order by posted_on desc, id desc limit $3`,
    key: (r) => r.posted_on,
    map: mapNews,
  },
  achievements: {
    kind: 'date',
    sql: `select id, to_char(achieved_on, 'YYYY-MM-DD') as achieved_on, text, link_url
            from achievements where status = 'published' and ($1::date is null or (achieved_on, id) < ($1::date, $2::bigint))
           order by achieved_on desc, id desc limit $3`,
    key: (r) => r.achieved_on,
    map: mapAchievement,
  },
  discography: {
    kind: 'date',
    sql: `select id, title, release_type, to_char(released_on, 'YYYY-MM-DD') as released_on, note, youtube_id, links
            from discography_items where status = 'published' and ($1::date is null or (released_on, id) < ($1::date, $2::bigint))
           order by released_on desc, id desc limit $3`,
    key: (r) => r.released_on,
    map: mapRelease,
  },
  gallery: {
    kind: 'timestamp',
    sql: `select id, cloudinary_public_id, cloudinary_version, secure_url, width, height, author_name, source_url,
                 to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as created_at
            from gallery_images where status = 'published'
             and ($1::timestamptz is null or (created_at, id) < ($1::timestamptz, $2::bigint))
           order by created_at desc, id desc limit $3`,
    key: (r) => r.created_at,
    map: mapImage,
  },
};

async function list(name, req, res) {
  const def = LISTS[name];
  const params = requestUrl(req).searchParams;
  const limit = parseLimit(params.get('limit'), name === 'gallery' ? 18 : 20);
  const cursor = decodeCursor(params.get('cursor'), def.kind);
  const rows = await query(def.sql, [cursor?.key ?? null, cursor?.id ?? null, limit + 1]);
  const { items, nextCursor } = page(rows, limit, def.key);
  send(res, 200, { items: items.map(def.map), nextCursor }, PUBLIC_CACHE);
}

async function home(req, res) {
  const [videos, news] = await Promise.all([
    query(LISTS.videos.sql, [null, null, 1]),
    query(LISTS.news.sql, [null, null, 2]),
  ]);
  send(res, 200, { video: videos[0] ? mapVideo(videos[0]) : null, news: news.map(mapNews) }, PUBLIC_CACHE);
}

// Country comes from Vercel's edge header; never cached because it differs per visitor.
function geo(req, res) {
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase() || null;
  send(res, 200, { country, lang: country === 'JP' ? 'ja' : 'en' }, NO_STORE);
}

export default handle(async (req, res) => {
  methodGuard(req, ['GET']);
  const route = routeOf(req, 'public');
  if (route === 'home') return home(req, res);
  if (route === 'geo') return geo(req, res);
  if (Object.hasOwn(LISTS, route)) return list(route, req, res);
  throw new HttpError(404, 'NOT_FOUND', 'Unknown endpoint');
});
