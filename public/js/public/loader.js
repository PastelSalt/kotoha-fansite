// Loading screen v2: random artwork, real progress (the inner clover's four petals fill as the tiers complete),
// "Did you know?" facts, tiered preloading (min 3 s / soft 6 s / hard cap 10 s) and an iris-open exit.
// The two clovers are pure CSS animation in static markup, so they turn from the very first paint.
import { t } from '../shared/i18n-core.js';
import { mountSpinner } from './motion/spinner.js';
import { waveText } from './motion/text.js';
import { isCalm } from './motion/prefs.js';

const MIN_MS = 3000;
const SOFT_MS = 6000;
const CAP_MS = 10000;
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

let spinner = null;
let factTimer = 0;

/** The artwork itself is pure CSS (layout.css, keyed by html[data-loader-art]); this just wakes the spinner's petals. */
export function showLoaderArt() {
  spinner = mountSpinner(document.getElementById('loader-spinner'));
}

/** Wave "Loading…" + rotating "Did you know?" facts (needs the language to be loaded; call again on language change). */
export function showLoaderText() {
  const text = document.getElementById('loader-text');
  if (!text) return;
  waveText(text, t('loader.loading'));
  const pills = t('about.pills');
  const fact = document.getElementById('loader-fact');
  clearInterval(factTimer);
  if (!Array.isArray(pills) || !pills.length || !fact) return;
  let i = Math.floor(Math.random() * pills.length);
  const show = () => { const p = pills[i++ % pills.length]; fact.textContent = `${t('loader.didYouKnow')} ${p.label}: ${p.value}`; };
  show();
  factTimer = setInterval(show, 2800);
}

/**
 * Waits for Tier 1 (required) and Tier 2 (preferred) tasks. Returns when:
 * elapsed ≥ 3 s AND Tier 1 done AND (Tier 2 done OR 6 s passed) — or at the 10 s cap regardless.
 * Each task is a function returning a promise; failures count as "done" (the page shows fallbacks).
 * `onProgress(0…1)` reports how many tasks have finished (drives the petals).
 */
export async function waitForAssets({ tier1, tier2 }) {
  const start = performance.now();
  const elapsed = () => performance.now() - start;
  const total = tier1.length + tier2.length;
  let finished = 0;
  const run = (tasks) => Promise.allSettled(tasks.map((fn) => Promise.resolve().then(fn).finally(() => {
    finished += 1;
    spinner?.setProgress(finished / total);
  })));
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

/** Exit: all petals lit → one fast spin → a circle opens from the clover onto Home. Calm mode / old browsers: plain fade. */
export async function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  clearInterval(factTimer);
  spinner?.complete();
  const host = document.getElementById('loader-spinner');
  const calm = isCalm();
  const supportsIris = !!(window.CSS && CSS.registerProperty) && CSS.supports('mask-image', 'radial-gradient(circle, #000, #0000)');
  if (!calm) {
    host.classList.add('is-whoosh');
    await sleep(520);
    if (supportsIris) {
      const box = loader.getBoundingClientRect();
      const s = host.getBoundingClientRect();
      loader.style.setProperty('--iris-x', `${s.left + s.width / 2 - box.left}px`);
      loader.style.setProperty('--iris-y', `${s.top + s.height / 2 - box.top}px`);
    }
  }
  if (calm || !supportsIris) loader.classList.add('fade-out');
  loader.classList.add('is-open');
  await sleep(calm ? 320 : supportsIris ? 950 : 560);
  loader.classList.add('is-done');
  loader.setAttribute('aria-busy', 'false');
  setTimeout(() => loader.remove(), 60);
}
