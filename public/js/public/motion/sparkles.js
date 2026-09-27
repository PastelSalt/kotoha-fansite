// Cursor sparkle trail (desktop mouse only, subtle): a small pool of clover sparkles that fade behind the pointer.
// Off on touch devices and in calm mode. Purely decorative (aria-hidden, no pointer events).
import { isCalm } from './prefs.js';

export function startSparkles({ max = 12, every = 45, colors = ['#ef5f8d', '#63a23d', '#c9b6f4', '#fe9fb9', '#a3d37f'] } = {}) {
  if (!matchMedia('(pointer: fine)').matches) return;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  const pool = Array.from({ length: max }, () => {
    const s = document.createElement('span');
    s.className = 'sparkle';
    layer.append(s);
    return s;
  });
  document.body.append(layer);
  let next = 0;
  let lastSpawn = 0;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || isCalm()) return;
    const now = performance.now();
    if (now - lastSpawn < every) return;
    lastSpawn = now;
    const s = pool[next];
    next = (next + 1) % max;
    const size = 7 + Math.random() * 8;
    const x = e.clientX - size / 2;
    const y = e.clientY - size / 2;
    const dx = (Math.random() - 0.5) * 34;
    const dy = 12 + Math.random() * 26;
    s.style.width = `${size}px`;
    s.style.height = `${size}px`;
    s.style.setProperty('--sparkle-color', colors[Math.floor(Math.random() * colors.length)]);
    s.animate([
      { opacity: 0.95, transform: `translate(${x}px, ${y}px) scale(1) rotate(0deg)` },
      { opacity: 0, transform: `translate(${x + dx}px, ${y + dy}px) scale(0.25) rotate(${dx * 5}deg)` },
    ], { duration: 760, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
  }, { passive: true });
}
