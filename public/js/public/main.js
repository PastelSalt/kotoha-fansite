// Public site entry point (design v2).
import { t, setLang, currentLang, isLangChosen, onLangChange, mountLangSwitches } from '../shared/i18n-core.js';
import { SOCIALS, OFFICIAL_LINKS, CREDITS } from './data.js';
import {
  el, sprite, videoPolaroid, filmFrame, newsNote, releaseSleeve, achievementRows, socialBadge, stateNote,
} from './render.js';
import { getJson, pagedList } from './lists.js';
import { showLoaderArt, showLoaderText, waitForAssets, hideLoader } from './loader.js';
import { initScroll, scrollToEl, lockScroll, unlockScroll } from './scroll.js';
import { startCountdown } from './countdown.js';
import { initGallery } from './gallery.js';
import { renderWeek, renderSoon, renderFanArt, upcomingRelease, isRecent } from './home.js';
import { track, flush, setSection, startDwell, initTracking } from './track.js';
import { confettiBurst, loadConfetti, celebrateSpecialDays, boing, homeIntro, popTitlesOnArrival } from './fx.js';
import { mountMotionToggles, refreshMotionToggles } from './motion/prefs.js';
import { startScrollLife, pageProgress, onScrollVelocity } from './motion/scroll-life.js';
import { startMarquee } from './motion/marquee.js';
import { startSparkles } from './motion/sparkles.js';
import { startBackdrop } from './motion/backdrop.js';
import { whenGsap } from './motion/beat.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = { home: null, videos: [], currentVideoId: null, upcoming: null, galleryItems: [], activeSection: 'home' };

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
  if (lang !== currentLang()) track('language_switch', { l: lang });
  setLang(lang, { persist: true });
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
}

// ---------------------------------------------------------------- static parts
function renderSocials() {
  $$('[data-socials]').forEach((ul) => ul.replaceChildren(...SOCIALS.map(socialBadge)));
  $('#footer-links').replaceChildren(...OFFICIAL_LINKS.map((l) => socialBadge({
    ...l, handle: '', icon: SOCIALS.find((s) => s.id === l.id)?.icon || null,
  })));
}

