// Public site entry point.
import { t, setLang, currentLang, isLangChosen, onLangChange, mountLangSwitches } from '../shared/i18n-core.js';
import { SOCIALS, OFFICIAL_LINKS, CREDITS, CREDIT_ENTRIES } from './data.js';
import { el, icon, videoFacade, newsCard, videoChip, releaseCard, achievementItem, stateMessage } from './render.js';
import { getJson, pagedList } from './lists.js';
import { showLoaderArt, updateLoaderCredit, waitForAssets, hideLoader } from './loader.js';
import { initScroll, lockScroll, unlockScroll, refreshScroll, reducedMotion } from './scroll.js';
import { startCountdown } from './countdown.js';
import { initScrollbars } from './scrollbars.js';
import { initGallery } from './gallery.js';
import {
  confettiBurst, celebrateSpecialDays, boing, staggerIn, cloverBloom, prepareEntrances, playEntrance, homeEntrance,
} from './fx.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = { home: null, videos: [], currentVideoId: null };

// ---------------------------------------------------------------- language
async function resolveInitialLanguage() {
  let lang = currentLang();
  if (!isLangChosen()) {
    try {
      const geo = await getJson('/api/public/geo', { timeout: 2500 });
      if (geo.lang === 'ja' || geo.lang === 'en') lang = geo.lang;
    } catch { /* default stays English */ }
  }
  await setLang(lang);
}

function pickLanguage(lang) {
  setLang(lang, { persist: true });
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
}

