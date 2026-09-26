// Admin API (session required; accounts: Owner only). Routes: /api/admin/<resource>[/<id>[/<action>]]
//   videos | news | achievements | discography   GET list · POST create · GET/PATCH/DELETE :id (DELETE = archive)
//   videos/lookup                                 POST { url } → YouTube title/thumbnail
//   gallery                                       GET list · POST register upload · PATCH/DELETE :id · POST gallery/sign
//   archive                                       GET list · POST :id/restore
//   activity                                      GET list
//   summary · analytics?range=7|30|90|365         GET dashboard counts · visitor statistics (JST)
//   accounts (Owner)                              GET list · POST create · POST :id/reset-password · DELETE :id
import { sql, query } from '../lib/db.js';
import {
  handle, routeOf, requestUrl, readJson, send, assertSameOrigin, methodGuard, HttpError, NO_STORE,
} from '../lib/http.js';
import { requireAdmin, requireOwner, revokeAllSessions, logActivity } from '../lib/auth.js';
import { validator, parseId, parseYouTubeId, STATUSES, RELEASE_TYPES } from '../lib/validate.js';
import { parseLimit, decodeCursor, page } from '../lib/paging.js';
import { archiveRow, archiveAccountSnapshot, restoreArchived, SECTIONS } from '../lib/archive.js';
import { hashPassword, generateTempPassword } from '../lib/password.js';
import {
  signedUploadParams, verifyUploadResponse, getResource, destroyImage, ALLOWED_FORMATS,
} from '../lib/cloudinary.js';
import { dashboard } from '../lib/analytics.js';

const todayJst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const TEMP_PASSWORD_DAYS = 7;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// ---------------------------------------------------------------------------
// YouTube oEmbed (no API key): validates the video and returns its original title
// ---------------------------------------------------------------------------
async function youtubeLookup(youtubeId) {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  } catch {
    return null; // network problem: caller decides
  }
  if (!res.ok) return { missing: true };
  const j = await res.json();
  return {
    youtubeId,
    title: String(j.title || '').slice(0, 200),
    authorName: j.author_name || null,
    thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
  };
}

// ---------------------------------------------------------------------------
// Content resources (single-field text, shown as typed in both languages)
// ---------------------------------------------------------------------------
const linkOut = (links) => (links || []).map((l) => ({ url: l.url, labelKey: l.label_key }));

