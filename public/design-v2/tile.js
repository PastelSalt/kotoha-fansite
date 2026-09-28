// Style tile page (D1, revised for density): renders real content with the v2 components and demonstrates the
// motion system. Preview-only page; deleted before the redesign goes live. The motion/ modules are the real ones.
import { el, $, $$ } from '/js/shared/dom.js';
import { nextStream } from '/js/public/countdown.js';
import { SOCIALS, OFFICIAL_LINKS } from '/js/public/data.js';
import { mountMotionToggles, isCalm } from '/js/public/motion/prefs.js';
import { beats, whenGsap } from '/js/public/motion/beat.js';
import { startScrollLife, pageProgress } from '/js/public/motion/scroll-life.js';
import { startMarquee } from '/js/public/motion/marquee.js';
import { startSparkles } from '/js/public/motion/sparkles.js';
import { playWipe } from '/js/public/motion/wipe.js';
import { mountSpinner } from '/js/public/motion/spinner.js';
import { waveText, popLetters } from '/js/public/motion/text.js';
import { startBackdrop } from '/js/public/motion/backdrop.js';

const NS = 'http://www.w3.org/2000/svg';
const SPRITE = '/assets/svg/v2-sprite.svg';
const ytThumb = (id, q = 'hqdefault') => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${q}.jpg`;
const cl = (url, w) => url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`);
const dot = (d) => (d || '').replaceAll('-', '.');
const pad = (n) => String(n).padStart(2, '0');
const LINK_LABELS = { watch: 'Watch', details: 'Details', tickets: 'Tickets', listen: 'Listen', official: 'Official', buy: 'Buy', stream: 'Stream' };
const getJson = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${url} ${r.status}`); return r.json(); };
const jstDate = (ms = Date.now()) => new Date(ms + 9 * 3600e3);          // read with getUTC* for Japan time
const todayJst = () => jstDate().toISOString().slice(0, 10);

/** Illustrated sprite icon: icon('cl-leaf', 'cl cl--pink'). Decorative. */
function icon(symbol, cls = 'cl') {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', cls);
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  const u = document.createElementNS(NS, 'use');
  u.setAttribute('href', `${SPRITE}#${symbol}`);
  s.append(u);
  return s;
}

// ---------------------------------------------------------------- global motion
mountMotionToggles();
startScrollLife();
startMarquee($('#marquee'));
startSparkles();

// nav: clover meter fills with page progress; clover dot follows the section in view
const meter = $('#nav-progress');
let progRaf = 0;
const updateProgress = () => { progRaf = 0; meter.style.setProperty('--fill', pageProgress().toFixed(3)); };
window.addEventListener('scroll', () => { if (!progRaf) progRaf = requestAnimationFrame(updateProgress); }, { passive: true });
updateProgress();
const navDot = $('.nav-pill__dot');
function markNav(name) {
  $$('#nav-links a').forEach((a) => {
    const on = a.dataset.nav === name;
    a.setAttribute('aria-current', String(on));
    if (on) navDot.style.setProperty('--dot-x', `${a.offsetLeft + a.offsetWidth / 2 - 8}px`);
  });
}

// artworks crossfade between scenes (no hard edges)
startBackdrop($('#backdrop'), $$('.scene[data-art]'), { onChange: markNav });

// doodle font trial
$('#doodle-toggle').addEventListener('click', (e) => {
  const on = $('#doodle-trial').classList.toggle('is-on');
  e.currentTarget.setAttribute('aria-pressed', String(on));
  e.currentTarget.textContent = `Doodles: ${on ? 'on' : 'off'}`;
});

