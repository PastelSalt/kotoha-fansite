// Section transition "wipe": a quick diagonal-striped panel in the next section's accent colour sweeps across
// (bottom→top when going down, top→bottom when going up). `onCovered` runs while the screen is covered.
// Calm mode: no wipe, onCovered runs immediately.
import { isCalm } from './prefs.js';
import { beatsMs } from './beat.js';

export function playWipe({ direction = 'down', accent = 'var(--accent-home)', onCovered } = {}) {
  if (isCalm() || !Element.prototype.animate) {
    onCovered?.();
    return Promise.resolve();
  }
  const el = document.createElement('div');
  el.className = 'wipe';
  el.setAttribute('aria-hidden', 'true');
  el.style.setProperty('--wipe-accent', accent);
  document.body.append(el);
  const down = direction === 'down';
  const hidden = down ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
  const gone = down ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)';
  const full = 'inset(0 0 0 0)';
  const cover = el.animate([{ clipPath: hidden }, { clipPath: full }], { duration: beatsMs(0.6), easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' });
  return cover.finished.then(() => {
    onCovered?.();
    return el.animate([{ clipPath: full }, { clipPath: gone }], { duration: beatsMs(0.7), delay: beatsMs(0.1), easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }).finished;
  }).finally(() => el.remove());
}
