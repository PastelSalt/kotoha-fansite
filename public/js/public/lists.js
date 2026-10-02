// Fetch helper + paged lists that load more as the visitor scrolls inside them ("show all records").
import { el } from '../shared/dom.js';
import { stateNote } from './render.js';

// 15 s default: the free Neon database can take ~10 s to wake after idling (the edge cache usually hides this).
export async function getJson(url, { timeout = 15000 } = {}) {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

/**
 * Creates a paged list bound to `container` (a scrolling element: vertical, or horizontal with axis: 'x').
 *   const list = pagedList({ container, endpoint: '/api/public/news', render: (item, index, all) => node | node[], emptyKey });
 *   await list.load();   // first page
 *   list.rerender();     // e.g. after a language change
 */
export function pagedList({ container, endpoint, render, emptyKey, limit = 20, onItems, axis = 'y' }) {
  const items = [];
  let cursor = null;
  let done = false;
  let busy = false;
  const sentinel = el('div', { class: 'list-sentinel', 'aria-hidden': 'true', style: axis === 'x' ? 'flex:0 0 1px;width:1px' : 'height:1px' });
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) loadMore();
  }, { root: container, rootMargin: axis === 'x' ? '0px 240px 0px 0px' : '0px 0px 240px 0px' });
  const build = (from) => items.slice(from).flatMap((item, i) => render(item, from + i, items));

  function paint() {
    container.dataset.state = 'ready';
    if (!items.length) {
      container.replaceChildren(stateNote('empty', { textKey: emptyKey }));
      return;
    }
    container.replaceChildren(...build(0), sentinel);
    if (!done) io.observe(sentinel);
  }

  async function fetchPage() {
    const url = new URL(endpoint, location.origin);
    url.searchParams.set('limit', String(limit));
    if (cursor) url.searchParams.set('cursor', cursor);
    const page = await getJson(url.pathname + url.search);
    items.push(...page.items);
    cursor = page.nextCursor;
    done = !cursor;
    onItems?.(items);
  }

  async function load() {
    busy = true;
    try {
      await fetchPage();
      paint();
    } catch (err) {
      console.warn(err);
      container.dataset.state = 'error';
      container.replaceChildren(stateNote('error', { onRetry: () => { container.dataset.state = 'loading'; container.replaceChildren(); load(); } }));
    } finally {
      busy = false;
    }
  }

  async function loadMore() {
    if (busy || done) return;
    busy = true;
    try {
      const before = items.length;
      await fetchPage();
      sentinel.before(...build(before));
      if (done) io.unobserve(sentinel);
    } catch (err) {
      console.warn(err);
    } finally {
      busy = false;
    }
  }

  return { load, rerender: () => { if (container.dataset.state === 'ready') paint(); }, items };
}