const CONTENT = {
  videos: {
    table: 'videos',
    dateCol: 'posted_on',
    select: `id, youtube_id, title, to_char(posted_on, 'YYYY-MM-DD') as posted_on, status, published_at, created_at, updated_at`,
    fields: [
      { key: 'youtube', col: 'youtube_id', type: 'youtubeId', required: true },
      { key: 'title', col: 'title', type: 'text', max: 200, required: true },
      { key: 'postedOn', col: 'posted_on', type: 'date', default: todayJst },
      { key: 'status', col: 'status', type: 'status' },
    ],
    map: (r) => ({
      id: Number(r.id), youtubeId: r.youtube_id, title: r.title, postedOn: r.posted_on, status: r.status,
      publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at,
    }),
    label: (r) => r.title,
  },
  news: {
    table: 'news',
    dateCol: 'posted_on',
    select: `id, to_char(posted_on, 'YYYY-MM-DD') as posted_on, headline, summary, links, status, published_at, created_at, updated_at`,
    fields: [
      { key: 'postedOn', col: 'posted_on', type: 'date', default: todayJst },
      { key: 'headline', col: 'headline', type: 'text', max: 200, required: true },
      { key: 'summary', col: 'summary', type: 'text', max: 500, required: true },
      { key: 'links', col: 'links', type: 'links' },
      { key: 'status', col: 'status', type: 'status' },
    ],
    map: (r) => ({
      id: Number(r.id), postedOn: r.posted_on, headline: r.headline, summary: r.summary, links: linkOut(r.links),
      status: r.status, publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at,
    }),
    label: (r) => r.headline,
  },
  achievements: {
    table: 'achievements',
    dateCol: 'achieved_on',
    select: `id, to_char(achieved_on, 'YYYY-MM-DD') as achieved_on, text, link_url, status, published_at, created_at, updated_at`,
    fields: [
      { key: 'achievedOn', col: 'achieved_on', type: 'date', required: true },
      { key: 'text', col: 'text', type: 'text', max: 500, required: true },
      { key: 'linkUrl', col: 'link_url', type: 'url' },
      { key: 'status', col: 'status', type: 'status' },
    ],
    map: (r) => ({
      id: Number(r.id), achievedOn: r.achieved_on, text: r.text, linkUrl: r.link_url, status: r.status,
      publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at,
    }),
    label: (r) => r.text,
  },
  discography: {
    table: 'discography_items',
    dateCol: 'released_on',
    select: `id, title, release_type, to_char(released_on, 'YYYY-MM-DD') as released_on, note, youtube_id, links,
             status, published_at, created_at, updated_at`,
    fields: [
      { key: 'title', col: 'title', type: 'text', max: 200, required: true },
      { key: 'releaseType', col: 'release_type', type: 'oneOf', allowed: RELEASE_TYPES, default: () => 'single' },
      { key: 'releasedOn', col: 'released_on', type: 'date', required: true },
      { key: 'note', col: 'note', type: 'text', max: 500 },
      { key: 'youtube', col: 'youtube_id', type: 'youtubeId' },
      { key: 'links', col: 'links', type: 'links' },
      { key: 'status', col: 'status', type: 'status' },
    ],
    map: (r) => ({
      id: Number(r.id), title: r.title, releaseType: r.release_type, releasedOn: r.released_on, note: r.note,
      youtubeId: r.youtube_id, links: linkOut(r.links), status: r.status,
      publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at,
    }),
    label: (r) => r.title,
  },
};

/** Validates body fields for create (all) or update (only those present). Returns { col: value }. */
function readFields(def, body, { partial }) {
  const v = validator(body);
  const values = {};
  for (const f of def.fields) {
    const present = v.has(f.key);
    if (partial && !present) continue;
    let value;
    switch (f.type) {
      case 'text': value = v.text(f.key, { required: f.required && !partial ? true : Boolean(f.required), max: f.max }); break;
      case 'date': value = v.date(f.key, { required: Boolean(f.required) && !(f.default && !present) }); break;
      case 'url': value = v.url(f.key, { required: false }); break;
      case 'oneOf': value = v.oneOf(f.key, f.allowed, { required: false, fallback: partial ? undefined : f.default?.() }); break;
      case 'status': value = v.oneOf(f.key, STATUSES, { required: false, fallback: partial ? undefined : 'draft' }); break;
      case 'youtubeId': value = v.youtubeId(f.key, { required: Boolean(f.required) }); break;
      case 'links': value = v.links(f.key); break;
      default: throw new Error(`unknown field type ${f.type}`);
    }
    if ((value === undefined || value === null) && !present && f.default && !partial) value = f.default();
    if (value !== undefined) values[f.col] = f.type === 'links' ? JSON.stringify(value ?? []) : value;
  }
  return { v, values };
}

async function listContent(def, req) {
  const params = requestUrl(req).searchParams;
  const status = params.get('status');
  const statusFilter = STATUSES.includes(status) ? status : null;
  const limit = parseLimit(params.get('limit'), 30);
  const cursor = decodeCursor(params.get('cursor'), 'date');
  const rows = await query(
    `select ${def.select} from ${def.table}
      where ($1::text is null or status = $1)
        and ($2::date is null or (${def.dateCol}, id) < ($2::date, $3::bigint))
      order by ${def.dateCol} desc, id desc limit $4`,
    [statusFilter, cursor?.key ?? null, cursor?.id ?? null, limit + 1],
  );
  return page(rows, limit, (r) => r[def.dateCol]);
}

async function getContent(def, id) {
  const [row] = await query(`select ${def.select} from ${def.table} where id = $1`, [id]);
  if (!row) throw new HttpError(404, 'NOT_FOUND', 'Item not found');
  return row;
}

