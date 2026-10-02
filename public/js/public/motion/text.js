// Text helpers for motion: a readable copy for screen readers + per-character spans for the animation.

/** Turns el's text into a gentle bouncing wave ("Loading…" / 「ロード中…」). */
export function waveText(el, text = el.textContent) {
  const sr = document.createElement('span');
  sr.className = 'visually-hidden';
  sr.textContent = text;
  const wave = document.createElement('span');
  wave.className = 'wave';
  wave.setAttribute('aria-hidden', 'true');
  Array.from(text).forEach((ch, i) => {        // Array.from keeps Japanese characters and emoji whole
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.setProperty('--i', i);
    wave.append(s);
  });
  el.replaceChildren(sr, wave);
}

/**
 * Letters "pop in" once (GSAP SplitText when available; falls back to showing the text as is).
 * Keeps the text accessible: SplitText adds aria-label on the parent and hides the split pieces.
 */
export function popLetters(el, gsap, { stagger = 0.03, delay = 0 } = {}) {
  const Split = window.SplitText;
  if (!gsap || !Split) return null;
  const split = new Split(el, { type: 'chars', aria: 'auto' });
  return gsap.from(split.chars, {
    yPercent: 70, opacity: 0, rotation: () => gsap.utils.random(-14, 14), scale: 0.6,
    duration: 0.5, ease: 'back.out(2.4)', stagger, delay,
    onComplete: () => split.revert(),
  });
}
