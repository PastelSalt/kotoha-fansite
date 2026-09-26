// Cloudinary helpers (no SDK): signed-upload parameters, response verification, destroy, delivery URLs.
import { createHash } from 'node:crypto';
import { HttpError } from './http.js';

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new HttpError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Image uploads are not configured yet');
  }
  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_FOLDER || 'kotoha-fansite/gallery',
    preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'kotoha_gallery_signed',
  };
}

const sha1 = (s) => createHash('sha1').update(s).digest('hex');

/** Cloudinary signature: sorted `key=value` pairs joined with & + api_secret, SHA-1. */
export function signParams(params, apiSecret) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${Array.isArray(params[k]) ? params[k].join(',') : params[k]}`)
    .join('&');
  return sha1(toSign + apiSecret);
}

export const UPLOAD_TAG = 'kotoha-gallery';

/** Parameters the admin's browser needs for a direct signed upload (valid ~1 hour on Cloudinary's side). */
export function signedUploadParams() {
  const c = config();
  const params = {
    timestamp: Math.floor(Date.now() / 1000),
    folder: c.folder,
    upload_preset: c.preset,
    tags: UPLOAD_TAG,
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${c.cloudName}/image/upload`,
    cloudName: c.cloudName,
    apiKey: c.apiKey,
    ...params,
    signature: signParams(params, c.apiSecret),
  };
}

/** Verifies the signature Cloudinary returns in an upload response (public_id + version). */
export function verifyUploadResponse({ publicId, version, signature }) {
  const c = config();
  if (!publicId || !version || !signature) return false;
  return sha1(`public_id=${publicId}&version=${version}${c.apiSecret}`) === String(signature);
}

function authHeader(c) {
  return `Basic ${Buffer.from(`${c.apiKey}:${c.apiSecret}`).toString('base64')}`;
}

/** Authoritative resource details from the Admin API (don't trust client-reported sizes). */
export async function getResource(publicId) {
  const c = config();
  const url = `https://api.cloudinary.com/v1_1/${c.cloudName}/resources/image/upload/${publicId
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
  const res = await fetch(url, { headers: { Authorization: authHeader(c) }, signal: AbortSignal.timeout(8000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new HttpError(502, 'CLOUDINARY_ERROR', 'Could not read the uploaded image');
  return res.json();
}

/** Permanently deletes an image and invalidates CDN copies. Returns true if deleted or already gone. */
export async function destroyImage(publicId) {
  const c = config();
  const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000), invalidate: 'true' };
  const body = new URLSearchParams({ ...params, api_key: c.apiKey, signature: signParams(params, c.apiSecret) });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/image/destroy`, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(8000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(502, 'CLOUDINARY_ERROR', 'Could not delete the image file');
  return json.result === 'ok' || json.result === 'not found';
}

/** Delivery URL with automatic format/quality; width-limited, never cropped unless `crop` is given. */
export function deliveryUrl(publicId, version, { width, crop = 'limit' } = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const t = ['f_auto', 'q_auto', width ? `c_${crop},w_${width}` : null].filter(Boolean).join(',');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${t}/v${version}/${publicId}`;
}

// Allowed formats (mirrors the signed upload preset).
export const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'heic', 'heif'];
