// Scrolling.
//  · Desktop mouse + full motion: Lenis (smooth wheel) + a direction-aware "strict snap": once scrolling pauses,
//    the page glides to the next section in the direction the visitor scrolled, tiny nudges settle back, and input
//    is locked during the glide. Snap points are section tops (and ends of sections taller than the screen);
//    inside the gallery (it grows with its content) snapping is off.
//  · Phones, tablets, calm mode (reduced motion or the site's toggle): plain native free scrolling — the fixed
//    artwork backdrop crossfades between sections, so there is never a hard edge.
// Why not lenis-snap: its 1.1.18 logic snaps to the NEAREST point, so a normal wheel notch snaps back to the same
// section (tested). This keeps the old behaviour of CSS mandatory snap.
import { isCalm, onMotionChange } from './motion/prefs.js';

const fineMouse = matchMedia('(hover: hover) and (pointer: fine)');

const SETTLE_MS = 140;       // quiet time after the last scroll event before snapping
const NUDGE_PX = 50;         // smaller movements (e.g. a trackpad brush) settle back; a wheel notch is ~100px
const DURATION = 0.8;        // seconds for the glide
const ease = (t) => 1 - Math.pow(1 - t, 3);

let lenis = null;
let tickFn = null;
let rafId = 0;
let anchor = 0;
let snapping = false;
let settleTimer = 0;
let points = [];
let galleryTop = Infinity;
let onSnap = null;

const smoothAllowed = () => !!window.Lenis && !isCalm() && fineMouse.matches;

function computePoints() {
  const vh = window.innerHeight;
  const y = window.scrollY;
  const set = new Set();
  document.querySelectorAll('section[data-section]').forEach((s) => {
    const r = s.getBoundingClientRect();
    const top = Math.round(r.top + y);
    set.add(top);
    if (s.id === 'gallery') galleryTop = top;
    else if (r.height > vh + 4) set.add(Math.round(top + r.height - vh)); // end of a tall section
  });
  points = [...set].sort((a, b) => a - b);
}

// Free zones: inside a tall section (between its top and end point) and anywhere below the gallery top.
function inFreeZone(y) {
  if (y > galleryTop + 4) return true;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]; const b = points[i + 1];
    // consecutive points closer than a screen apart belong to one tall section
    if (b - a < window.innerHeight - 4 && y > a + 4 && y < b - 4) return true;
  }
  return false;
}

function glideTo(target, direction) {
  snapping = true;
  onSnap?.(direction);
  lenis.scrollTo(target, {
    duration: DURATION, easing: ease, lock: true, force: true,
    onComplete: () => { snapping = false; anchor = target; },
  });
}

function settle() {
  if (!lenis) return;
  const y = lenis.scroll;
  if (inFreeZone(y)) { anchor = y; return; }
  const delta = y - anchor;
  let target = anchor;
  if (Math.abs(delta) >= NUDGE_PX) {
    if (delta > 0) target = points.find((p) => p > anchor + 1 && p >= y - 1) ?? points.at(-1);
    else target = [...points].reverse().find((p) => p < anchor - 1 && p <= y + 1) ?? points[0];
  }
  if (Math.abs(target - y) < 1) { anchor = target; return; }
  glideTo(target, target > anchor ? 'down' : 'up');
}

function startSmooth() {
  if (lenis || !smoothAllowed()) return;
  lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  const gsap = window.gsap;
  if (gsap) {
    tickFn = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(tickFn);
    gsap.ticker.lagSmoothing(0);
  } else {
    const loop = (time) => { lenis?.raf(time); rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);
  }
  lenis.on('scroll', () => {
    if (snapping) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, SETTLE_MS);
  });
  computePoints();
  anchor = window.scrollY;
}

function stopSmooth() {
  if (!lenis) return;
  clearTimeout(settleTimer);
  if (tickFn) window.gsap?.ticker.remove(tickFn);
  cancelAnimationFrame(rafId);
  tickFn = null; rafId = 0; snapping = false;
  lenis.destroy();
  lenis = null;
}

/** `onSectionSnap(direction)` fires when a snap glide starts (hook for the desktop section transition). */
export function initScroll({ onSectionSnap } = {}) {
  onSnap = onSectionSnap;
  startSmooth();
  window.addEventListener('resize', computePoints);
  // Content that loads later (lists, gallery pages) changes section heights.
  new ResizeObserver(() => computePoints()).observe(document.body);
  onMotionChange(() => { if (smoothAllowed()) startSmooth(); else stopSmooth(); });
  fineMouse.addEventListener('change', () => { if (smoothAllowed()) startSmooth(); else stopSmooth(); });
  if (new URLSearchParams(location.search).has('debug')) {
    window.__kfScroll = { get lenis() { return lenis; }, get anchor() { return anchor; }, get points() { return points; }, get snapping() { return snapping; } };
  }

  // In-page anchors use the smooth scroller.
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#' || a.id === 'contact-mail') return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    ev.preventDefault();
    scrollToEl(target);
  });
}

export function scrollToEl(target, { immediate = false } = {}) {
  const id = target.id;
  if (lenis) {
    computePoints();
    const top = Math.round(target.getBoundingClientRect().top + window.scrollY);
    if (immediate) { lenis.scrollTo(top, { immediate: true, force: true }); anchor = top; }
    else glideTo(top, top > window.scrollY ? 'down' : 'up');
  } else {
    target.scrollIntoView({ behavior: isCalm() || immediate ? 'auto' : 'smooth' });
  }
  if (id) history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
}

export function lockScroll() { lenis?.stop(); document.documentElement.classList.add('scroll-locked'); }
export function unlockScroll() { lenis?.start(); document.documentElement.classList.remove('scroll-locked'); }

export function refreshScroll() {
  computePoints();
  anchor = window.scrollY;
  lenis?.resize();
}