function uniqueViolation(err) {
  if (err?.code === '23505') {
    throw new HttpError(409, 'DUPLICATE', 'This item already exists (for videos: the same YouTube video)');
  }
  throw err;
}

async function createContent(name, def, req, user) {
  const body = await readJson(req);
  // Videos: fill the title from YouTube when the admin left it empty.
  if (name === 'videos' && !String(body.title ?? '').trim()) {
    const id = parseYouTubeId(body.youtube);
    const info = id ? await youtubeLookup(id) : null;
    if (info?.title) body.title = info.title;
  }
  const { v, values } = readFields(def, body, { partial: false });
  v.throwIfInvalid();
  const cols = Object.keys(values);
  const params = cols.map((c) => values[c]);
  const placeholders = cols.map((c, i) => (c === 'links' ? `$${i + 1}::jsonb` : `$${i + 1}`));
  params.push(user.id);
  const n = params.length;
  let row;
  try {
    [row] = await query(
      `insert into ${def.table} (${cols.join(', ')}, created_by, updated_by, published_at)
       values (${placeholders.join(', ')}, $${n}, $${n},
               case when $${cols.indexOf('status') + 1}::text = 'published' then now() end)
       returning ${def.select}`,
      params,
    );
  } catch (err) {
    uniqueViolation(err);
  }
  await logActivity(user, `${name}.create`, { entityType: def.table, entityId: Number(row.id), details: { label: def.label(row) } });
  return row;
}

async function updateContent(name, def, id, req, user) {
  const body = await readJson(req);
  const { v, values } = readFields(def, body, { partial: true });
  v.throwIfInvalid();
  const cols = Object.keys(values);
  if (!cols.length) throw new HttpError(422, 'VALIDATION_FAILED', 'Nothing to update');
  const sets = cols.map((c, i) => `${c} = $${i + 1}${c === 'links' ? '::jsonb' : ''}`);
  const params = cols.map((c) => values[c]);
  params.push(user.id, id);
  const publishing = values.status === 'published';
  let row;
  try {
    [row] = await query(
      `update ${def.table}
          set ${sets.join(', ')}, updated_by = $${params.length - 1}
              ${publishing ? ', published_at = coalesce(published_at, now())' : ''}
        where id = $${params.length}
        returning ${def.select}`,
      params,
    );
  } catch (err) {
    uniqueViolation(err);
  }
  if (!row) throw new HttpError(404, 'NOT_FOUND', 'Item not found');
  await logActivity(user, `${name}.update`, { entityType: def.table, entityId: id, details: { fields: cols, label: def.label(row) } });
  return row;
}

async function archiveContent(name, def, id, req, user) {
  const body = await readJson(req).catch(() => ({}));
  const row = await getContent(def, id);
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) || null : null;
  const archiveId = await archiveRow(def.table, id, user, { reason });
  await logActivity(user, `${name}.archive`, { entityType: def.table, entityId: id, details: { label: def.label(row), archiveId } });
  return archiveId;
}

async function contentRoute(name, segs, req, res, user) {
  const def = CONTENT[name];
  if (segs.length === 1) {
    if (req.method === 'GET') {
      const { items, nextCursor } = await listContent(def, req);
      return send(res, 200, { items: items.map(def.map), nextCursor }, NO_STORE);
    }
    if (req.method === 'POST') return send(res, 201, { item: def.map(await createContent(name, def, req, user)) }, NO_STORE);
    throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use GET or POST');
  }
  if (name === 'videos' && segs[1] === 'lookup' && segs.length === 2) {
    methodGuard(req, ['POST']);
    const body = await readJson(req, 4096);
    const youtubeId = parseYouTubeId(body.url);
    if (!youtubeId) throw new HttpError(422, 'VALIDATION_FAILED', 'Not a YouTube link', { url: 'invalid_youtube' });
    const info = await youtubeLookup(youtubeId);
    if (!info) throw new HttpError(502, 'YOUTUBE_UNAVAILABLE', 'Could not reach YouTube; you can type the title yourself');
    if (info.missing) throw new HttpError(404, 'VIDEO_NOT_FOUND', 'This video is private, deleted or cannot be embedded');
    return send(res, 200, info, NO_STORE);
  }
  if (segs.length === 2) {
    const id = parseId(segs[1]);
    if (req.method === 'GET') return send(res, 200, { item: def.map(await getContent(def, id)) }, NO_STORE);
    if (req.method === 'PATCH') return send(res, 200, { item: def.map(await updateContent(name, def, id, req, user)) }, NO_STORE);
    if (req.method === 'DELETE') return send(res, 200, { archived: true, archiveId: await archiveContent(name, def, id, req, user) }, NO_STORE);
    throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use GET, PATCH or DELETE');
  }
  throw new HttpError(404, 'NOT_FOUND', 'Unknown endpoint');
}