// ---------------------------------------------------------------- builders (all text via textContent)
function polaroid(video, { label = 'Latest', rot = 1.5 } = {}) {
  const fig = el('figure', { class: 'polaroid lean', style: `--polaroid-rot: ${rot}deg` });
  const photo = el('button', { class: 'polaroid__photo', type: 'button', 'aria-label': `Play: ${video.title}` }, [
    el('img', { src: ytThumb(video.youtubeId), alt: '', loading: 'lazy', width: 480, height: 360 }),
    el('span', { class: 'play', 'aria-hidden': 'true' }),
  ]);
  photo.addEventListener('click', () => {
    photo.replaceWith(el('iframe', {
      class: 'polaroid__photo', src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?autoplay=1&rel=0&playsinline=1`,
      title: video.title, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin',
    }));
  });
  fig.append(el('span', { class: 'ribbon', text: label }), photo, el('figcaption', { text: video.title }));
  return fig;
}

function note(n, { isNew = false, tape = false } = {}) {
  return el('article', { class: 'paper note lean reveal' }, [
    tape ? el('span', { class: 'tape' }) : icon('cl-leaf', 'cl cl--pink pin'),
    isNew ? el('span', { class: 'stamp', text: 'NEW' }) : null,
    el('time', { class: 'date-chip', datetime: n.postedOn, text: dot(n.postedOn) }),
    el('h3', { class: 'note__title', text: n.headline }),
    el('p', { class: 'note__text', text: n.summary }),
    n.links?.length ? el('p', { class: 'chips' }, n.links.map((l) => el('a', {
      class: 'chip', href: l.url, target: '_blank', rel: 'noopener noreferrer', text: `${LINK_LABELS[l.labelKey] || l.labelKey} ↗`,
    }))) : null,
  ]);
}

function sleeve(d, types) {
  const type = types?.[d.releaseType] || d.releaseType;
  return el('article', { class: 'sleeve' }, [
    el('div', { class: 'sleeve__art' }, [
      el('span', { class: 'sleeve__disc', 'aria-hidden': 'true' }),
      d.youtubeId
        ? el('img', { src: ytThumb(d.youtubeId), alt: '', loading: 'lazy' })
        : el('div', { class: 'sleeve__cover', 'aria-hidden': 'true' }, [el('b', { text: type }), el('span', { text: d.title }), icon('cl-round', 'cl cl--white')]),
    ]),
    el('div', { class: 'sleeve__meta' }, [
      el('p', { class: 'sleeve__kind', text: `${type} · ${dot(d.releasedOn)}` }),
      el('h3', { class: 'sleeve__title', text: d.title }),
      d.note ? el('p', { class: 'sleeve__note', text: d.note }) : null,
    ]),
  ]);
}

const factsList = (pills) => pills.map((p) => el('div', {}, [el('dt', { text: p.label }), el('dd', { text: p.value })]));
const socialBadge = (s) => el('li', {}, [el('a', {
  class: 'social', href: s.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${s.label} ${s.handle}`,
}, [s.icon ? el('img', { src: s.icon, alt: '', width: 96, height: 96 }) : icon('cl-leaf'), el('span', { text: s.handle })])]);

// ---------------------------------------------------------------- data
const [en, ja, news, videos, disco, ach, gallery] = await Promise.all([
  getJson('/locales/en.json'), getJson('/locales/ja.json'),
  getJson('/api/public/news?limit=6').catch(() => ({ items: [] })),
  getJson('/api/public/videos?limit=8').catch(() => ({ items: [] })),
  getJson('/api/public/discography?limit=8').catch(() => ({ items: [] })),
  getJson('/api/public/achievements?limit=10').catch(() => ({ items: [] })),
  getJson('/api/public/gallery?limit=12').catch(() => ({ items: [] })),
]);
const today = todayJst();
const upcoming = disco.items.filter((d) => d.releasedOn > today).sort((a, b) => a.releasedOn.localeCompare(b.releasedOn))[0];
const daysUntil = (day) => Math.round((Date.parse(`${day}T00:00:00+09:00`) - Date.parse(`${today}T00:00:00+09:00`)) / 864e5);

// ---------------------------------------------------------------- HOME
$('#home-socials').append(...SOCIALS.map(socialBadge));
if (videos.items[0]) $('#home-polaroid').append(polaroid(videos.items[0], { label: 'Latest' }));
$('#home-notes').append(...news.items.slice(0, 2).map((n, i) => note(n, { isNew: i === 0 })));
if (upcoming) {
  const soon = $('#home-soon');
  soon.hidden = false;
  soon.append(
    el('span', { class: 'tape tape--right' }),
    el('span', { class: 'sticker sticker--sm sticker--pink soon__label', text: 'Coming soon' }),
    el('p', { class: 'soon__title', text: upcoming.title }),
    el('p', { class: 'soon__count', text: `in ${daysUntil(upcoming.releasedOn)} days · ${dot(upcoming.releasedOn)}` }),
  );
}
if (gallery.items.length) {
  const g = gallery.items[Math.floor(Math.random() * gallery.items.length)];
  const box = $('#home-fanart');
  box.hidden = false;
  box.append(
    el('img', { src: cl(g.url, 240), alt: `Fan art by ${g.authorName}`, width: 96, height: 96, loading: 'lazy' }),
    el('div', {}, [
      el('p', { class: 'mini-title' }, [icon('cl-leaf', 'cl cl--gold'), el('span', { class: 'mini-title__en', text: 'FAN ART' })]),
      el('p', { class: 'ink-soft', text: `of the moment · by ${g.authorName}` }),
      el('a', { class: 'chip', href: '#gallery', text: 'See the gallery ✿' }),
    ]),
  );
}

// this week's streams (Japan time; weeks start on Monday)
(function buildWeek() {
  const now = jstDate();
  const dow = (now.getUTCDay() + 6) % 7;                       // 0 = Monday
  const monday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow);
  const names = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const live = nextStream()?.live;
  $('#week').append(...names.map((name, i) => {
    const d = new Date(monday + i * 864e5);
    const stream = i === 1 || i === 4;
    const isToday = i === dow;
    return el('li', { class: `week__day${stream ? ' is-stream' : ''}${isToday ? ' is-today' : ''}` }, [
      el('span', { text: name }),
      el('span', { class: 'week__date', text: String(d.getUTCDate()) }),
      el('span', { class: 'week__tag', text: stream ? (isToday && live ? 'LIVE' : '21:00') : '' }),
      stream ? icon('cl-leaf', 'cl') : null,
    ]);
  }));
})();

// ---------------------------------------------------------------- ABOUT
$('#profile-facts').append(...factsList(en.about.pills));
$('#about-bio').append(el('p', { text: en.about.bio1 }), el('p', { text: en.about.bio2 }));
const tagPill = en.about.pills.find((p) => /hashtag/i.test(p.label));
if (tagPill) $('#about-tags').append(...tagPill.value.split('·').map((t) => el('span', { class: 'chip', text: t.trim() })));
$('#lang-pill').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-lang]');
  if (!btn) return;
  const lang = btn.dataset.lang;
  const pill = $('#lang-pill');
  if (pill.dataset.active === lang) return;
  pill.dataset.active = lang;
  $$('#lang-pill button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const facts = $('#profile-facts');
  facts.classList.add('is-swapping');
  setTimeout(() => {
    facts.lang = lang;
    facts.replaceChildren(...factsList((lang === 'ja' ? ja : en).about.pills));
    facts.classList.remove('is-swapping');
  }, isCalm() ? 0 : 200);
});

