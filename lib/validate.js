// Input validation helpers. Each returns the cleaned value or records an error in `errors`.
// Usage:
//   const v = validator(body);
//   const title = v.text('title', { max: 200 });
//   v.throwIfInvalid();
import { HttpError } from './http.js';

export const LINK_LABELS = ['watch', 'listen', 'details', 'tickets', 'official', 'shop'];
export const RELEASE_TYPES = ['single', 'album', 'ep', 'tie_in', 'cover', 'collab', 'other'];
export const STATUSES = ['draft', 'published'];

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** Extracts an 11-char YouTube video ID from a URL or a bare ID; returns null if none. */
export function parseYouTubeId(input) {
  const s = String(input ?? '').trim();
  if (YT_ID.test(s)) return s;
  let url;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\.|^music\./, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v');
    if (!id) {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m ? m[1] : null;
    }
  }
  return id && YT_ID.test(id) ? id : null;
}

export function isHttpUrl(s) {
  try {
    const u = new URL(String(s));
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validator(body = {}) {
  const errors = {};
  const src = body && typeof body === 'object' ? body : {};
  const fail = (field, code) => {
    errors[field] ??= code;
    return undefined;
  };

  return {
    errors,
    has: (field) => Object.hasOwn(src, field),

    text(field, { required = true, min = 1, max = 500, trim = true } = {}) {
      let value = src[field];
      if (value === undefined || value === null || value === '') {
        return required ? fail(field, 'required') : null;
      }
      if (typeof value !== 'string') return fail(field, 'invalid');
      if (trim) value = value.trim();
      if (!value && required) return fail(field, 'required');
      if (!value) return null;
      if (value.length < min) return fail(field, 'too_short');
      if (value.length > max) return fail(field, 'too_long');
      return value;
    },

    date(field, { required = true } = {}) {
      const value = src[field];
      if (value === undefined || value === null || value === '') return required ? fail(field, 'required') : null;
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fail(field, 'invalid_date');
      const d = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return fail(field, 'invalid_date');
      return value;
    },

    url(field, { required = false, max = 2000 } = {}) {
      const value = src[field];
      if (value === undefined || value === null || value === '') return required ? fail(field, 'required') : null;
      if (typeof value !== 'string' || value.length > max || !isHttpUrl(value.trim())) return fail(field, 'invalid_url');
      return value.trim();
    },

    oneOf(field, allowed, { required = true, fallback } = {}) {
      const value = src[field];
      if (value === undefined || value === null || value === '') {
        if (fallback !== undefined) return fallback;
        return required ? fail(field, 'required') : null;
      }
      return allowed.includes(value) ? value : fail(field, 'invalid_choice');
    },

    youtubeId(field, { required = true } = {}) {
      const value = src[field];
      if (value === undefined || value === null || value === '') return required ? fail(field, 'required') : null;
      return parseYouTubeId(value) ?? fail(field, 'invalid_youtube');
    },

    links(field, { max = 3 } = {}) {
      const value = src[field];
      if (value === undefined || value === null) return [];
      if (!Array.isArray(value)) return fail(field, 'invalid');
      if (value.length > max) return fail(field, 'too_many');
      const out = [];
      for (const item of value) {
        if (!item || typeof item !== 'object') return fail(field, 'invalid');
        const url = typeof item.url === 'string' ? item.url.trim() : '';
        if (!url) continue; // empty rows from the form are ignored
        if (url.length > 2000 || !isHttpUrl(url)) return fail(field, 'invalid_url');
        const labelKey = LINK_LABELS.includes(item.labelKey) ? item.labelKey : 'details';
        out.push({ url, label_key: labelKey });
      }
      return out;
    },

    id(field) {
      const n = Number(src[field]);
      return Number.isSafeInteger(n) && n > 0 ? n : fail(field, 'invalid');
    },

    throwIfInvalid() {
      if (Object.keys(errors).length) throw new HttpError(422, 'VALIDATION_FAILED', 'Please check the highlighted fields', errors);
    },
  };
}

/** Parses a positive integer id from a route segment. */
export function parseId(segment) {
  const n = Number(segment);
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'NOT_FOUND', 'Not found');
  return n;
}
