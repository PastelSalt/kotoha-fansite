// Scrolling: Lenis (smooth wheel) + a direction-aware "strict snap" + ScrollTrigger sync.
//
// Why not lenis-snap: its 1.1.18 logic snaps to the NEAREST point, so a normal wheel notch snaps back to the
// same section (tested). Here, once scrolling pauses, the page glides to the next snap point in the direction
// the visitor scrolled (like native CSS mandatory snap), tiny nudges settle back, and input is locked during
// the glide. Snap points are section tops (and ends of sections taller than the screen). Inside the gallery
// (it grows with its content) snapping is off. Reduced motion → no Lenis, native CSS snap only.
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;

const SETTLE_MS = 140;       // quiet time after the last scroll event before snapping
const NUDGE_PX = 50;         // smaller movements (e.g. a trackpad brush) settle back; a wheel notch is ~100px
const DURATION = 0.8;        // seconds for the glide
const ease = (t) => 1 - Math.pow(1 - t, 3);

let lenis = null;
let anchor = 0;
let snapping = false;
let settleTimer = 0;
let points = [];
let galleryTop = Infinity;
let lastWidth = 0;

/** Locks section height to the real viewport so mobile URL-bar changes don't move snap points. */
function setAppHeight(force = false) {
  const w = window.innerWidth;
  if (!force && isTouch && w === lastWidth) return; // ignore height-only changes on phones
  lastWidth = w;
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}

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

function glideTo(target, onDone) {
  snapping = true;
  lenis.scrollTo(target, {
    duration: DURATION,
    easing: ease,
    lock: true,
    force: true,
    onComplete: () => {
      snapping = false;
      anchor = target;
      onDone?.();
    },
  });
}

function settle() {
  const y = lenis.scroll;
  if (inFreeZone(y)) { anchor = y; return; }
  const delta = y - anchor;
  let target = anchor;
  if (Math.abs(delta) >= NUDGE_PX) {
    if (delta > 0) target = points.find((p) => p > anchor + 1 && p >= y - 1) ?? points.at(-1);
    else target = [...points].reverse().find((p) => p < anchor - 1 && p <= y + 1) ?? points[0];
  }
  if (Math.abs(target - y) < 1) { anchor = target; return; }
  glideTo(target);
}

export async function initScroll({ onActiveChange }) {
  setAppHeight(true);
  window.addEventListener('resize', () => {
    setAppHeight();
    computePoints();
  });

  const sections = [...document.querySelectorAll('[data-section]')];

  if (window.Lenis && !reducedMotion) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      window.ScrollTrigger.config({ ignoreMobileResize: true });
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    lenis.on('scroll', () => {
      if (snapping) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, SETTLE_MS);
    });
  } else {
    document.documentElement.classList.add('native-snap');
  }

  computePoints();
  anchor = window.scrollY;
  if (new URLSearchParams(location.search).has('debug')) {
    window.__kfScroll = { lenis, get anchor() { return anchor; }, get points() { return points; }, get snapping() { return snapping; } };
  }
  // Content that loads later (lists, gallery pages) changes section heights.
  new ResizeObserver(() => computePoints()).observe(document.body);

  // Active section = the one crossing the middle of the viewport.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) onActiveChange(e.target.dataset.section);
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));

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
    else glideTo(top);
  } else {
    target.scrollIntoView({ behavior: reducedMotion || immediate ? 'auto' : 'smooth' });
  }
  if (id) history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
}

export function lockScroll() { lenis?.stop(); document.documentElement.classList.add('scroll-locked'); }
export function unlockScroll() { lenis?.start(); document.documentElement.classList.remove('scroll-locked'); }

export function refreshScroll() {
  computePoints();
  anchor = window.scrollY;
  window.ScrollTrigger?.refresh();
  lenis?.resize();
}