// ---------------------------------------------------------------- NEWS
$('#news-list').append(...news.items.map((n, i) => note(n, { isNew: i === 0, tape: i % 3 === 1 })));
if (videos.items[0]) $('#news-polaroid').append(polaroid(videos.items[0], { label: 'Latest', rot: -1.5 }));
$('#news-film').append(...videos.items.map((v, i) => el('button', {
  class: 'film__frame', type: 'button', 'aria-current': String(i === 0), 'aria-label': v.title,
  onclick: (e) => {
    $$('#news-film .film__frame').forEach((f) => f.setAttribute('aria-current', String(f === e.currentTarget)));
    $('#news-polaroid').replaceChildren(polaroid(v, { label: i === 0 ? 'Latest' : 'Video', rot: -1.5 }));
  },
}, [el('img', { src: ytThumb(v.youtubeId, 'mqdefault'), alt: '', loading: 'lazy', width: 320, height: 180 })])));

// ---------------------------------------------------------------- DISCOGRAPHY
if (upcoming) {
  const soon = $('#disco-soon');
  soon.hidden = false;
  soon.append(
    el('span', { class: 'tape' }),
    el('span', { class: 'sticker sticker--pink soon__label', text: 'Coming soon' }),
    el('div', {}, [
      el('p', { class: 'soon__title', text: upcoming.title }),
      upcoming.note ? el('p', { class: 'ink-soft', text: upcoming.note }) : null,
      el('p', { class: 'date-chip', text: `Release · ${dot(upcoming.releasedOn)}` }),
    ]),
    el('p', { class: 'soon__days' }, [el('b', { text: String(daysUntil(upcoming.releasedOn)) }), el('span', { text: 'DAYS TO GO' })]),
  );
}
$('#disco-sleeves').append(...disco.items.filter((d) => d !== upcoming).slice(0, 6).map((d) => sleeve(d, en.discography?.types)));
const years = new Map();
ach.items.forEach((a) => { const y = a.achievedOn.slice(0, 4); if (!years.has(y)) years.set(y, []); years.get(y).push(a); });
years.forEach((items, y) => {
  $('#disco-timeline').append(el('li', { class: 'timeline__year', text: y }), ...items.map((a) => el('li', { class: 'timeline__item' }, [
    icon('cl-leaf', 'cl cl--pink'), el('time', { datetime: a.achievedOn, text: dot(a.achievedOn.slice(5)) }), el('p', { text: a.text }),
  ])));
});

