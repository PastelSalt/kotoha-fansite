// Marquee ribbon: drifts slowly, speeds up with scroll speed and reverses direction when scrolling up.
// The drift is one looping Web Animation (runs on the compositor); scrolling only changes its playback rate.
// Runs only while visible and in full-motion mode. Markup: .marquee > .marquee__track > span × 2 (identical).
import { isCalm, onMotionChange } from './prefs.js';
import { onScrollVelocity } from './scroll-life.js';

export function startMarquee(el, { speed = 36 } = {}) {
  const track = el.querySelector('.marquee__track');
  const first = track?.firstElementChild;
  if (!track || !first || !track.animate) return;
  let anim = null;
  let width = 0;
  let dir = 1;              // +1 = moving left (scrolling down / at rest), −1 = right (after scrolling up)
  let rate = 1;
  let visible = false;

  // One loop = the width of one copy of the text, at `speed` px/s.
  const build = () => {
    const w = first.getBoundingClientRect().width;
    if (!w || w === width) return;
    const progress = anim ? (anim.currentTime % anim.effect.getTiming().duration) / anim.effect.getTiming().duration : 0;
    anim?.cancel();
    width = w;
    const duration = (w / speed) * 1000;
    anim = track.animate([{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(${-w}px, 0, 0)` }], { duration, iterations: Infinity });
    anim.currentTime = progress * duration;
    anim.playbackRate = rate;
    sync();
  };
  const sync = () => {
    if (!anim) return;
    if (visible && !isCalm()) { if (anim.playState !== 'running') anim.play(); }
    else anim.pause();
  };

  onScrollVelocity((v) => {
    if (!anim || !visible || isCalm()) return;
    if (Math.abs(v) > 0.05) dir = v > 0 ? 1 : -1;
    const next = dir * (1 + Math.min(7, Math.abs(v) * 2.4));
    if (Math.abs(next - rate) > Math.max(0.02, Math.abs(rate) * 0.03)) { rate = next; anim.updatePlaybackRate(rate); }
    else if (v === 0 && rate !== dir) { rate = dir; anim.updatePlaybackRate(rate); }
  });

  new ResizeObserver(build).observe(first);   // fonts arriving / language switch / resize change the loop length
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(el);
  onMotionChange((mode) => {
    if (mode === 'calm') { anim?.cancel(); width = 0; }
    else build();
  });
}
