// Password hashing, policy and temporary-password generation (plan §12.5–12.6).
import { createHash, randomInt } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';

// OWASP baseline for Argon2id (the library's default algorithm): 19 MiB, 2 iterations, 1 lane.
const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

export function hashPassword(plain) {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(storedHash, plain) {
  try {
    return await verify(storedHash, plain);
  } catch {
    return false;
  }
}

// Used for unknown usernames so response time doesn't reveal whether an account exists.
let dummyHashPromise;
export async function burnVerifyTime(plain) {
  dummyHashPromise ??= hashPassword('dummy-password-for-timing-only');
  await verifyPassword(await dummyHashPromise, plain);
}

// Words that make a password guessable for this site. A password is rejected when its letters
// consist ONLY of these words (e.g. "KotohaClover2026!"), not when it merely contains one.
const GUESSABLE_WORDS = [
  'kotoha', 'hakoniwa', 'lily', 'hakoniwalily', 'clover', 'hanon', 'kotorisu', 'honeyworks', 'aiceclass',
  'password', 'passwd', 'admin', 'owner', 'qwerty', 'letmein', 'welcome', 'iloveyou', 'fansite', 'moekoworks',
  'abc', 'love', 'pass', 'secret', 'login',
];

function onlyGuessableWords(letters) {
  if (!letters) return true;
  // Word-break DP: can `letters` be split entirely into GUESSABLE_WORDS?
  const ok = new Array(letters.length + 1).fill(false);
  ok[0] = true;
  for (let i = 1; i <= letters.length; i++) {
    for (const w of GUESSABLE_WORDS) {
      if (w.length <= i && ok[i - w.length] && letters.slice(i - w.length, i) === w) {
        ok[i] = true;
        break;
      }
    }
  }
  return ok[letters.length];
}

/**
 * Returns an array of failed rule keys (empty = acceptable). Rule keys map to UI strings:
 * min_length, max_length, contains_username, same_as_current, guessable
 */
export function checkPasswordPolicy(plain, { username = '', currentPassword = '' } = {}) {
  const failed = [];
  const pw = String(plain ?? '');
  if (pw.length < PASSWORD_MIN) failed.push('min_length');
  if (pw.length > PASSWORD_MAX) failed.push('max_length');
  const lower = pw.toLowerCase();
  if (username && lower.includes(String(username).toLowerCase())) failed.push('contains_username');
  if (currentPassword && pw === currentPassword) failed.push('same_as_current');
  if (onlyGuessableWords(lower.replace(/[^a-z]/g, ''))) failed.push('guessable');
  return failed;
}

/**
 * Have I Been Pwned k-anonymity range check. Only the first 5 hex chars of the SHA-1 leave the server.
 * Returns true (leaked), false (not found) or null (service unreachable — caller should not block).
 */
export async function isLeakedPassword(plain) {
  const sha1 = createHash('sha1').update(String(plain)).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'kotoha-fansite' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const body = await res.text();
    return body.split('\n').some((line) => {
      const [hashSuffix, count] = line.trim().split(':');
      return hashSuffix === suffix && Number(count) > 0;
    });
  } catch {
    return null;
  }
}

// 8 characters without look-alikes (no 0/O, 1/l/I).
const TEMP_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
export function generateTempPassword(length = 8) {
  let out = '';
  for (let i = 0; i < length; i++) out += TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)];
  return out;
}
