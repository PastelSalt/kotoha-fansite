// Visual effects. Ownership (plan §11): GSAP = section entrances; Anime.js = micro-interactions; canvas-confetti = celebrations.
import { reducedMotion } from './scroll.js';

// ---------------------------------------------------------------- confetti
let cloverShape = null;
export function confettiBurst(originEl) {
  const confetti = window.confetti;
  if (!confetti || reducedMotion) return;
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

// ---------------------------------------------------------------- Anime.js micro-interactions
export function boing(target) {
  if (!window.anime || reducedMotion) return;
  window.anime({ targets: target, scale: [1, 1.08, 0.97, 1], rotate: [0, -3, 2, 0], duration: 650, easing: 'easeOutElastic(1, .6)' });
}

export function staggerIn(targets) {
  if (!window.anime || reducedMotion) return;
  window.anime({ targets, translateX: [-24, 0], opacity: [0, 1], delay: window.anime.stagger(55, { start: 90 }), duration: 420, easing: 'easeOutQuad' });
}

export function cloverBloom(button) {
  if (!window.anime || reducedMotion) return;
  window.anime({ targets: button.querySelectorAll('.menu-btn__clovers i'), rotate: ['0deg', '90deg'], scale: [1, 1.15, 1], delay: window.anime.stagger(60), duration: 500, easing: 'easeOutBack' });
}

// ---------------------------------------------------------------- GSAP section entrances
const ENTRANCE_TARGETS = {
  about: ['.banner', '.avatar', '.about-bio', '.pill--name', '.pills li', '.about-stage'],
  news: ['.banner', '.news-card', '.card--player', '.card--video-list'],
  discography: ['.banner', '.release', '.card--achievements'],
  gallery: ['.banner', '.card--gallery'],
};
const played = new Set();

export function prepareEntrances() {
  const gsap = window.gsap;
  if (!gsap || reducedMotion) return;
  for (const [id, selectors] of Object.entries(ENTRANCE_TARGETS)) {
    const section = document.getElementById(id);
    const targets = selectors.flatMap((s) => [...section.querySelectorAll(s)]);
    gsap.set(targets, { autoAlpha: 0, y: 26 });
  }
  // Safety net: play a section's entrance when any part of it is visible, even if the active-section logic misses.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) playEntrance(e.target.id); });
  }, { threshold: 0.12 });
  Object.keys(ENTRANCE_TARGETS).forEach((id) => io.observe(document.getElementById(id)));
}

export function playEntrance(id) {
  const gsap = window.gsap;
  if (!gsap || reducedMotion || played.has(id) || !ENTRANCE_TARGETS[id]) return;
  played.add(id);
  const section = document.getElementById(id);
  const targets = ENTRANCE_TARGETS[id].flatMap((s) => [...section.querySelectorAll(s)]);
  gsap.to(targets, { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.05, ease: 'power3.out', clearProps: 'transform' });
}

/** Items added later (paged lists) should just be visible. */
export function revealLate(nodes) {
  if (window.gsap && !reducedMotion) window.gsap.set(nodes, { autoAlpha: 1, y: 0 });
}

export function homeEntrance() {
  const gsap = window.gsap;
  if (!gsap || reducedMotion) return;
  gsap.from(['.hero-header__logo', '.hero-header__right', '.home-grid .card', '.home-grid .sticker--heading', '.section--home .scroll-more'],
    { autoAlpha: 0, y: 20, duration: 0.7, stagger: 0.06, ease: 'power3.out', clearProps: 'all' });
}
