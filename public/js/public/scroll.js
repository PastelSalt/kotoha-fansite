// Scrolling: plain native free scrolling on every device (no snapping, no smooth-scroll library).
// Native scrolling runs on the browser's compositor thread, so it stays smooth while scripts are busy, and the
// CSS scroll-driven effects (reveals, parallax, backdrop pan) run off the main thread too.
// In-page jumps glide with the browser's own smooth scrolling in full-motion mode and jump instantly in calm mode.
// Sections start at the very top (their own top padding clears the floating nav), so no scroll padding is needed.
import { isCalm } from './motion/prefs.js';

export function initScroll() {
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
  target.scrollIntoView({ behavior: immediate || isCalm() ? 'instant' : 'smooth', block: 'start' });
  if (target.id) history.replaceState(null, '', `${location.pathname}${location.search}#${target.id}`);
}

export function lockScroll() { document.documentElement.classList.add('scroll-locked'); }
export function unlockScroll() { document.documentElement.classList.remove('scroll-locked'); }
