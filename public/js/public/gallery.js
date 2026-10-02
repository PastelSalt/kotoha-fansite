// Infinite masonry gallery + accessible lightbox that grows out of the clicked tile.
// Images come from Cloudinary via /api/public/gallery.
import { t, onLangChange } from '../shared/i18n-core.js';
import { el, galleryTile, cloudinaryUrl, stateNote } from './render.js';
import { getJson } from './lists.js';
import { isCalm } from './motion/prefs.js';

const items = [];
let cursor = null;
let done = false;
let busy = false;
let columns = [];
let heights = [];
let current = -1;
let onItemsCb = null;

const masonry = () => document.getElementById('masonry');

function columnCount() {
  const w = masonry().clientWidth;
  if (w >= 1100) return 5;
  if (w >= 820) return 4;
  if (w >= 520) return 3;
  return 2;
}

function layout() {
  const box = masonry();
  const n = columnCount();
  columns = Array.from({ length: n }, () => el('div', { class: 'masonry__col' }));
  heights = new Array(n).fill(0);
  box.replaceChildren(...columns);
  items.forEach((img, i) => place(img, i));
}

function place(img, index) {
  const col = heights.indexOf(Math.min(...heights)); // shortest column keeps the order roughly newest-first
  columns[col].append(galleryTile(img, (tile) => openLightbox(index, tile)));
  heights[col] += img.height / img.width;
}

async function loadPage() {
  if (busy || done) return;
  busy = true;
  const box = masonry();
  try {
    const url = `/api/public/gallery?limit=18${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const page = await getJson(url);
    const start = items.length;
    items.push(...page.items);
    cursor = page.nextCursor;
    done = !cursor;
    if (box.dataset.state !== 'ready') {
      box.dataset.state = 'ready';
      if (!items.length) box.replaceChildren(stateNote('empty', { textKey: 'gallery.empty' }));
      else layout();
    } else {
      page.items.forEach((img, i) => place(img, start + i));
    }
    document.getElementById('gallery-more').hidden = done;
    document.getElementById('gallery-end').hidden = !done || !items.length;
    onItemsCb?.(items, done);
  } catch (err) {
    console.warn(err);
    if (!items.length) {
      box.dataset.state = 'error';
      box.replaceChildren(stateNote('error', { onRetry: () => { box.dataset.state = 'loading'; box.replaceChildren(); busy = false; loadPage(); } }));
    }
  } finally {
    busy = false;
  }
}

// ---------------------------------------------------------------- lightbox
function fillLightbox() {
  const img = items[current];
  if (!img) return;
  const pic = document.getElementById('lightbox-img');
  pic.src = cloudinaryUrl(img.url, 1600);
  pic.alt = t('gallery.alt', { name: img.authorName });
  document.getElementById('lightbox-caption').replaceChildren(
    el('span', { class: 'lightbox__text', text: `${t('gallery.by', { name: img.authorName })} · ${t('gallery.counter', { n: current + 1, total: items.length })}` }),
    img.sourceUrl ? el('a', {
      class: 'chip', href: img.sourceUrl, target: '_blank', rel: 'noopener noreferrer', text: `${t('gallery.source')} ↗`,
      'data-track': 'gallery_credit_click', 'data-track-type': 'gallery', 'data-track-id': img.id,
    }) : null,
  );
}

/** Opens the viewer; with View Transitions the artwork grows out of its tile (plain fade otherwise / in calm mode). */
function openLightbox(index, tile) {
  current = index;
  const dlg = document.getElementById('lightbox');
  if (dlg.open) { fillLightbox(); return; }
  const pic = document.getElementById('lightbox-img');
  const thumb = tile?.querySelector('img');
  const show = async () => {
    fillLightbox();
    dlg.classList.add('no-anim');
    dlg.showModal();
    await pic.decode().catch(() => {});
  };
  if (!document.startViewTransition || isCalm() || !thumb) { dlg.classList.remove('no-anim'); show(); return; }
  thumb.style.viewTransitionName = 'artwork';
  const vt = document.startViewTransition(async () => {
    thumb.style.viewTransitionName = '';
    pic.style.viewTransitionName = 'artwork';
    await show();
  });
  vt.finished.finally(() => { pic.style.viewTransitionName = ''; dlg.classList.remove('no-anim'); });
}

function step(delta) {
  if (!items.length) return;
  current = (current + delta + items.length) % items.length;
  fillLightbox();
  if (current >= items.length - 3) loadPage();
}

export function initGallery({ onOpen, onClose, onItems } = {}) {
  onItemsCb = onItems;
  const dlg = document.getElementById('lightbox');
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();                // backdrop click
    if (e.target.closest('[data-lightbox-close]')) dlg.close();
    if (e.target.closest('[data-lightbox-prev]')) step(-1);
    if (e.target.closest('[data-lightbox-next]')) step(1);
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  dlg.addEventListener('close', () => onClose?.());
  const origShow = dlg.showModal.bind(dlg);
  dlg.showModal = () => { onOpen?.(); origShow(); };

  document.getElementById('gallery-more').addEventListener('click', loadPage);
  new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) loadPage();
  }, { rootMargin: '0px 0px 600px 0px' }).observe(document.getElementById('gallery-sentinel'));

  let lastCols = 0;
  new ResizeObserver(() => {
    const n = columnCount();
    if (n !== lastCols && masonry().dataset.state === 'ready' && items.length) { lastCols = n; layout(); }
  }).observe(masonry());
  onLangChange(() => { if (items.length) layout(); if (dlg.open) fillLightbox(); });

  return { loadFirst: loadPage, items };
}
