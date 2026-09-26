// Cookieless first-party analytics. Events are batched and sent with sendBeacon to /api/track;
// nothing is stored in the browser (the visit id lives only in memory for this page load).
import { currentLang } from '../shared/i18n-core.js';

const ENDPOINT = '/api/track';
const visitId = crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
const queue = [];

function device() {
  if (!matchMedia('(pointer: coarse)').matches) return 'desktop';
  return Math.min(screen.width, screen.height) < 600 ? 'mobile' : 'tablet';
}

function referrerHost() {
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : '';
    return host && host !== location.hostname ? host : '';
  } catch { return ''; }
}

// ---------------------------------------------------------------- section dwell time
let section = null;
let since = 0;          // performance.now() when the current stretch started; 0 = not counting
let counting = false;   // starts once the loader is gone
const dwell = {};

function closeStretch() {
  if (section && since) dwell[section] = (dwell[section] || 0) + (performance.now() - since);
  since = counting && section && document.visibilityState === 'visible' ? performance.now() : 0;
}

/** The section in view changed. */
export function setSection(name) {
  closeStretch();
  section = name;
  since = counting && document.visibilityState === 'visible' ? performance.now() : 0;
}

/** Begin measuring dwell time (called after the loader hides). */
export function startDwell() {
  counting = true;
  since = section && document.visibilityState === 'visible' ? performance.now() : 0;
}

// ---------------------------------------------------------------- sending
export function track(type, data = {}) {
  queue.push({ t: type, ...data });
  if (queue.length >= 25) flush();
}

export function flush() {
  closeStretch();
  for (const [s, ms] of Object.entries(dwell)) {
    if (ms >= 500) queue.push({ t: 'section_dwell', s, ms: Math.round(ms) });
    delete dwell[s];
  }
  if (!queue.length) return;
  const body = JSON.stringify({ v: visitId, d: device(), l: currentLang(), r: referrerHost(), e: queue.splice(0) });
  try {
    if (navigator.sendBeacon?.(ENDPOINT, body)) return;
  } catch { /* fall through */ }
  fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {});
}

/** Wires page-lifecycle flushing and click tracking for elements with data-track attributes. */
export function initTracking() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
    else since = counting && section ? performance.now() : 0;
  });
  window.addEventListener('pagehide', flush);
  // Capture phase: runs before handlers that replace the clicked element (e.g. the video facade).
  document.addEventListener('click', (e) => {
    const n = e.target.closest?.('[data-track]');
    if (!n) return;
    const { track: type, trackId, trackTarget, trackType } = n.dataset;
    track(type, {
      ...(trackId ? { id: Number(trackId) } : {}),
      ...(trackTarget ? { tg: trackTarget } : {}),
      ...(trackType ? { ct: trackType } : {}),
    });
  }, true);
}
