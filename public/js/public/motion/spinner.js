// The loader's clover pair: outer white clover + inner clover whose 4 petals fill as loading progresses.
// Both keep turning (CSS animation → runs on the compositor even while scripts are busy).
const NS = 'http://www.w3.org/2000/svg';
export const CLOVER_PATH = 'M286 85 A153 153 0 1 1 505 300 A153 153 0 1 1 288 517 A153 153 0 1 1 68 300 A153 153 0 1 1 286 85 Z';
const VIEWBOX = '15 30 545 545';
// Quadrants around the clover centre (286.5, 301): top-left, top-right, bottom-right, bottom-left (clockwise fill order)
const PETALS = [[15, 30, 271.5, 271], [286.5, 30, 273.5, 271], [286.5, 301, 273.5, 274], [15, 301, 271.5, 274]];
let uid = 0;

const svg = (tag, attrs = {}) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

/** Builds the spinner inside `host` (a .clover-spinner element). Returns { setProgress(0…1), complete() }. */
export function mountSpinner(host) {
  // Static markup (index.html) already holds the clovers so they turn before any script runs: adopt its petals.
  const adopted = [...host.querySelectorAll('.petal')];
  return adopted.length === 4 ? controls(host, adopted) : build(host);
}

function controls(host, rects) {
  return {
    setProgress(p) {
      const lit = Math.max(0, Math.min(4, Math.floor(p * 4 + 0.0001)));
      rects.forEach((r, i) => r.classList.toggle('is-on', i < lit));
      host.classList.toggle('is-complete', lit === 4);
    },
    complete() { this.setProgress(1); },
    reset() { this.setProgress(0); },
  };
}

function build(host) {
  const id = `clover-clip-${++uid}`;
  // Outer: white clover with a green edge and a soft inner shade (filled, never hollow)
  const outer = svg('svg', { class: 'clover-spinner__outer', viewBox: VIEWBOX, 'aria-hidden': 'true', focusable: 'false' });
  outer.append(
    svg('path', { class: 'c-outer', d: CLOVER_PATH }),
    svg('path', { class: 'c-outer-shade', d: CLOVER_PATH, transform: 'translate(286.5 301) scale(0.8) translate(-286.5 -301)' }),
  );

  // Inner: pale-green filled clover whose 4 petals light up with progress, plus gloss + centre
  const inner = svg('svg', { class: 'clover-spinner__inner', viewBox: VIEWBOX, 'aria-hidden': 'true', focusable: 'false' });
  const clip = svg('clipPath', { id });
  clip.append(svg('path', { d: CLOVER_PATH }));
  const defs = svg('defs');
  defs.append(clip);
  const petals = svg('g', { 'clip-path': `url(#${id})` });
  const rects = PETALS.map(([x, y, width, height]) => svg('rect', { class: 'petal', x, y, width, height }));
  petals.append(...rects);
  inner.append(
    defs,
    svg('path', { class: 'c-inner-bg', d: CLOVER_PATH }),
    petals,
    svg('ellipse', { class: 'c-inner-gloss', cx: 185, cy: 170, rx: 44, ry: 72, transform: 'rotate(-40 185 170)' }),
    svg('circle', { class: 'c-centre', cx: 286.5, cy: 301, r: 34 }),
  );

  host.replaceChildren(outer, inner);
  return controls(host, rects);
}