// ---------------------------------------------------------------- GALLERY + lightbox (grows from its tile)
const dialog = $('#lightbox');
const big = $('#lightbox-img');
function openArtwork(tile, g) {
  const fill = async () => {
    big.src = cl(g.url, 1400);
    big.alt = `Artwork by ${g.authorName}`;
    $('#lightbox-credit').textContent = `by ${g.authorName}`;
    const link = $('#lightbox-link');
    link.hidden = !g.sourceUrl;
    if (g.sourceUrl) link.href = g.sourceUrl;
    dialog.classList.add('no-anim');
    dialog.showModal();
    await big.decode().catch(() => {});
  };
  if (!document.startViewTransition || isCalm()) { dialog.classList.remove('no-anim'); fill(); return; }
  const thumb = tile.querySelector('img');
  thumb.style.viewTransitionName = 'artwork';
  const vt = document.startViewTransition(async () => {
    thumb.style.viewTransitionName = '';
    big.style.viewTransitionName = 'artwork';
    await fill();
  });
  vt.finished.finally(() => { big.style.viewTransitionName = ''; dialog.classList.remove('no-anim'); });
}
dialog.addEventListener('click', (e) => { if (e.target === dialog || e.target.closest('[data-close]')) dialog.close(); });
$('#gallery-grid').append(...gallery.items.map((g) => {
  const tile = el('button', { class: 'tile lean reveal', type: 'button', 'aria-label': `Open artwork by ${g.authorName}` }, [
    el('img', { src: cl(g.url, 600), srcset: `${cl(g.url, 400)} 400w, ${cl(g.url, 800)} 800w`, sizes: '(min-width: 1000px) 22vw, 50vw', alt: '', width: g.width, height: g.height, loading: 'lazy' }),
    el('span', { class: 'tile__credit', text: `by ${g.authorName}` }),
  ]);
  tile.addEventListener('click', () => openArtwork(tile, g));
  return tile;
}));

