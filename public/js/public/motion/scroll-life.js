// "Alive while scrolling": measures scroll velocity (smoothed, px/ms, + = down) and turns it into a gentle
// lean (--lean on <html>, −2…2) that elements with .lean follow via CSS. Settles back to 0 when scrolling stops.
// Parallax, art camera and reveals are native CSS scroll-driven animations (see css/v2/motion.css).
import { isCalm, onMotionChange } from './prefs.js';

const root = document.documentElement;
const MAX_LEAN = 2;              // degrees
const listeners = new Set();
let lastY = 0;
let lastT = 0;
let velocity = 0;
let lean = 0;
let raf = 0;

export const scrollVelocity = () => velocity;

/** cb(velocity) every animation frame while the page is scrolling (and once with 0 when it settles). */
export function onScrollVelocity(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function frame(t) {
  const y = window.scrollY;
  const dt = Math.max(8, t - lastT);
  const instant = (y - lastY) / dt;
  lastY = y;
  lastT = t;
  velocity += (instant - velocity) * 0.25;
  lean += (Math.max(-MAX_LEAN, Math.min(MAX_LEAN, velocity * 1.4)) - lean) * 0.12;
  const settled = Math.abs(lean) < 0.01 && Math.abs(velocity) < 0.003;
  if (settled) { velocity = 0; lean = 0; }
  root.style.setProperty('--lean', lean.toFixed(3));
  listeners.forEach((cb) => cb(velocity));
  raf = settled ? 0 : requestAnimationFrame(frame);
}

function wake() {
  if (raf || isCalm()) return;
  lastY = window.scrollY;
  lastT = performance.now();
  raf = requestAnimationFrame(frame);
}

let started = false;
export function startScrollLife() {
  if (started) return;
  started = true;
  window.addEventListener('scroll', wake, { passive: true });
  onMotionChange((mode) => {
    if (mode === 'calm') {
      cancelAnimationFrame(raf);
      raf = 0; velocity = 0; lean = 0;
      root.style.setProperty('--lean', '0');
    }
  });
}

/** Page scroll progress 0…1 (for the nav clover). */
export function pageProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}
