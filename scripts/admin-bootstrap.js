// Creates the Owner account from ADMIN_BOOTSTRAP_USERNAME / ADMIN_BOOTSTRAP_PASSWORD (env only).
// Refuses to run when an Owner already exists. The Owner must change the password at first login.
// Usage: npm run admin:bootstrap
import { openPool } from './_db.js';
import { hashPassword } from '../lib/password.js';

const username = (process.env.ADMIN_BOOTSTRAP_USERNAME || '').trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';

if (!username || !password) {
  console.error('Set ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD in .env.local first.');
  process.exit(1);
}
if (!/^[a-z0-9_.-]{3,40}$/.test(username)) {
  console.error('ADMIN_BOOTSTRAP_USERNAME must be 3–40 chars: a-z, 0-9, _ . -');
  process.exit(1);
}

const pool = openPool();
try {
  const existing = await pool.query(`select username from admin_users where role = 'owner'`);
  if (existing.rows.length) {
    console.log(`An Owner already exists (${existing.rows[0].username}). Nothing to do.`);
  } else {
    const passwordHash = await hashPassword(password);
    const { rows } = await pool.query(
      `insert into admin_users (username, role, password_hash, must_change_password)
       values ($1, 'owner', $2, true) returning id`,
      [username, passwordHash],
    );
    await pool.query(
      `insert into activity_log (admin_user_id, admin_username, action, entity_type, entity_id, details)
       values ($1, $2, 'account.bootstrap_owner', 'admin_users', $1, '{}'::jsonb)`,
      [rows[0].id, username],
    );
    console.log(`Owner "${username}" created. Log in at /login and change the password immediately.`);
  }
} catch (err) {
  console.error('Bootstrap failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
