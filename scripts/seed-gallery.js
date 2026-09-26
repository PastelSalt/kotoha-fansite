// Seeds the gallery (plan §3.3): the 5 credited artworks + the official model sheets, uploaded to Cloudinary
// with their credits. Safe to re-run: items already in the database are skipped, files already on Cloudinary reused.
// Credits come from public/js/public/data.js (the same data the site's credit labels use).
// Usage: npm run gallery:seed
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPool } from './_db.js';
import { signParams, getResource } from '../lib/cloudinary.js';
import { CREDITS } from '../public/js/public/data.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FOLDER = (process.env.CLOUDINARY_FOLDER || 'kotoha-fansite/gallery').replace(/\/+$/, '');
const credit = (key) => ({ author: CREDITS[key].handle, source: CREDITS[key].url });

// Listed newest-first: the gallery shows the most recently added item first.
const ITEMS = [
  { key: 'home-kuroli', file: 'backgrounds/home_bg.jpeg', ...credit('home') },
  { key: 'birthday-kuroli', file: 'backgrounds/bg2.jpeg', ...credit('loader2') },
  { key: 'news-parfait-pie', file: 'backgrounds/news_bg.jpeg', ...credit('news') },
  { key: 'discography-snowclole', file: 'backgrounds/discography_bg.jpeg', ...credit('discography') },
  { key: 'gallery-snowclole', file: 'backgrounds/gallery_bg.jpeg', ...credit('gallery') },
  { key: 'model-front-aiceclass', file: 'model/kotoha_fullbody_model_front_only.png', author: 'AiceClass', source: null },
  { key: 'model-sheet-aiceclass', file: 'model/kotoha_fullbody_modelsheet.png', author: 'AiceClass', source: null },
  { key: 'mascot-sheet', file: 'model/kotoha_mascot_fullbody_modelsheet.png', author: 'Artist unknown (作者不明)', source: null },
];

const cloud = { name: process.env.CLOUDINARY_CLOUD_NAME, key: process.env.CLOUDINARY_API_KEY, secret: process.env.CLOUDINARY_API_SECRET };
if (!cloud.name || !cloud.key || !cloud.secret) {
  console.error('Set CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET in .env.local first.');
  process.exit(1);
}

/** Signed server-side upload with a fixed public_id (so re-runs find the same file). */
async function upload(item) {
  const params = {
    public_id: `seed-${item.key}`, folder: FOLDER, overwrite: 'false', tags: 'kotoha-gallery,kotoha-seed',
    timestamp: Math.floor(Date.now() / 1000),
  };
  const form = new FormData();
  const bytes = await readFile(path.join(root, 'assets', item.file));
  form.append('file', new Blob([bytes]), path.basename(item.file));
  for (const [k, v] of Object.entries(params)) form.append(k, String(v));
  form.append('api_key', cloud.key);
  form.append('signature', signParams(params, cloud.secret));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud.name}/image/upload`, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(`upload ${item.key}: ${json.error?.message || res.status}`);
  return json;
}

const pool = openPool();
try {
  const [owner] = (await pool.query(`select id from admin_users where role = 'owner'`)).rows;
  const now = Date.now();
  let added = 0;
  for (const [i, item] of ITEMS.entries()) {
    const publicId = `${FOLDER}/seed-${item.key}`;
    const exists = await pool.query('select id from gallery_images where cloudinary_public_id = $1', [publicId]);
    if (exists.rows.length) { console.log(`skip    ${item.key} (already in the gallery)`); continue; }
    const r = (await getResource(publicId)) || (await upload(item));
    // Newest-first order: the first item gets the latest timestamp.
    const createdAt = new Date(now - i * 1000);
    await pool.query(
      `insert into gallery_images (cloudinary_public_id, cloudinary_version, secure_url, width, height, format, bytes,
                                   author_name, source_url, status, uploaded_by, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', $10, $11)`,
      [r.public_id, r.version, r.secure_url, r.width, r.height, r.format, r.bytes, item.author, item.source, owner?.id ?? null, createdAt],
    );
    added++;
    console.log(`added   ${item.key}  ${r.width}x${r.height} ${r.format}  by ${item.author}`);
  }
  console.log(`Gallery seed done: ${added} added, ${ITEMS.length - added} already present.`);
} catch (err) {
  console.error('Gallery seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
