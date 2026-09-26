// Auth API: /api/auth/{login,logout,me,change-password,preferences}
import { sql } from '../lib/db.js';
import {
  handle, methodGuard, routeOf, readJson, send, assertSameOrigin, HttpError, NO_STORE,
} from '../lib/http.js';
import {
  createSession, getSession, requireAdmin, revokeSession, revokeAllSessions, clearSessionCookie,
  ipHash, publicUser, logActivity,
} from '../lib/auth.js';
import {
  verifyPassword, burnVerifyTime, hashPassword, checkPasswordPolicy, isLeakedPassword, PASSWORD_MAX,
} from '../lib/password.js';

const WINDOW_MINUTES = 15;
const MAX_FAILS_PER_USER_AND_IP = 5;
const MAX_FAILS_PER_IP = 20;
const LOCK_AFTER_FAILS = 5;

const tooMany = () =>
  new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts. Please wait 15 minutes and try again.');
const invalidCredentials = () =>
  new HttpError(401, 'INVALID_CREDENTIALS', 'Incorrect username or password');

async function recordAttempt(ih, username, succeeded) {
  await sql()`insert into login_attempts (ip_hash, username_attempted, succeeded)
              values (${ih}, ${username.slice(0, 64)}, ${succeeded})`;
}

async function login(req, res) {
  methodGuard(req, ['POST']);
  assertSameOrigin(req);
  const body = await readJson(req, 4 * 1024);
  const username = String(body.username ?? '').trim().toLowerCase().slice(0, 64);
  const password = String(body.password ?? '');
  if (!username || !password || password.length > PASSWORD_MAX) throw invalidCredentials();

  const ih = ipHash(req);
  const [counts] = await sql()`
    select count(*) filter (where username_attempted = ${username})::int as user_ip,
           count(*)::int as ip
      from login_attempts
     where ip_hash = ${ih} and not succeeded
       and attempted_at > now() - make_interval(mins => ${WINDOW_MINUTES})`;
  if (counts.user_ip >= MAX_FAILS_PER_USER_AND_IP || counts.ip >= MAX_FAILS_PER_IP) throw tooMany();

  const [user] = await sql()`
    select id, username, role, password_hash, must_change_password, temp_password_expires_at,
           failed_login_count, locked_until, preferred_lang, last_login_at
      from admin_users where username = ${username} and is_active`;

  if (!user) {
    await burnVerifyTime(password);
    await recordAttempt(ih, username, false);
    throw invalidCredentials();
  }
  if (user.locked_until && new Date(user.locked_until) > new Date()) throw tooMany();

  if (!(await verifyPassword(user.password_hash, password))) {
    const fails = user.failed_login_count + 1;
    if (fails >= LOCK_AFTER_FAILS) {
      await sql()`update admin_users set failed_login_count = 0,
                    locked_until = now() + make_interval(mins => ${WINDOW_MINUTES}) where id = ${user.id}`;
    } else {
      await sql()`update admin_users set failed_login_count = ${fails} where id = ${user.id}`;
    }
    await recordAttempt(ih, username, false);
    throw invalidCredentials();
  }

  if (user.must_change_password && user.temp_password_expires_at && new Date(user.temp_password_expires_at) < new Date()) {
    await recordAttempt(ih, username, false);
    throw new HttpError(401, 'TEMP_PASSWORD_EXPIRED', 'This temporary password has expired. Ask the Owner for a new one.');
  }

  const [fresh] = await sql()`
    update admin_users set failed_login_count = 0, locked_until = null, last_login_at = now()
     where id = ${user.id}
     returning id, username, role, must_change_password, preferred_lang, last_login_at`;
  await recordAttempt(ih, username, true);
  await createSession(req, res, user.id);
  await logActivity(fresh, 'auth.login');
  send(res, 200, { user: publicUser(fresh) }, NO_STORE);
}

async function logout(req, res) {
  methodGuard(req, ['POST']);
  assertSameOrigin(req);
  const auth = await getSession(req);
  if (auth) await revokeSession(auth.sessionId);
  clearSessionCookie(req, res);
  send(res, 200, { ok: true }, NO_STORE);
}

async function me(req, res) {
  methodGuard(req, ['GET']);
  const auth = await getSession(req);
  if (!auth) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in');
  send(res, 200, { user: publicUser(auth.user) }, NO_STORE);
}

async function changePassword(req, res) {
  methodGuard(req, ['POST']);
  assertSameOrigin(req);
  const { user } = await requireAdmin(req, { allowPasswordChange: true });
  const body = await readJson(req, 4 * 1024);
  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');

  const [row] = await sql()`select password_hash from admin_users where id = ${user.id}`;
  if (!currentPassword || !(await verifyPassword(row.password_hash, currentPassword))) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'Current password is incorrect', { currentPassword: 'wrong_password' });
  }
  const failed = checkPasswordPolicy(newPassword, { username: user.username, currentPassword });
  if (!failed.length && (await isLeakedPassword(newPassword)) === true) failed.push('leaked');
  if (failed.length) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'The new password does not meet the rules', { newPassword: failed });
  }

  const passwordHash = await hashPassword(newPassword);
  const [fresh] = await sql()`
    update admin_users
       set password_hash = ${passwordHash}, must_change_password = false, temp_password_expires_at = null,
           password_changed_at = now(), failed_login_count = 0, locked_until = null
     where id = ${user.id}
     returning id, username, role, must_change_password, preferred_lang, last_login_at`;
  await revokeAllSessions(user.id);        // sign out everywhere, including other devices
  await createSession(req, res, user.id);  // …then keep this browser signed in
  await logActivity(fresh, 'auth.password_change');
  send(res, 200, { user: publicUser(fresh) }, NO_STORE);
}

async function preferences(req, res) {
  methodGuard(req, ['POST']);
  assertSameOrigin(req);
  const { user } = await requireAdmin(req, { allowPasswordChange: true });
  const body = await readJson(req, 1024);
  if (!['ja', 'en'].includes(body.preferredLang)) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'Invalid language', { preferredLang: 'invalid_choice' });
  }
  await sql()`update admin_users set preferred_lang = ${body.preferredLang} where id = ${user.id}`;
  send(res, 200, { ok: true }, NO_STORE);
}

async function logoutOthers(req, res) {
  methodGuard(req, ['POST']);
  assertSameOrigin(req);
  const { user, sessionId } = await requireAdmin(req, { allowPasswordChange: true });
  await revokeAllSessions(user.id, { exceptSessionId: sessionId });
  await logActivity(user, 'auth.logout_others');
  send(res, 200, { ok: true }, NO_STORE);
}

const ROUTES = { login, logout, me, 'change-password': changePassword, preferences, 'logout-others': logoutOthers };

export default handle(async (req, res) => {
  const route = routeOf(req, 'auth');
  const fn = ROUTES[route];
  if (!fn) throw new HttpError(404, 'NOT_FOUND', 'Unknown endpoint');
  return fn(req, res);
});
