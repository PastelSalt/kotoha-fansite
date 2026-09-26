// Pre-launch reset (plan A13) — run ONCE, right before launch. Dev and prod share one database and one
// Cloudinary folder, so this wipes everything created while testing and starts clean:
//   1. deletes every file in the gallery folder on Cloudinary (test uploads)
//   2. empties all content, archive, activity, analytics, session and account tables (one transaction)
//   3. re-applies db/seed.sql and re-creates the Owner from ADMIN_BOOTSTRAP_USERNAME / _PASSWORD
// Afterwards: run the gallery seed again, then the Owner signs in and changes the password.
//
// Usage:  npm run prelaunch:reset                          → dry run: shows what would be deleted
//         npm run prelaunch:reset -- --yes-reset-everything
//         add --skip-cloudinary only if the Cloudinary keys are not set up yet (files would stay behind)
import { readFile } from 'node:fs/promises';
import { openPool, inTransaction } from './_db.js';
import { hashPassword } from '../lib/password.js';

const args = new Set(process.argv.slice(2));
const confirmed = args.has('--yes-reset-everything');
const skipCloudinary = args.has('--skip-cloudinary');

const TABLES = ['videos', 'news', 'achievements', 'discography_items', 'gallery_images', 'archived_content',
  'activity_log', 'analytics_events', 'analytics_daily', 'admin_sessions', 'login_attempts', 'admin_users'];

const username = (process.env.ADMIN_BOOTSTRAP_USERNAME || '').trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
const cloud = {
  name: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET,
  folder: (process.env.CLOUDINARY_FOLDER || 'kotoha-fansite/gallery').replace(/\/+$/, ''),
};
const cloudReady = Boolean(cloud.name && cloud.key && cloud.secret);

function fail(message) {
  console.error(message);
  process.exit(1);
}

// ---- Cloudinary (Admin API, Basic auth). Only ever touches the gallery folder prefix.
const auth = () => `Basic ${Buffer.from(`${cloud.key}:${cloud.secret}`).toString('base64')}`;
const adminApi = (path) => `https://api.cloudinary.com/v1_1/${cloud.name}/resources/image/upload${path}`;

async function listGalleryFiles() {
  const ids = [];
  let cursor = null;
  do {
    const qs = new URLSearchParams({ prefix: `${cloud.folder}/`, max_results: '500' });
    if (cursor) qs.set('next_cursor', cursor);
    const res = await fetch(`${adminApi('')}?${qs}`, { headers: { Authorization: auth() } });
    if (!res.ok) throw new Error(`Cloudinary list failed: HTTP ${res.status}`);
    const page = await res.json();
    ids.push(...page.resources.map((r) => r.public_id));
    cursor = page.next_cursor;
  } while (cursor);
  return ids.filter((id) => id.startsWith(`${cloud.folder}/`));
}

async function deleteGalleryFiles(ids) {
  for (let i = 0; i < ids.length; i += 100) {
    const qs = new URLSearchParams({ invalidate: 'true' });
    for (const id of ids.slice(i, i + 100)) qs.append('public_ids[]', id);
    const res = await fetch(`${adminApi('')}?${qs}`, { method: 'DELETE', headers: { Authorization: auth() } });
    if (!res.ok) throw new Error(`Cloudinary delete failed: HTTP ${res.status}`);
  }
}

// ---- main
if (!username || !password) fail('ADMIN_BOOTSTRAP_USERNAME / ADMIN_BOOTSTRAP_PASSWORD must be set in .env.local (the Owner is re-created).');
if (!/^[a-z0-9_.-]{3,40}$/.test(username)) fail('ADMIN_BOOTSTRAP_USERNAME must be 3–40 chars: a-z, 0-9, _ . -');
if (!cloudReady && !skipCloudinary) fail('Cloudinary keys are missing. Set them in .env.local, or pass --skip-cloudinary (test uploads would stay in Cloudinary).');

const pool = openPool();
try {
  const counts = {};
  for (const t of TABLES) counts[t] = Number((await pool.query(`select count(*) as n from ${t}`)).rows[0].n);
  const files = cloudReady && !skipCloudinary ? await listGalleryFiles() : [];

  console.log(confirmed ? 'PRE-LAUNCH RESET' : 'DRY RUN (nothing is changed) — add --yes-reset-everything to reset');
  console.log('Rows that will be deleted:');
  for (const [t, n] of Object.entries(counts)) console.log(`  ${t.padEnd(18)} ${n}`);
  console.log(`Cloudinary files in ${cloud.folder}/: ${cloudReady && !skipCloudinary ? files.length : 'skipped'}`);
  if (!confirmed) process.exit(0);

  if (files.length) {
    await deleteGalleryFiles(files);
    console.log(`Deleted ${files.length} Cloudinary file(s).`);
  }

  const seed = await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8');
  const passwordHash = await hashPassword(password);
  await inTransaction(pool, async (client) => {
    await client.query(`truncate table ${TABLES.join(', ')} restart identity cascade`);
    await client.query('alter sequence admin_number_seq restart with 2');
    await client.query(seed);
    const { rows } = await client.query(
      `insert into admin_users (username, role, password_hash, must_change_password)
       values ($1, 'owner', $2, true) returning id`,
      [username, passwordHash],
    );
    await client.query(
      `insert into activity_log (admin_user_id, admin_username, action, entity_type, entity_id, details)
       values ($1, $2, 'account.bootstrap_owner', 'admin_users', $1, '{"prelaunchReset": true}'::jsonb)`,
      [rows[0].id, username],
    );
  });
  console.log('Database reset, content re-seeded, Owner re-created (must change the password at first sign-in).');
  console.log('Next: run the gallery seed, then sign in at /login and change the Owner password.');
} catch (err) {
  console.error('Reset failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
