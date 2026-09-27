// Marquee ribbon: drifts slowly, speeds up with scroll speed and reverses direction when scrolling up.
// Runs only while visible and in full-motion mode. Markup: .marquee > .marquee__track > span × 2 (identical).
import { isCalm, onMotionChange } from './prefs.js';
import { scrollVelocity } from './scroll-life.js';

export function startMarquee(el, { speed = 36 } = {}) {
  const track = el.querySelector('.marquee__track');
  const first = track?.firstElementChild;
  if (!track || !first) return;
  let x = 0;
  let dir = -1;             // −1 = moving left (scrolling down), +1 = right (scrolling up)
  let last = 0;
  let raf = 0;
  let visible = false;

  const frame = (t) => {
    const dt = Math.min(0.064, (t - last) / 1000);
    last = t;
    const v = scrollVelocity();
    if (Math.abs(v) > 0.05) dir = v > 0 ? -1 : 1;
    x += dir * speed * (1 + Math.min(7, Math.abs(v) * 2.4)) * dt;
    const w = first.getBoundingClientRect().width;
    if (w > 0) { if (x <= -w) x += w; else if (x > 0) x -= w; }
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    raf = requestAnimationFrame(frame);
  };
  const run = () => {
    if (raf || !visible || isCalm()) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); else stop(); }).observe(el);
  onMotionChange((mode) => { if (mode === 'calm') { stop(); track.style.transform = ''; } else run(); });
}
