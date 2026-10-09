// "Alive while scrolling": the site's single scroll ticker. While the page scrolls (and until it settles) one
// requestAnimationFrame loop measures scroll velocity (smoothed, px/ms, + = down) and
//  · turns it into a gentle lean (−2…2°) for the .lean cards that are ON SCREEN (written as --lean on each card,
//    never on <html>: a root custom property would restyle the whole document every frame);
//  · hands the velocity to subscribers (marquee speed, nav progress clover), so they need no loops of their own.
// Parallax, art camera and reveals are native CSS scroll-driven animations (see css/v2/motion.css).
import { isCalm, onMotionChange } from './prefs.js';

const MAX_LEAN = 2;              // degrees
const MAX_SPEED = 8;             // px/ms: a jump (keyboard End, instant anchor) counts as a fast scroll, not infinite
const QUIET_MS = 150;            // keep measuring this long after the last scroll event
const listeners = new Set();
const visible = new Set();       // .lean elements currently on screen
let lastY = window.scrollY;      // kept between wakes, so the first frame measures the move that woke the loop
let lastT = 0;
let lastEvent = 0;
let velocity = 0;
let lean = 0;
let written = 0;                 // lean value last written to the cards
let raf = 0;

export const scrollVelocity = () => velocity;

/** cb(velocity) every animation frame while the page is scrolling (and once with 0 when it settles). */
export function onScrollVelocity(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function writeLean(value) {
  const v = value.toFixed(3);
  visible.forEach((el) => { if (el.isConnected) el.style.setProperty('--lean', v); else visible.delete(el); });
  written = value;
}

function frame(t) {
  const y = window.scrollY;
  const dt = Math.max(8, t - lastT);
  const instant = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, (y - lastY) / dt));
  lastY = y;
  lastT = t;
  velocity += (instant - velocity) * 0.25;
  const calm = isCalm();
  if (!calm) lean += (Math.max(-MAX_LEAN, Math.min(MAX_LEAN, velocity * 1.4)) - lean) * 0.12;
  const settled = t - lastEvent > QUIET_MS && Math.abs(lean) < 0.01 && Math.abs(velocity) < 0.003;
  if (settled) { velocity = 0; lean = 0; }
  if (!calm && (settled ? written !== 0 : Math.abs(lean - written) > 0.004)) writeLean(lean);
  listeners.forEach((cb) => cb(velocity));
  raf = settled ? 0 : requestAnimationFrame(frame);
}

function wake() {
  lastEvent = performance.now();
  if (raf) return;
  lastT = lastEvent - 16;
  raf = requestAnimationFrame(frame);
}

// Cards come and go (lists, gallery pages, language switches): watch every .lean element that enters the page.
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { visible.add(e.target); e.target.style.setProperty('--lean', written.toFixed(3)); }
  else { visible.delete(e.target); e.target.style.removeProperty('--lean'); }
}));
function watchLean(root) {
  if (root.nodeType !== 1) return;
  if (root.classList.contains('lean')) io.observe(root);
  root.querySelectorAll('.lean').forEach((el) => io.observe(el));
}

let started = false;
export function startScrollLife() {
  if (started) return;
  started = true;
  watchLean(document.body);
  new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach(watchLean)))
    .observe(document.body, { childList: true, subtree: true });
  window.addEventListener('scroll', wake, { passive: true });
  onMotionChange((mode) => {
    if (mode === 'calm') { lean = 0; writeLean(0); }
  });
}

// Scrollable height, cached: reading scrollHeight inside the frame loop would force a layout pass every frame.
let maxScroll = -1;
const forgetMax = () => { maxScroll = -1; };
new ResizeObserver(forgetMax).observe(document.documentElement);
window.addEventListener('resize', forgetMax);

/** Page scroll progress 0…1 (for the nav clover). */
export function pageProgress() {
  if (maxScroll < 0) maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
}