// ---------------------------------------------------------------- static parts
function renderSocials() {
  $$('[data-socials]').forEach((ul) => {
    ul.replaceChildren(...SOCIALS.map((s) => el('li', {}, [
      el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${s.label} ${s.handle}` }, [
        s.icon
          ? el('img', { src: s.icon, alt: '', width: 96, height: 96, loading: 'lazy' })
          : el('span', { class: 'social-fallback', 'aria-hidden': 'true' }, [icon('radio')]),
        el('span', { class: 'social-handle sticker sticker--sm', text: s.handle }),
      ]),
    ])));
  });
  $('#footer-links').replaceChildren(...OFFICIAL_LINKS.map((l) =>
    el('li', {}, [el('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer', text: l.label })])));
}

function renderCredits() {
  $$('[data-credit]').forEach((a) => {
    const c = CREDITS[a.dataset.credit];
    if (c) { a.href = c.url; a.textContent = `${t('common.artBy')} ${c.handle}`; }
    else { a.removeAttribute('href'); a.textContent = t('common.artUnknown'); }
  });
  $('#credits-list').replaceChildren(...CREDIT_ENTRIES.map(([key, labelKey]) => {
    const c = CREDITS[key];
    return el('li', {}, [
      el('strong', { text: `${t(labelKey)}: ` }),
      c ? el('a', { href: c.url, target: '_blank', rel: 'noopener noreferrer', text: c.handle }) : el('span', { text: t('common.artUnknown') }),
    ]);
  }).concat(el('li', {}, [el('strong', { text: `${t('credits.model')}: ` }), el('span', { text: '© AiceClass' })])));
  updateLoaderCredit();
}

function renderAboutPills() {
  const pills = t('about.pills');
  if (!Array.isArray(pills)) return;
  $('#about-pills').replaceChildren(...pills.map((p) => el('li', {}, [el('strong', { text: p.label }), ' ', el('span', { text: p.value })])));
}

function setupContactMail() {
  const a = $('#contact-mail');
  const address = `${a.dataset.user}@${a.dataset.domain}`;   // assembled at runtime (not in the HTML)
  a.textContent = address;
  a.href = `mailto:${address}`;
}

// ---------------------------------------------------------------- dynamic content
function renderHomeVideo() {
  const box = $('#home-video');
  box.dataset.state = 'ready';
  const v = state.home?.video;
  box.replaceChildren(v ? videoFacade(v, { badge: t('video.latest') }) : stateMessage('empty', { textKey: 'video.empty' }));
}

function renderHomeNews() {
  const box = $('#home-news');
  box.dataset.state = 'ready';
  const news = state.home?.news || [];
  box.replaceChildren(...(news.length ? news.map((n) => newsCard(n, { compact: true })) : [stateMessage('empty', { textKey: 'news.empty' })]));
}

async function loadHome() {
  try {
    state.home = await getJson('/api/public/home');
  } catch (err) {
    console.warn(err);
    state.home = { video: null, news: [] };
    $('#home-video').replaceChildren(stateMessage('error', { onRetry: () => loadHome() }));
    return;
  }
  renderHomeVideo();
  renderHomeNews();
}

function renderPlayer() {
  const box = $('#news-player');
  box.dataset.state = 'ready';
  const v = state.videos.find((x) => x.youtubeId === state.currentVideoId) || state.videos[0];
  box.replaceChildren(v ? videoFacade(v, { badge: v === state.videos[0] ? t('video.latest') : null }) : stateMessage('empty', { textKey: 'video.empty' }));
}

function selectVideo(video) {
  state.currentVideoId = video.youtubeId;
  renderPlayer();
  videosList.rerender();
  boing($('#news-player'));
}

let videosList;
let newsList;
let discoList;
let achievementsList;

function setupLists() {
  newsList = pagedList({ container: $('#news-list'), endpoint: '/api/public/news', render: (n) => newsCard(n), emptyKey: 'news.empty' });
  videosList = pagedList({
    container: $('#video-list'), endpoint: '/api/public/videos', emptyKey: 'video.empty',
    render: (v) => videoChip(v, { current: v.youtubeId === (state.currentVideoId || state.videos[0]?.youtubeId), onSelect: selectVideo }),
    onItems: (items) => { state.videos = items; if (!state.currentVideoId) renderPlayer(); },
  });
  discoList = pagedList({ container: $('#disco-list'), endpoint: '/api/public/discography', render: releaseCard, emptyKey: 'discography.empty' });
  achievementsList = pagedList({ container: $('#achievements-list'), endpoint: '/api/public/achievements', render: achievementItem, emptyKey: 'discography.empty', limit: 30 });
}

// ---------------------------------------------------------------- header, nav, menu
function onActiveSection(name) {
  document.body.classList.toggle('is-scrolled', name !== 'home');
  $$('[data-nav-link]').forEach((a) => a.setAttribute('aria-current', String(a.dataset.navLink === name)));
  playEntrance(name);
}

function setupMenu() {
  const menu = $('#mobile-menu');
  let lastTrigger = null;
  const open = (trigger) => {
    lastTrigger = trigger;
    menu.hidden = false;
    lockScroll();
    $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    cloverBloom(trigger);
    staggerIn(menu.querySelectorAll('.mobile-menu__nav li'));
    $('[data-menu-close]', menu).focus();
  };
  const close = () => {
    if (menu.hidden) return;
    menu.hidden = true;
    unlockScroll();
    $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    lastTrigger?.focus();
  };
  $$('[data-menu-open]').forEach((b) => b.addEventListener('click', () => open(b)));
  $('[data-menu-close]', menu).addEventListener('click', close);
  menu.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) close(); });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {                                    // focus trap
      const f = $$('a[href], button, [tabindex]:not([tabindex="-1"])', menu).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  });
}

function setupDialogs() {
  const credits = $('#credits-dialog');
  $$('[data-credits-open]').forEach((b) => b.addEventListener('click', () => { lockScroll(); credits.showModal(); }));
  $('[data-credits-close]', credits).addEventListener('click', () => credits.close());
  credits.addEventListener('close', unlockScroll);
  credits.addEventListener('click', (e) => { if (e.target === credits) credits.close(); });
}

function setupFun() {
  $$('[data-confetti]').forEach((a) => a.addEventListener('click', () => confettiBurst(a)));
  const pose = $('[data-pose]');
  pose?.addEventListener('click', () => { boing(pose); confettiBurst(pose); });
}

// ---------------------------------------------------------------- preloading helpers
function decodeImage(img) {
  if (!img) return Promise.resolve();
  img.loading = 'eager';
  if (img.complete && img.naturalWidth) return img.decode().catch(() => {});
  return new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  }).then(() => img.decode().catch(() => {}));
}

// ---------------------------------------------------------------- boot
async function boot() {
  showLoaderArt();
  mountLangSwitches(pickLanguage);
  renderSocials();
  setupContactMail();
  setupLists();
  const gallery = initGallery({ onOpen: lockScroll, onClose: unlockScroll });

  onLangChange(() => {
    renderCredits();
    renderAboutPills();
    if (state.home) { renderHomeVideo(); renderHomeNews(); }
    if (state.videos.length) renderPlayer();
    [newsList, videosList, discoList, achievementsList].forEach((l) => l.rerender());
    document.title = t('meta.title');
  });

  // Home content keeps loading in the background; the loader waits for it at most 4 s
  // (a sleeping database must not hold the art showcase hostage — cards show a skeleton until it arrives).
  const homeReady = loadHome();
  const timing = await waitForAssets({
    tier1: [
      resolveInitialLanguage,
      () => document.fonts?.ready,
      () => decodeImage($('img[data-bg="home"]')),
      () => Promise.race([homeReady, new Promise((r) => setTimeout(r, 4000))]),
    ],
    tier2: [
      ...['about', 'news', 'discography', 'gallery'].map((n) => () => decodeImage($(`img[data-bg="${n}"]`))),
      () => decodeImage($('.about-stage__pose img')),
      () => decodeImage($('.avatar__img')),
      () => newsList.load(),
      () => videosList.load(),
      () => discoList.load(),
      () => achievementsList.load(),
      () => gallery.loadFirst(),
    ],
  });
  document.documentElement.dataset.loadMs = String(timing);

  await initScroll({ onActiveChange: onActiveSection });
  initScrollbars();
  setupMenu();
  setupDialogs();
  setupFun();
  startCountdown();
  prepareEntrances();
  refreshScroll();

  // Deep link (#news etc.) after everything is laid out.
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView();

  await hideLoader({ reduced: reducedMotion });
  homeEntrance();
  celebrateSpecialDays();
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('loader')?.classList.add('is-done'); // never trap visitors behind the loader
});
