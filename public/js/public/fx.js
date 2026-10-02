// Visual effects. Ownership: native CSS (css/v2/motion.css) = scroll-linked life, hovers, reveals;
// GSAP = the arrival choreography (home intro, title letters); canvas-confetti = celebrations.
import { isCalm } from './motion/prefs.js';
import { beats } from './motion/beat.js';
import { popLetters } from './motion/text.js';

// ---------------------------------------------------------------- confetti
let cloverShape = null;
export function confettiBurst(originEl) {
  const confetti = window.confetti;
  if (!confetti || isCalm()) return;
  try { cloverShape ??= confetti.shapeFromText({ text: '🍀', scalar: 2 }); } catch { cloverShape = null; }
  let origin = { x: 0.5, y: 0.45 };
  if (originEl) {
    const r = originEl.getBoundingClientRect();
    origin = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
  }
  confetti({
    particleCount: 60, spread: 75, startVelocity: 38, origin, ticks: 220, scalar: 1.2,
    colors: ['#63a23d', '#9bd86c', '#fe9fb9', '#ffffff', '#ffd166'],
    shapes: cloverShape ? [cloverShape, 'circle'] : ['circle', 'square'],
    disableForReducedMotion: true,
  });
}

/** June 10 (birthday) and July 8 (debut anniversary), in Japan time. */
export function celebrateSpecialDays() {
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  const md = `${jst.getUTCMonth() + 1}-${jst.getUTCDate()}`;
  if (md === '6-10' || md === '7-8') {
    confettiBurst();
    setTimeout(() => confettiBurst(), 700);
  }
}

// ---------------------------------------------------------------- tap feedback (Web Animations — no library)
export function boing(target) {
  if (!target?.animate || isCalm()) return;
  target.animate([
    { scale: 1, rotate: '0deg' }, { scale: 1.08, rotate: '-3deg', offset: 0.35 }, { scale: 0.97, rotate: '2deg', offset: 0.7 }, { scale: 1, rotate: '0deg' },
  ], { duration: 650, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
}

// ---------------------------------------------------------------- arrival choreography (GSAP, in beats)
/** Home arrives after the loader's iris opens: the two side columns slide in from their edges, the badge spins in. */
export function homeIntro() {
  const gsap = window.gsap;
  if (!gsap || isCalm()) return;
  const clear = { clearProps: 'transform,opacity,visibility' };
  gsap.from('.site-nav', { y: -80, opacity: 0, duration: beats(1.2), ease: 'power3.out', ...clear });
  gsap.from('.home-comp__left', { x: -80, opacity: 0, duration: beats(1.6), ease: 'power3.out', ...clear });
  gsap.from('.home-comp__right', { x: 80, opacity: 0, duration: beats(1.6), delay: beats(0.25), ease: 'power3.out', ...clear });
  gsap.from('.home-badge', { scale: 0, rotation: -140, duration: beats(1.6), delay: beats(1), ease: 'back.out(1.8)', ...clear });
  gsap.from('.scene--home > .marquee', { yPercent: 160, duration: beats(1.2), delay: beats(0.8), ease: 'power3.out', ...clear });
}

/** Section titles pop in letter by letter the first time each one arrives. */
export function popTitlesOnArrival() {
  const gsap = window.gsap;
  if (!gsap || !window.SplitText) return;
  gsap.registerPlugin(window.SplitText);
  const seen = new WeakSet();
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting || seen.has(e.target) || isCalm()) return;
    seen.add(e.target);
    popLetters(e.target.querySelector('[data-i18n]') || e.target, gsap, { stagger: 0.035 });
  }), { threshold: 0.6 });
  document.querySelectorAll('.scene .sec-title__en').forEach((h) => io.observe(h));
}
