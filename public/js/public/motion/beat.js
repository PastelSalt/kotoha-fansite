// The site's single tempo. Every entrance, stagger and transition is timed in beats so motion feels
// coordinated ("musical") instead of random. 128 BPM → 1 beat ≈ 0.469 s.
export const BPM = 128;
export const BEAT = 60 / BPM;                 // seconds (GSAP units)
export const beats = (n) => n * BEAT;         // seconds
export const beatsMs = (n) => Math.round(n * BEAT * 1000);

// Easing names shared by GSAP timelines (built-in eases, no plugin needed).
export const EASE = {
  pop: 'back.out(2)',
  out: 'power3.out',
  inOut: 'power2.inOut',
  in: 'power2.in',
};

/** Resolves with window.gsap once the async CDN script has run, or null after `ms` (site keeps working without it). */
export function whenGsap(ms = 6000) {
  if (window.gsap) return Promise.resolve(window.gsap);
  return new Promise((resolve) => {
    const started = performance.now();
    const check = () => {
      if (window.gsap) resolve(window.gsap);
      else if (performance.now() - started > ms) resolve(null);
      else setTimeout(check, 50);
    };
    check();
  });
}
