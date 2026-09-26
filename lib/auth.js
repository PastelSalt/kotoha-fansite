// Sessions, role guards and activity logging (plan §8.6, §12).
import { createHash, randomBytes } from 'node:crypto';
import { sql } from './db.js';
import { HttpError, clientIp } from './http.js';

export const IDLE_MINUTES = 120;           // sign out after 2 h without activity
export const ABSOLUTE_DAYS = 7;            // sessions never outlive 7 days
const TOUCH_EVERY_MS = 5 * 60 * 1000;      // refresh last_seen_at at most every 5 minutes

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

function isHttps(req) {
  return req.headers['x-forwarded-proto'] === 'https' || Boolean(process.env.VERCEL);
}

// `__Host-` cookies require HTTPS; plain-http local development gets a separate name.
function cookieName(req) {
  return isHttps(req) ? '__Host-kf_session' : 'kf_session_dev';
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function setSessionCookie(req, res, token, maxAgeSeconds) {
  const attrs = [
    `${cookieName(req)}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isHttps(req)) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

export function clearSessionCookie(req, res) {
  setSessionCookie(req, res, '', 0);
}

/** Salted hash of the client IP (never store raw IPs). */
export function ipHash(req) {
  return sha256(`${process.env.ANALYTICS_SALT || 'dev-salt'}:ip:${clientIp(req)}`);
}

export function publicUser(u) {
  return {
    id: Number(u.id),
    username: u.username,
    role: u.role,
    mustChangePassword: u.must_change_password,
    preferredLang: u.preferred_lang,
    lastLoginAt: u.last_login_at,
  };
}

export async function createSession(req, res, userId) {
  const token = randomBytes(32).toString('base64url');
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 300);
  await sql()`
    insert into admin_sessions (admin_user_id, token_hash, expires_at, user_agent)
    values (${userId}, ${sha256(token)}, now() + make_interval(days => ${ABSOLUTE_DAYS}), ${userAgent})`;
  setSessionCookie(req, res, token, ABSOLUTE_DAYS * 24 * 60 * 60);
}

/** Returns { session, user } for a valid session, or null. */
export async function getSession(req) {
  const token = readCookie(req, cookieName(req));
  if (!token || token.length > 100) return null;
  const rows = await sql()`
    select s.id as session_id, s.last_seen_at,
           u.id, u.username, u.role, u.must_change_password, u.preferred_lang, u.last_login_at, u.is_active
      from admin_sessions s
      join admin_users u on u.id = s.admin_user_id
     where s.token_hash = ${sha256(token)}
       and s.revoked_at is null
       and s.expires_at > now()
       and s.last_seen_at > now() - make_interval(mins => ${IDLE_MINUTES})
       and u.is_active`;
  const row = rows[0];
  if (!row) return null;
  if (Date.now() - new Date(row.last_seen_at).getTime() > TOUCH_EVERY_MS) {
    await sql()`update admin_sessions set last_seen_at = now() where id = ${row.session_id}`;
  }
  return { sessionId: Number(row.session_id), user: row };
}

/**
 * Guard for admin APIs. Throws 401 when signed out, 403 PASSWORD_CHANGE_REQUIRED while the
 * forced password change is pending (unless allowPasswordChange), 403 FORBIDDEN for non-owners
 * when ownerOnly.
 */
export async function requireAdmin(req, { allowPasswordChange = false, ownerOnly = false } = {}) {
  const auth = await getSession(req);
  if (!auth) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in');
  if (auth.user.must_change_password && !allowPasswordChange) {
    throw new HttpError(403, 'PASSWORD_CHANGE_REQUIRED', 'Please change your password first');
  }
  if (ownerOnly && auth.user.role !== 'owner') {
    throw new HttpError(403, 'FORBIDDEN', 'Only the Owner can do this');
  }
  return auth;
}

export const requireOwner = (req) => requireAdmin(req, { ownerOnly: true });

export async function revokeSession(sessionId) {
  await sql()`update admin_sessions set revoked_at = now() where id = ${sessionId} and revoked_at is null`;
}

export async function revokeAllSessions(userId, { exceptSessionId = null } = {}) {
  await sql()`
    update admin_sessions set revoked_at = now()
     where admin_user_id = ${userId} and revoked_at is null
       and (${exceptSessionId}::bigint is null or id <> ${exceptSessionId}::bigint)`;
}

export async function logActivity(user, action, { entityType = null, entityId = null, details = {} } = {}) {
  await sql()`
    insert into activity_log (admin_user_id, admin_username, action, entity_type, entity_id, details)
    values (${user.id}, ${user.username}, ${action}, ${entityType}, ${entityId}, ${JSON.stringify(details)}::jsonb)`;
}
