// Loading screen: random artwork, tiered preloading, min 3 s / soft 6 s / hard cap 10 s, clover-bloom exit.
import { CREDITS } from './data.js';
import { t } from '../shared/i18n-core.js';

const MIN_MS = 3000;
const SOFT_MS = 6000;
const CAP_MS = 10000;
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

export function showLoaderArt() {
  const n = document.documentElement.dataset.loaderArt || '1';
  const name = `loader${n}`;
  const img = document.getElementById('loader-art-img');
  const portrait = document.getElementById('loader-art-portrait');
  portrait.srcset = `/assets/bg/${name}-p720.webp 720w, /assets/bg/${name}-p1080.webp 1080w`;
  img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
  img.srcset = `/assets/bg/${name}-1280.webp 1280w, /assets/bg/${name}-1920.webp 1920w, /assets/bg/${name}-2560.webp 2560w`;
  img.src = `/assets/bg/${name}-1280.webp`;
  updateLoaderCredit();
}

export function updateLoaderCredit() {
  const credit = CREDITS[`loader${document.documentElement.dataset.loaderArt || '1'}`];
  const a = document.getElementById('loader-art-credit');
  if (!a) return;
  if (credit) {
    a.href = credit.url;
    a.textContent = `${t('common.artBy')} ${credit.handle}`;
  } else {
    a.removeAttribute('href');
    a.textContent = t('common.artUnknown');
  }
  a.hidden = false;
}

/**
 * Waits for Tier 1 (required) and Tier 2 (preferred) tasks. Returns when:
 * elapsed ≥ 3 s AND Tier 1 done AND (Tier 2 done OR 6 s passed) — or at the 10 s cap regardless.
 * Each task is a function returning a promise; failures count as "done" (the page shows fallbacks).
 */
export async function waitForAssets({ tier1, tier2 }) {
  const start = performance.now();
  const elapsed = () => performance.now() - start;
  const run = (tasks) => Promise.allSettled(tasks.map((fn) => Promise.resolve().then(fn)));
  const t1 = run(tier1);
  const t2 = t1.then(() => run(tier2));
  await Promise.race([
    (async () => {
      await t1;
      await Promise.race([t2, sleep(SOFT_MS - elapsed())]);
    })(),
    sleep(CAP_MS),
  ]);
  await sleep(MIN_MS - elapsed());
  return Math.round(elapsed());
}

/** Clover-bloom exit (GSAP) or a plain fade under reduced motion / without GSAP. */
export async function hideLoader({ reduced }) {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const gsap = window.gsap;
  if (gsap && !reduced) {
    const tl = gsap.timeline();
    tl.to('.loader__clover', { scale: 1.15, duration: 0.25, ease: 'power2.out' })
      .to('.loader__clover', { scale: 28, opacity: 0, duration: 0.9, ease: 'power3.in' })
      .to(['.loader__logo', '.loader__text', '.loader__moesoft', '.loader__made', '.loader__art-credit'],
        { opacity: 0, y: 12, duration: 0.35, stagger: 0.04, ease: 'power1.in' }, '<')
      .to(loader, { opacity: 0, duration: 0.45, ease: 'power1.out' }, '-=0.35');
    await tl.then();
  }
  loader.classList.add('is-done');
  loader.setAttribute('aria-busy', 'false');
  setTimeout(() => loader.remove(), reduced ? 50 : 700);
}
