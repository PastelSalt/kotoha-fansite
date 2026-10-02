// Motion preference: "full" or "calm". Calm when the device asks for reduced motion or the visitor turned
// motion off with the site's toggle (remembered in this browser only). Drives <html data-motion> for CSS.
const KEY = 'kf_motion';
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const listeners = new Set();

function readOff() {
  try { return localStorage.getItem(KEY) === 'off'; } catch { return false; }
}
let userOff = readOff();

export const deviceReduces = () => reduceQuery.matches;
export const motionMode = () => (deviceReduces() || userOff ? 'calm' : 'full');
export const isCalm = () => motionMode() === 'calm';

function apply() {
  const mode = motionMode();
  document.documentElement.dataset.motion = mode;
  document.querySelectorAll('[data-motion-toggle]').forEach(syncToggle);
  listeners.forEach((cb) => cb(mode));
}

function syncToggle(btn) {
  const on = motionMode() === 'full';
  btn.setAttribute('aria-pressed', String(on));
  const label = btn.querySelector('[data-motion-label]');
  if (label) label.textContent = on ? (btn.dataset.labelOn || 'Motion on') : (btn.dataset.labelOff || 'Motion off');
  // When the device itself asks for less motion, the site respects it and the toggle can't override it.
  btn.toggleAttribute('disabled', deviceReduces());
  btn.title = deviceReduces() ? (btn.dataset.labelDevice || 'Your device asks for less motion') : '';
}

/** Calls cb(mode) now and whenever the mode changes. Returns an unsubscribe function. */
export function onMotionChange(cb) {
  listeners.add(cb);
  cb(motionMode());
  return () => listeners.delete(cb);
}

export function setMotionOff(off) {
  userOff = off;
  try { if (off) localStorage.setItem(KEY, 'off'); else localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  apply();
}

/** Re-reads the toggles' translated labels (data-label-on/off/device) — call after a language change. */
export function refreshMotionToggles() {
  document.querySelectorAll('[data-motion-toggle]').forEach(syncToggle);
}

/** Wires every [data-motion-toggle] button (nav + footer). */
export function mountMotionToggles(root = document) {
  root.querySelectorAll('[data-motion-toggle]').forEach((btn) => {
    if (btn.dataset.motionBound) return;
    btn.dataset.motionBound = '1';
    btn.addEventListener('click', () => setMotionOff(!userOff));
    syncToggle(btn);
  });
}

reduceQuery.addEventListener('change', apply);
apply();