// ---------------------------------------------------------------------------
// Gallery (Cloudinary)
// ---------------------------------------------------------------------------
const GALLERY_SELECT = `id, cloudinary_public_id, cloudinary_version, secure_url, width, height, format, bytes,
  author_name, source_url, status, created_at, updated_at`;
const mapImage = (r) => ({
  id: Number(r.id), publicId: r.cloudinary_public_id, version: Number(r.cloudinary_version), url: r.secure_url,
  width: r.width, height: r.height, format: r.format, bytes: r.bytes, authorName: r.author_name,
  sourceUrl: r.source_url, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
});

function readCredit(body, { partial }) {
  const v = validator(body);
  const values = {};
  if (!partial || v.has('authorName')) values.author_name = v.text('authorName', { max: 100 });
  if (!partial || v.has('sourceUrl')) values.source_url = v.url('sourceUrl', { required: false });
  if (!partial || v.has('status')) values.status = v.oneOf('status', STATUSES, { required: false, fallback: partial ? undefined : 'published' });
  v.throwIfInvalid();
  for (const k of Object.keys(values)) if (values[k] === undefined) delete values[k];
  return values;
}

async function galleryRoute(segs, req, res, user) {
  if (segs[1] === 'sign' && segs.length === 2) {
    methodGuard(req, ['POST']);
    return send(res, 200, signedUploadParams(), NO_STORE);
  }
  if (segs.length === 1 && req.method === 'GET') {
    const params = requestUrl(req).searchParams;
    const limit = parseLimit(params.get('limit'), 30);
    const cursor = decodeCursor(params.get('cursor'), 'timestamp');
    const rows = await query(
      `select ${GALLERY_SELECT}, to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as cursor_key
         from gallery_images where ($1::timestamptz is null or (created_at, id) < ($1::timestamptz, $2::bigint))
        order by created_at desc, id desc limit $3`,
      [cursor?.key ?? null, cursor?.id ?? null, limit + 1],
    );
    const { items, nextCursor } = page(rows, limit, (r) => r.cursor_key);
    return send(res, 200, { items: items.map(mapImage), nextCursor }, NO_STORE);
  }
  if (segs.length === 1 && req.method === 'POST') {
    const body = await readJson(req);
    const { publicId, version, signature } = body;
    if (!verifyUploadResponse({ publicId, version, signature })) {
      throw new HttpError(422, 'BAD_UPLOAD_SIGNATURE', 'Upload could not be verified');
    }
    const credit = readCredit(body, { partial: false });
    const folder = process.env.CLOUDINARY_FOLDER || 'kotoha-fansite/gallery';
    const resource = await getResource(publicId);
    const tooBig = resource && resource.bytes > MAX_UPLOAD_BYTES;
    const badFormat = resource && !ALLOWED_FORMATS.includes(String(resource.format).toLowerCase());
    const wrongPlace = resource && !String(resource.public_id).startsWith(`${folder}/`)
      && resource.asset_folder !== folder;
    if (!resource || tooBig || badFormat || wrongPlace) {
      if (resource) await destroyImage(publicId).catch(() => {});
      throw new HttpError(422, 'UPLOAD_REJECTED', 'This file type or size is not allowed');
    }
    let row;
    try {
      [row] = await query(
        `insert into gallery_images (cloudinary_public_id, cloudinary_version, secure_url, width, height, format, bytes,
                                     author_name, source_url, status, uploaded_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning ${GALLERY_SELECT}`,
        [resource.public_id, resource.version, resource.secure_url, resource.width, resource.height, resource.format,
          resource.bytes, credit.author_name, credit.source_url, credit.status, user.id],
      );
    } catch (err) {
      uniqueViolation(err);
    }
    await logActivity(user, 'gallery.create', { entityType: 'gallery_images', entityId: Number(row.id), details: { author: row.author_name } });
    return send(res, 201, { item: mapImage(row) }, NO_STORE);
  }
  if (segs.length === 2) {
    const id = parseId(segs[1]);
    if (req.method === 'PATCH') {
      const values = readCredit(await readJson(req), { partial: true });
      const cols = Object.keys(values);
      if (!cols.length) throw new HttpError(422, 'VALIDATION_FAILED', 'Nothing to update');
      const [row] = await query(
        `update gallery_images set ${cols.map((c, i) => `${c} = $${i + 1}`).join(', ')} where id = $${cols.length + 1}
         returning ${GALLERY_SELECT}`,
        [...cols.map((c) => values[c]), id],
      );
      if (!row) throw new HttpError(404, 'NOT_FOUND', 'Image not found');
      await logActivity(user, 'gallery.update', { entityType: 'gallery_images', entityId: id, details: { fields: cols } });
      return send(res, 200, { item: mapImage(row) }, NO_STORE);
    }
    if (req.method === 'DELETE') {
      const [row] = await sql()`select id, cloudinary_public_id, author_name from gallery_images where id = ${id}`;
      if (!row) throw new HttpError(404, 'NOT_FOUND', 'Image not found');
      await destroyImage(row.cloudinary_public_id); // permanent (free-tier storage); throws → row kept
      const archiveId = await archiveRow('gallery_images', id, user, {
        note: 'Image file permanently deleted from Cloudinary',
      });
      await logActivity(user, 'gallery.delete', { entityType: 'gallery_images', entityId: id, details: { author: row.author_name, archiveId } });
      return send(res, 200, { deleted: true, archiveId }, NO_STORE);
    }
  }
  throw new HttpError(404, 'NOT_FOUND', 'Unknown endpoint');
}