// ---------------------------------------------------------------- FOOTER
$('#foot-socials').append(...OFFICIAL_LINKS.slice(0, 6).map((l) => {
  const s = SOCIALS.find((x) => x.url === l.url);
  return socialBadge({ ...l, handle: l.label, icon: s?.icon || null });
}));
const artists = new Map();
gallery.items.forEach((g) => { if (!artists.has(g.authorName)) artists.set(g.authorName, g.sourceUrl); });
$('#foot-credits').append(...[...artists].map(([name, url]) => el('li', {}, [
  icon('cl-leaf', 'cl cl--pink'),
  url ? el('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: name }) : el('span', { text: name }),
])));

// ---------------------------------------------------------------- next-stream ticket (flip digits)
const ticket = $('#ticket');
const nums = $$('#flip .flip__num');
let forceLive = false;
let lastMinute = -1;
function tick() {
  const now = Date.now();
  const s = nextStream(now);
  const live = forceLive || !!s?.live;
  ticket.classList.toggle('is-live', live);
  if (live || !s) return;
  let diff = Math.max(0, Math.floor((s.start - now) / 1000));
  const d = Math.floor(diff / 86400); diff %= 86400;
  const h = Math.floor(diff / 3600); diff %= 3600;
  const m = Math.floor(diff / 60); const sec = diff % 60;
  [d, h, m, sec].map(pad).forEach((v, i) => {
    if (nums[i].textContent === v) return;
    nums[i].textContent = v;
    nums[i].classList.remove('is-flipping');
    void nums[i].offsetWidth;          // restart the flip animation
    nums[i].classList.add('is-flipping');
  });
  if (m !== lastMinute) { lastMinute = m; $('#flip-sr').textContent = `Next stream in ${d} days, ${h} hours, ${m} minutes`; }
}
tick();
setInterval(tick, 1000);
$('#live-preview').addEventListener('click', (e) => {
  forceLive = !forceLive;
  e.currentTarget.textContent = forceLive ? 'Back to the countdown' : 'Preview the LIVE badge';
  tick();
});

// ---------------------------------------------------------------- loader demo
const spinner = mountSpinner($('#loader-spinner'));
waveText($('#loader-text'), 'Loading…');
const facts = en.about.pills.map((p) => `Did you know? ${p.label}: ${p.value}`);
const layer = $('#loader-layer');
const supportsIris = !!(window.CSS && CSS.registerProperty) && CSS.supports('mask-image', 'radial-gradient(circle, #000, #0000)');
let loadRun = 0;
let factTimer = 0;
const showFact = (i) => { $('#loader-fact').textContent = facts[i % facts.length]; };
function runLoading() {
  const run = ++loadRun;
  layer.classList.remove('is-open', 'fade-out');
  layer.classList.toggle('iris-out', supportsIris);
  spinner.reset();
  let i = Math.floor(Math.random() * facts.length);
  showFact(i);
  clearInterval(factTimer);
  factTimer = setInterval(() => showFact(++i), 2800);
  let p = 0;
  const step = () => {
    if (run !== loadRun) return;
    p += 1;
    spinner.setProgress(p / 4);
    if (p < 4) setTimeout(step, 500 + Math.random() * 600);
  };
  setTimeout(step, 700);
}
function playExit() {
  const box = layer.getBoundingClientRect();
  const s = $('#loader-spinner').getBoundingClientRect();
  spinner.complete();
  $('#loader-spinner').classList.add('is-whoosh');
  setTimeout(() => {
    $('#loader-spinner').classList.remove('is-whoosh');
    layer.style.setProperty('--iris-x', `${s.left + s.width / 2 - box.left}px`);
    layer.style.setProperty('--iris-y', `${s.top + s.height / 2 - box.top}px`);
    if (!supportsIris) layer.classList.add('fade-out');
    layer.classList.add('is-open');
    clearInterval(factTimer);
  }, isCalm() ? 0 : 520);
}
$('#loader-replay').addEventListener('click', runLoading);
$('#loader-exit').addEventListener('click', playExit);
runLoading();

// ---------------------------------------------------------------- section-change demo + title letters
const gsap = await whenGsap(6000);
if (gsap && window.SplitText) gsap.registerPlugin(window.SplitText);

const scenes = [
  { accent: 'news', art: '/assets/bg/news-1280.webp', en: 'NEWS', ja: 'ニュース', build: () => news.items.slice(0, 2).map((n) => note(n)) },
  { accent: 'disco', art: '/assets/bg/discography-1280.webp', en: 'MUSIC', ja: 'ディスコグラフィ', build: () => disco.items.slice(0, 2).map((d) => el('div', { class: 'paper' }, [sleeve(d, en.discography?.types)])) },
  { accent: 'gallery', art: '/assets/bg/gallery-1280.webp', en: 'GALLERY', ja: 'ファンアート', build: () => [el('div', { class: 'paper' }, [el('p', { text: 'Fan-art montage: tiles fly in and settle into the masonry.' })])] },
];
let scene = 0;
const stage = $('#stage');
function showScene(i, animate) {
  const sc = scenes[i];
  stage.dataset.accent = sc.accent;
  $('#stage-art').src = sc.art;
  const title = el('header', { class: 'sec-title' }, [
    el('span', { class: 'sec-title__num', text: String(i + 2).padStart(2, '0') }),
    el('h3', { class: 'sec-title__en', text: sc.en }),
    el('p', { class: 'sec-title__ja', lang: 'ja', text: sc.ja }),
  ]);
  const cards = el('div', { class: 'stage__cards' }, sc.build());
  $('#stage-content').replaceChildren(title, cards);
  if (!animate || !gsap || isCalm()) return;
  popLetters(title.querySelector('.sec-title__en'), gsap, { stagger: 0.04 });
  gsap.from(title.querySelector('.sec-title__num'), { scale: 0, rotation: -90, duration: beats(1), ease: 'back.out(2.4)' });
  gsap.from(title.querySelector('.sec-title__ja'), { x: -30, opacity: 0, duration: beats(1), ease: 'power3.out', delay: beats(0.25) });
  gsap.from(cards.children, { y: 40, opacity: 0, duration: beats(1.2), ease: 'power3.out', stagger: beats(0.25), delay: beats(0.4) });
}
showScene(0, false);
$$('[data-stage]').forEach((btn) => btn.addEventListener('click', () => {
  const down = btn.dataset.stage === 'down';
  scene = (scene + (down ? 1 : scenes.length - 1)) % scenes.length;
  const accent = getComputedStyle(document.documentElement).getPropertyValue(`--accent-${scenes[scene].accent}`).trim();
  playWipe({ direction: down ? 'down' : 'up', accent, onCovered: () => showScene(scene, true) });
}));

// Section titles bounce in letter by letter the first time each one arrives
await document.fonts?.ready;
if (gsap && !isCalm()) {
  const seen = new WeakSet();
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting || seen.has(e.target) || isCalm()) return;
    seen.add(e.target);
    popLetters(e.target, gsap, { stagger: 0.035 });
  }), { threshold: 0.6 });
  $$('.scene .sec-title__en').forEach((h) => io.observe(h));
}
