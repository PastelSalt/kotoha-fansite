// Infinite masonry gallery + accessible lightbox. Images come from Cloudinary via /api/public/gallery.
import { t, onLangChange } from '../shared/i18n-core.js';
import { el, galleryTile, cloudinaryUrl, stateMessage } from './render.js';
import { getJson } from './lists.js';

const items = [];
let cursor = null;
let done = false;
let busy = false;
let columns = [];
let heights = [];
let current = -1;

const masonry = () => document.getElementById('masonry');

function columnCount() {
  const w = masonry().clientWidth;
  return w >= 560 ? 3 : 2;
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
  columns[col].append(galleryTile(img, () => openLightbox(index)));
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
      if (!items.length) {
        box.replaceChildren(stateMessage('empty', { textKey: 'gallery.empty' }));
      } else {
        layout();
      }
    } else {
      page.items.forEach((img, i) => place(img, start + i));
    }
    document.getElementById('gallery-more').hidden = done;
    document.getElementById('gallery-end').hidden = !done || !items.length;
  } catch (err) {
    console.warn(err);
    if (!items.length) {
      box.dataset.state = 'error';
      box.replaceChildren(stateMessage('error', { onRetry: () => { box.dataset.state = 'loading'; box.replaceChildren(); busy = false; loadPage(); } }));
    }
  } finally {
    busy = false;
  }
}

// ---------------------------------------------------------------- lightbox
function renderLightbox() {
  const img = items[current];
  if (!img) return;
  const pic = document.getElementById('lightbox-img');
  pic.src = cloudinaryUrl(img.url, 1600);
  pic.alt = t('gallery.alt', { name: img.authorName });
  const cap = document.getElementById('lightbox-caption');
  cap.replaceChildren(
    el('span', { text: `${t('gallery.by', { name: img.authorName })} · ${t('gallery.counter', { n: current + 1, total: items.length })} ` }),
    img.sourceUrl ? el('a', {
      href: img.sourceUrl, target: '_blank', rel: 'noopener noreferrer', text: t('gallery.source'),
      'data-track': 'gallery_credit_click', 'data-track-type': 'gallery', 'data-track-id': img.id,
    }) : null,
  );
}

function openLightbox(index) {
  current = index;
  renderLightbox();
  const dlg = document.getElementById('lightbox');
  if (!dlg.open) dlg.showModal();
}

function step(delta) {
  if (!items.length) return;
  current = (current + delta + items.length) % items.length;
  renderLightbox();
  if (current >= items.length - 3) loadPage();
}

export function initGallery({ onOpen, onClose } = {}) {
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
  onLangChange(() => { if (items.length) layout(); if (dlg.open) renderLightbox(); });

  return { loadFirst: loadPage };
}