// ---------------------------------------------------------------------------
// Archive & activity log
// ---------------------------------------------------------------------------
function archiveLabel(record) {
  return record?.title || record?.headline || record?.text || record?.author_name || record?.username || '';
}

async function archiveRoute(segs, req, res, user) {
  if (segs.length === 1) {
    methodGuard(req, ['GET']);
    const params = requestUrl(req).searchParams;
    const source = params.get('source');
    const sourceFilter = Object.hasOwn(SECTIONS, source) ? source : null;
    const limit = parseLimit(params.get('limit'), 30);
    const cursor = decodeCursor(params.get('cursor'), 'timestamp');
    const rows = await query(
      `select id, source_table, source_section, original_id, record, archived_at, archived_by_username, reason, note,
              restored_at, to_char(archived_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as cursor_key
         from archived_content
        where ($1::text is null or source_table = $1)
          and ($2::timestamptz is null or (archived_at, id) < ($2::timestamptz, $3::bigint))
        order by archived_at desc, id desc limit $4`,
      [sourceFilter, cursor?.key ?? null, cursor?.id ?? null, limit + 1],
    );
    const { items, nextCursor } = page(rows, limit, (r) => r.cursor_key);
    return send(res, 200, {
      items: items.map((r) => ({
        id: Number(r.id), sourceTable: r.source_table, sourceSection: r.source_section, originalId: Number(r.original_id),
        label: archiveLabel(r.record), record: r.record, archivedAt: r.archived_at, archivedBy: r.archived_by_username,
        reason: r.reason, note: r.note, restoredAt: r.restored_at,
        restorable: !r.restored_at && ['videos', 'news', 'achievements', 'discography_items'].includes(r.source_table),
      })),
      nextCursor,
    }, NO_STORE);
  }
  if (segs.length === 3 && segs[2] === 'restore') {
    methodGuard(req, ['POST']);
    const archiveId = parseId(segs[1]);
    const restored = await restoreArchived(archiveId, user);
    await logActivity(user, 'archive.restore', { entityType: restored.table, entityId: restored.id, details: { archiveId } });
    return send(res, 200, { restored: true, ...restored }, NO_STORE);
  }
  throw new HttpError(404, 'NOT_FOUND', 'Unknown endpoint');
}