/** Artists credited in the footer: the site's background artists plus everyone in the gallery. */
function renderFooterCredits() {
  const people = new Map();                                        // lower-case name → { name, url }
  const unknown = /unknown|作者不明/i;
  let anyUnknown = false;
  const add = (name, url) => {
    if (!name || name === 'AiceClass') return;
    if (unknown.test(name)) { anyUnknown = true; return; }
    const key = name.toLowerCase();
    if (!people.has(key) || (!people.get(key).url && url)) people.set(key, { name, url });
  };
  Object.values(CREDITS).forEach((c) => { if (c) add(c.handle, c.url); else anyUnknown = true; });
  state.galleryItems.forEach((g) => add(g.authorName, g.sourceUrl));
  const rows = [...people.values()].map(({ name, url }) => el('li', {}, [
    sprite('cl-leaf', 'cl cl--pink'),
    url ? el('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: name, 'data-track': 'gallery_credit_click', 'data-track-type': 'gallery' }) : el('span', { text: name }),
  ]));
  rows.push(el('li', {}, [sprite('cl-leaf', 'cl'), el('span', { text: `${t('credits.model')}: © AiceClass` })]));
  rows.push(el('li', {}, [sprite('cl-leaf', 'cl'), el('span', { text: t('credits.design') })]));
  if (anyUnknown) rows.push(el('li', {}, [sprite('cl-leaf', 'cl cl--gold'), el('span', { text: t('common.artUnknown') })]));
  $('#foot-credits').replaceChildren(...rows);
}

function renderAbout() {
  const pills = t('about.pills');
  if (Array.isArray(pills)) $('#about-pills').replaceChildren(...pills.map((p) => el('div', {}, [el('dt', { text: p.label }), el('dd', { text: p.value })])));
  const tags = t('about.tags');
  if (Array.isArray(tags)) $('#about-tags').replaceChildren(...tags.map((tag) => el('span', { class: 'chip', text: tag })));
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
  box.replaceChildren(v ? videoPolaroid(v, { label: t('video.latest'), rot: 1.5 }) : stateNote('empty', { textKey: 'video.empty' }));
}

function renderHomeNews() {
  const box = $('#home-news');
  box.dataset.state = 'ready';
  const news = state.home?.news || [];
  box.replaceChildren(...(news.length
    ? news.map((n, i) => newsNote(n, { isNew: i === 0 && isRecent(n.postedOn), tape: i === 1 }))
    : [stateNote('empty', { textKey: 'news.empty' })]));
}

async function loadHome() {
  try {
    state.home = await getJson('/api/public/home');
  } catch (err) {
    console.warn(err);
    state.home = { video: null, news: [] };
    $('#home-video').replaceChildren(stateNote('error', { onRetry: () => loadHome() }));
    return;
  }
  renderHomeVideo();
  renderHomeNews();
}

function renderPlayer() {
  const box = $('#news-player');
  box.dataset.state = 'ready';
  const v = state.videos.find((x) => x.youtubeId === state.currentVideoId) || state.videos[0];
  box.replaceChildren(v ? videoPolaroid(v, { label: v === state.videos[0] ? t('video.latest') : null, rot: -1.5 }) : stateNote('empty', { textKey: 'video.empty' }));
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

function renderSoonCards() {
  renderSoon(state.upcoming, $('#home-soon'), $('#disco-soon'));
}

function setupLists() {
  newsList = pagedList({
    container: $('#news-list'), endpoint: '/api/public/news', emptyKey: 'news.empty',
    render: (n, i) => newsNote(n, { isNew: i === 0 && isRecent(n.postedOn), tape: i % 3 === 1 }),
  });
  videosList = pagedList({
    container: $('#video-list'), endpoint: '/api/public/videos', emptyKey: 'video.empty', axis: 'x',
    render: (v) => filmFrame(v, { current: v.youtubeId === (state.currentVideoId || state.videos[0]?.youtubeId), onSelect: selectVideo }),
    onItems: (items) => { state.videos = items; if (!state.currentVideoId) renderPlayer(); },
  });
  discoList = pagedList({
    container: $('#disco-list'), endpoint: '/api/public/discography', emptyKey: 'discography.empty',
    render: (r) => (r === state.upcoming ? [] : releaseSleeve(r)),
    onItems: (items) => { state.upcoming = upcomingRelease(items); renderSoonCards(); },
  });
  achievementsList = pagedList({ container: $('#achievements-list'), endpoint: '/api/public/achievements', render: achievementRows, emptyKey: 'discography.empty', limit: 30 });
}

// ---------------------------------------------------------------- nav, menu
const navDot = $('.nav-pill__dot');
function markNav(name) {
  $$('[data-nav-link]').forEach((a) => a.setAttribute('aria-current', String(a.dataset.navLink === name)));
  const link = $(`#nav-links a[data-nav-link="${name}"]`);
  if (link && navDot) navDot.style.setProperty('--dot-x', `${link.offsetLeft + link.offsetWidth / 2 - 8}px`);
}

function onActiveSection(name) {
  state.activeSection = name;
  setSection(name);
  markNav(name);
}

function setupNavProgress() {
  const meter = $('#nav-progress');
  let last = '';
  const update = () => {
    const v = pageProgress().toFixed(3);
    if (v !== last) { last = v; meter.style.setProperty('--fill', v); }
  };
  onScrollVelocity(update);            // runs inside the shared scroll ticker (motion/scroll-life.js)
  update();
}

function setupMenu() {
  const menu = $('#mobile-menu');
  let lastTrigger = null;
  const open = (trigger) => {
    lastTrigger = trigger;
    const r = trigger.getBoundingClientRect();
    menu.style.setProperty('--menu-x', `${r.left + r.width / 2}px`);
    menu.style.setProperty('--menu-y', `${r.top + r.height / 2}px`);
    menu.inert = false;
    menu.classList.add('is-open');
    lockScroll();
    $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    $('[data-menu-close]', menu).focus();
  };
  const close = () => {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.inert = true;
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
      const f = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', menu).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  });
  // leaving the phone layout while the menu is open (rotating a tablet) must not trap the page
  matchMedia('(min-width: 1000px)').addEventListener('change', (e) => { if (e.matches) close(); });
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

/**
 * The CDN libraries (GSAP, SplitText) load async. Wait for them during the loader, but at most
 * `ms`: if a CDN is slow or blocked the site still works — without the arrival animations.
 */
function librariesReady(ms) {
  const each = $$('script[data-lib]').map((s) => (window[s.dataset.lib] ? null : new Promise((resolve) => {
    s.addEventListener('load', resolve, { once: true });
    s.addEventListener('error', resolve, { once: true });
  })));
  return Promise.race([Promise.all(each), new Promise((r) => setTimeout(r, ms))]);
}

// ---------------------------------------------------------------- boot
async function boot() {
  initTracking();
  showLoaderArt();
  mountLangSwitches(pickLanguage);
  mountMotionToggles();
  renderSocials();
  setupContactMail();
  setupLists();
  const gallery = initGallery({
    onOpen: lockScroll,
    onClose: unlockScroll,
    onItems: (items) => { state.galleryItems = items; renderFanArt($('#home-fanart'), items); renderFooterCredits(); },
  });

  onLangChange((lang) => {
    $$('.lang-pill').forEach((p) => { p.dataset.active = lang; });
    document.title = t('meta.title');
    refreshMotionToggles();
    showLoaderText();
    renderAbout();
    renderWeek($('#week'));
    renderFooterCredits();
    if (state.home) { renderHomeVideo(); renderHomeNews(); }
    if (state.videos.length) renderPlayer();
    if (state.galleryItems.length) renderFanArt($('#home-fanart'), state.galleryItems);
    renderSoonCards();
    [newsList, videosList, discoList, achievementsList].forEach((l) => l.rerender());
    markNav(state.activeSection);
  });

  // Home content keeps loading in the background; the loader waits for it at most 4 s
  // (a sleeping database must not hold the art showcase hostage — cards show a skeleton until it arrives).
  const homeReady = loadHome();
  const timing = await waitForAssets({
    tier1: [
      () => resolveInitialLanguage().then(() => { track('page_view'); flush(); }),
      () => document.fonts?.ready,
      () => librariesReady(6000),
      () => decodeImage($('img[data-bg="home"]')),
      () => Promise.race([homeReady, new Promise((r) => setTimeout(r, 4000))]),
    ],
    tier2: [
      ...['about', 'news', 'discography', 'gallery'].map((n) => () => decodeImage($(`img[data-bg="${n}"]`))),
      () => decodeImage($('.clover-stage__pose img')),
      () => decodeImage($('.profile__avatar')),
      () => newsList.load(),
      () => videosList.load(),
      () => discoList.load(),
      () => achievementsList.load(),
      () => gallery.loadFirst(),
    ],
  });
  document.documentElement.dataset.loadMs = String(timing);
  track('loader_timing', { ms: timing });

  // Motion + scrolling (all of it progressive: each piece is skipped when its feature or library is missing)
  startScrollLife();
  startMarquee($('#marquee'));
  startSparkles();
  startBackdrop($('#backdrop'), $$('.scene[data-art]'));
  initScroll();
  setupNavProgress();
  setupMenu();
  setupFun();
  startCountdown();

  // Active section (nav, dwell time): the one crossing the middle of the viewport — the footer counts too.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) onActiveSection(e.target.dataset.section);
  }, { rootMargin: '-50% 0px -50% 0px' });
  $$('[data-section]').forEach((s) => io.observe(s));

  // Deep link (#news etc.) after everything is laid out.
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) scrollToEl(target, { immediate: true });

  await hideLoader();
  // Sections more than a screen away drop their animations until the visitor gets close (layout.css: .is-far).
  const far = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('is-far', !e.isIntersecting);
  }, { rootMargin: '100% 0px' });
  $$('.scene').forEach((s) => far.observe(s));
  startDwell();
  homeIntro();
  celebrateSpecialDays();
  (window.requestIdleCallback || ((cb) => setTimeout(cb, 1500)))(() => loadConfetti(), { timeout: 4000 });
  whenGsap(2000).then(() => document.fonts?.ready).then(popTitlesOnArrival);
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('loader')?.classList.add('is-done'); // never trap visitors behind the loader
});