async function activityRoute(req, res) {
  methodGuard(req, ['GET']);
  const params = requestUrl(req).searchParams;
  const limit = parseLimit(params.get('limit'), 50);
  const cursor = decodeCursor(params.get('cursor'), 'timestamp');
  const rows = await query(
    `select id, admin_username, action, entity_type, entity_id, details, created_at,
            to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as cursor_key
       from activity_log where ($1::timestamptz is null or (created_at, id) < ($1::timestamptz, $2::bigint))
      order by created_at desc, id desc limit $3`,
    [cursor?.key ?? null, cursor?.id ?? null, limit + 1],
  );
  const { items, nextCursor } = page(rows, limit, (r) => r.cursor_key);
  send(res, 200, {
    items: items.map((r) => ({
      id: Number(r.id), username: r.admin_username, action: r.action, entityType: r.entity_type,
      entityId: r.entity_id === null ? null : Number(r.entity_id), details: r.details, createdAt: r.created_at,
    })),
    nextCursor,
  }, NO_STORE);
}

// ---------------------------------------------------------------------------
// Accounts (Owner only)
// ---------------------------------------------------------------------------
const mapAccount = (r) => ({
  id: Number(r.id), username: r.username, role: r.role, isActive: r.is_active, mustChangePassword: r.must_change_password,
  tempPasswordExpiresAt: r.temp_password_expires_at, lastLoginAt: r.last_login_at, createdAt: r.created_at,
});
const ACCOUNT_SELECT = `id, username, role, is_active, must_change_password, temp_password_expires_at, last_login_at, created_at`;

async function accountsRoute(segs, req, res) {
  const { user } = await requireOwner(req);
  if (segs.length === 1 && req.method === 'GET') {
    const rows = await query(`select ${ACCOUNT_SELECT} from admin_users order by (role = 'owner') desc, admin_number nulls first, id`);
    return send(res, 200, { items: rows.map(mapAccount) }, NO_STORE);
  }
  if (segs.length === 1 && req.method === 'POST') {
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    // Auto-numbered username: <owner-username><n>, numbers never reused (sequence).
    const [row] = await query(
      `with n as (select nextval('admin_number_seq')::int as num),
            o as (select username from admin_users where role = 'owner')
       insert into admin_users (username, role, admin_number, password_hash, must_change_password,
                                temp_password_expires_at, created_by)
       select o.username || n.num, 'admin', n.num, $1, true, now() + make_interval(days => $2), $3 from n, o
       returning ${ACCOUNT_SELECT}`,
      [passwordHash, TEMP_PASSWORD_DAYS, user.id],
    );
    await logActivity(user, 'account.create', { entityType: 'admin_users', entityId: Number(row.id), details: { username: row.username } });
    // The temporary password is returned exactly once and never stored in plain text.
    return send(res, 201, { account: mapAccount(row), tempPassword }, NO_STORE);
  }
  if (segs.length >= 2) {
    const id = parseId(segs[1]);
    const [target] = await query(`select * from admin_users where id = $1`, [id]);
    if (!target) throw new HttpError(404, 'NOT_FOUND', 'Account not found');
    if (target.role === 'owner') throw new HttpError(403, 'FORBIDDEN', 'The Owner account cannot be changed here');
    if (segs.length === 3 && segs[2] === 'reset-password' && req.method === 'POST') {
      if (!target.is_active) throw new HttpError(409, 'INACTIVE', 'This account was removed');
      const tempPassword = generateTempPassword();
      const [row] = await query(
        `update admin_users set password_hash = $1, must_change_password = true,
                temp_password_expires_at = now() + make_interval(days => $2), failed_login_count = 0, locked_until = null
          where id = $3 returning ${ACCOUNT_SELECT}`,
        [await hashPassword(tempPassword), TEMP_PASSWORD_DAYS, id],
      );
      await revokeAllSessions(id);
      await logActivity(user, 'account.reset_password', { entityType: 'admin_users', entityId: id, details: { username: row.username } });
      return send(res, 200, { account: mapAccount(row), tempPassword }, NO_STORE);
    }
    if (segs.length === 2 && req.method === 'DELETE') {
      if (!target.is_active) throw new HttpError(409, 'INACTIVE', 'This account was already removed');
      const body = await readJson(req).catch(() => ({}));
      const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) || null : null;
      await query(`update admin_users set is_active = false where id = $1`, [id]);
      await revokeAllSessions(id);
      const archiveId = await archiveAccountSnapshot(target, user, { reason });
      await logActivity(user, 'account.remove', { entityType: 'admin_users', entityId: id, details: { username: target.username, archiveId } });
      return send(res, 200, { removed: true, archiveId }, NO_STORE);
    }
  }
  throw new HttpError(404, 'NOT_FOUND', 'Unknown endpoint');
}

// ---------------------------------------------------------------------------
export default handle(async (req, res) => {
  if (req.method !== 'GET') assertSameOrigin(req);
  const segs = routeOf(req, 'admin').split('/').filter(Boolean);
  const resource = segs[0];
  if (resource === 'accounts') return accountsRoute(segs, req, res);
  const { user } = await requireAdmin(req);
  if (Object.hasOwn(CONTENT, resource)) return contentRoute(resource, segs, req, res, user);
  if (resource === 'gallery') return galleryRoute(segs, req, res, user);
  if (resource === 'archive') return archiveRoute(segs, req, res, user);
  if (resource === 'activity') return activityRoute(req, res);
  if (resource === 'summary') return summaryRoute(req, res);
  if (resource === 'analytics') return analyticsRoute(req, res);
  throw new HttpError(404, 'NOT_FOUND', 'Unknown endpoint');
});

// Dashboard counts (published / draft per content type, archive size).
async function summaryRoute(req, res) {
  methodGuard(req, ['GET']);
  const [row] = await sql()`
    select
      (select count(*) filter (where status = 'published') from videos)::int            as videos_published,
      (select count(*) filter (where status = 'draft') from videos)::int                as videos_draft,
      (select count(*) filter (where status = 'published') from news)::int              as news_published,
      (select count(*) filter (where status = 'draft') from news)::int                  as news_draft,
      (select count(*) filter (where status = 'published') from achievements)::int      as achievements_published,
      (select count(*) filter (where status = 'draft') from achievements)::int          as achievements_draft,
      (select count(*) filter (where status = 'published') from discography_items)::int as discography_published,
      (select count(*) filter (where status = 'draft') from discography_items)::int     as discography_draft,
      (select count(*) filter (where status = 'published') from gallery_images)::int    as gallery_published,
      (select count(*) filter (where status = 'draft') from gallery_images)::int        as gallery_draft,
      (select count(*) from archived_content where restored_at is null)::int            as archived`;
  send(res, 200, row, NO_STORE);
}

// Visitor statistics for the dashboard. Breakdown range in days; visit charts use fixed spans.
async function analyticsRoute(req, res) {
  methodGuard(req, ['GET']);
  const range = Number(requestUrl(req).searchParams.get('range') || 30);
  if (![7, 30, 90, 365].includes(range)) throw new HttpError(400, 'VALIDATION_ERROR', 'range must be 7, 30, 90 or 365');
  send(res, 200, await dashboard(range), NO_STORE);
}
