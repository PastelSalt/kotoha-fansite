// Dashboard visitor statistics (Japan time; weeks start Monday): KPIs, visit charts and breakdowns.
// Charts are plain SVG/HTML — no chart library. All labels go through textContent.
// Layout (docs/ADMIN_UI_PLAN.md §4): fixed-period KPIs + visits chart, then everything the range control affects.
import { t, currentLang } from '../shared/i18n-core.js';
import { api, errorText } from './api.js';
import { el, icon, refreshIcons, sticker, stateBox } from './ui.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}
const svgTitle = (text) => { const n = svg('title'); n.textContent = text; return n; };
const svgText = (attrs, text) => { const n = svg('text', attrs); n.textContent = text; return n; };

// Platform names are brands: the same in both languages.
const PLATFORMS = {
  x: 'X (Twitter)', youtube: 'YouTube', twitch: 'Twitch', twitcasting: 'TwitCasting', instagram: 'Instagram',
  bluesky: 'Bluesky', fanbox: 'PixivFANBOX', litlink: 'lit.link', hakoniwalily: 'ハコニワリリィ Official', booth: 'BOOTH',
};
const LANG_NAMES = { ja: '日本語', en: 'English' };

const locale = () => (currentLang() === 'ja' ? 'ja-JP' : 'en-US');
const fmt = (n) => new Intl.NumberFormat(locale()).format(n);
const fmtCompact = (n) => new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const fmtSeconds1 = (ms) => (ms === null || ms === undefined ? '—'
  : t('analytics.seconds', { n: new Intl.NumberFormat(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ms / 1000) }));
function duration(ms) {
  if (ms === null || ms === undefined) return '—';
  const s = Math.round(ms / 1000);
  return s < 60 ? t('analytics.seconds', { n: s }) : t('analytics.minutes', { m: Math.floor(s / 60), s: s % 60 });
}
function countryName(code) {
  if (!/^[A-Z]{2}$/.test(code)) return t('analytics.unknown');
  try { return new Intl.DisplayNames([locale()], { type: 'region' }).of(code) || code; } catch { return code; }
}

function segmented(name, options, value, onChange, label) {
  return el('div', { class: 'segmented', role: 'radiogroup', 'aria-label': label }, options.map(([v, text]) =>
    el('label', {}, [
      el('input', { type: 'radio', name, value: v, checked: v === value, onchange: () => onChange(v) }),
      el('span', { text }),
    ])));
}

// ---------------------------------------------------------------- pieces
function kpi(iconName, label, value, sub) {
  return el('div', { class: 'kpi' }, [
    el('p', { class: 'kpi__label' }, [icon(iconName), el('span', { text: label })]),
    el('p', { class: 'kpi__value', text: value }),
    sub ? el('p', { class: 'kpi__sub', text: sub }) : null,
  ]);
}

function periodLabel(kind, key) {
  if (kind === 'monthly') {
    const d = new Date(`${key}-01T00:00:00Z`);
    return new Intl.DateTimeFormat(locale(), { month: 'short', timeZone: 'UTC' }).format(d);
  }
  const [, m, d] = key.split('-').map(Number);
  return `${m}/${d}`;
}
function periodLong(kind, key) {
  if (kind === 'monthly') return new Intl.DateTimeFormat(locale(), { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${key}-01T00:00:00Z`));
  const s = new Intl.DateTimeFormat(locale(), { month: 'short', day: 'numeric', weekday: kind === 'daily' ? 'short' : undefined, timeZone: 'UTC' }).format(new Date(`${key}T00:00:00Z`));
  return kind === 'weekly' ? `${s} –` : s;
}

/**
 * Visits (light bars) with unique visitors (dark bars) per period, drawn at the box's real width so tick text
 * stays 11 px on every screen. Hover, tap or arrow keys show the value of one period in a small label.
 */
function visitsChart(box, kind, points) {
  const W = Math.max(300, Math.round(box.clientWidth || 720));
  const H = W < 480 ? 200 : 240; const padL = 40; const padB = 26; const padT = 12;
  const max = Math.max(1, ...points.map((p) => p.visits));
  const step = (W - padL) / points.length;
  const barW = Math.max(3, step * 0.68);
  const y = (v) => padT + (H - padT - padB) * (1 - v / max);
  const labelEvery = kind === 'daily' ? (W < 480 ? 7 : 5) : (W < 480 ? 3 : 1);
  const nodes = [];
  [0.5, 1].forEach((f) => {
    nodes.push(svg('line', { x1: padL, x2: W, y1: y(max * f), y2: y(max * f), class: 'chart__grid' }));
    nodes.push(svgText({ x: padL - 8, y: y(max * f) + 4, 'text-anchor': 'end', class: 'chart__tick' }, fmtCompact(Math.round(max * f))));
  });
  nodes.push(svg('line', { x1: padL, x2: W, y1: y(0), y2: y(0), class: 'chart__axis' }));
  nodes.push(svgText({ x: padL - 8, y: y(0) + 4, 'text-anchor': 'end', class: 'chart__tick' }, '0'));
  const cols = points.map((p, i) => {
    const x = padL + i * step + (step - barW) / 2;
    const col = svg('g', { class: 'chart__col', 'data-i': i }, [
      svgTitle(`${p.key}: ${t('analytics.visitsN', { n: fmt(p.visits) })} · ${t('analytics.uniquesN', { n: fmt(p.uniques) })}`),
      svg('rect', { x: padL + i * step, y: padT, width: step, height: H - padT - padB, rx: 6, class: 'chart__bg' }),
      svg('rect', { x, y: y(p.visits), width: barW, height: Math.max(0, y(0) - y(p.visits)), rx: 3, class: 'chart__bar' }),
      svg('rect', { x: x + barW * 0.2, y: y(p.uniques), width: barW * 0.6, height: Math.max(0, y(0) - y(p.uniques)), rx: 2, class: 'chart__bar chart__bar--inner' }),
      svg('rect', { x: padL + i * step, y: 0, width: step, height: H, class: 'chart__hit' }),
    ]);
    nodes.push(col);
    const last = i === points.length - 1;
    if ((points.length - 1 - i) % labelEvery === 0) {
      nodes.push(svgText({ x: last ? W : padL + i * step + step / 2, y: H - 6, 'text-anchor': last ? 'end' : 'middle', class: 'chart__tick' }, periodLabel(kind, p.key)));
    }
    return { col, cx: padL + i * step + step / 2, top: y(p.visits) };
  });
  const chart = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'chart', role: 'img', 'aria-label': t(`analytics.${kind}`) }, nodes);

  const tip = el('div', { class: 'chart-tip', 'aria-live': 'polite', hidden: true });
  let active = -1;
  const show = (i) => {
    if (i < 0 || i >= points.length) return;
    cols[active]?.col.classList.remove('is-active');
    active = i;
    const { col, cx, top } = cols[i];
    col.classList.add('is-active');
    const p = points[i];
    tip.replaceChildren(el('strong', { text: periodLong(kind, p.key) }), ' ',
      t('analytics.visitsN', { n: fmt(p.visits) }), ' · ', t('analytics.uniquesN', { n: fmt(p.uniques) }));
    tip.hidden = false;
    const pct = cx / W;
    tip.style.left = `${pct * 100}%`;
    tip.style.top = `${(top / H) * 100}%`;
    tip.style.translate = `${pct < 0.18 ? '-12%' : pct > 0.82 ? '-88%' : '-50%'} calc(-100% - 8px)`;
  };
  const hide = () => { cols[active]?.col.classList.remove('is-active'); active = -1; tip.hidden = true; };
  chart.addEventListener('pointerover', (e) => { const g = e.target.closest('.chart__col'); if (g) show(Number(g.dataset.i)); });
  box.onpointerleave = hide;
  box.onfocus = () => show(active < 0 ? points.length - 1 : active);
  box.onblur = hide;
  box.onkeydown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(Math.max(0, active - 1)); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(Math.min(points.length - 1, active + 1)); }
  };
  box.replaceChildren(chart, tip);
}

function hoursChart(hours) {
  const W = 300; const H = 120; const padB = 18;
  const max = Math.max(1, ...hours.map((h) => h.value));
  const peak = hours.reduce((best, h, i) => (h.value > hours[best].value ? i : best), 0);
  const step = W / 24;
  const nodes = [];
  hours.forEach((h, i) => {
    const bh = (H - padB - 4) * (h.value / max);
    nodes.push(svg('g', {}, [
      svgTitle(`${h.key}:00–${h.key}:59 JST · ${t('analytics.visitsN', { n: fmt(h.value) })}`),
      svg('rect', { x: i * step + 1.5, y: H - padB - bh, width: step - 3, height: Math.max(bh, 1), rx: 2, class: `chart__bar chart__bar--inner${i === peak ? ' chart__bar--peak' : ''}` }),
    ]));
    if (i % 6 === 0) nodes.push(svgText({ x: i * step + step / 2, y: H - 4, 'text-anchor': 'middle', class: 'chart__tick' }, String(i)));
  });
  return el('div', {}, [
    svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart chart--hours', role: 'img', 'aria-label': t('analytics.hours') }, nodes),
    el('p', { class: 'chart-note', text: t('analytics.peakHour', { h: hours[peak].key, n: fmt(hours[peak].value) }) }),
  ]);
}

/** Horizontal bar list: [{ label, value, display }] */
function barList(rows, { empty = t('analytics.noData') } = {}) {
  if (!rows.length) return stateBox(empty, { small: true });
  const max = Math.max(1, ...rows.map((r) => r.value));
  return el('ul', { class: 'bars' }, rows.map((r, i) => el('li', { class: 'bars__row' }, [
    el('span', { class: 'bars__rank', text: String(i + 1), 'aria-hidden': 'true' }),
    el('span', { class: 'bars__label', text: r.label, title: r.label }),
    el('span', { class: 'bars__value', text: r.display ?? fmt(r.value) }),
    el('span', { class: 'bars__track', 'aria-hidden': 'true' }, [el('span', { class: 'bars__fill', style: `width:${Math.max(2, (r.value / max) * 100)}%` })]),
  ])));
}

const card = (titleKey, iconName, body, hintKey) => el('section', { class: 'panel panel--stat' }, [
  el('h2', {}, [icon(iconName), el('span', { text: t(titleKey) })]),
  hintKey ? el('p', { class: 'form-hint', text: t(hintKey) }) : null,
  body,
]);
const group = (titleKey, cards) => [
  el('h3', { class: 'group-title' }, [el('span', { text: t(titleKey) })]),
  el('div', { class: 'stat-grid' }, cards),
];

// ---------------------------------------------------------------- main
export function renderAnalytics(container) {
  let range = 30;
  let chartKind = 'daily';
  let data = null;
  let resizeObs = null;

  const head = () => el('div', { class: 'block-head' }, [
    el('h2', {}, [sticker(t('analytics.title'), { small: true, pink: true })]),
    el('p', { class: 'block-head__note', text: t('analytics.hint') }),
  ]);

  const draw = () => {
    const d = data;
    const k = d.kpis;
    const japan = d.countries.filter((c) => c.key === 'JP').reduce((s, c) => s + c.value, 0);
    const known = d.countries.reduce((s, c) => s + c.value, 0);

    const chartBox = el('div', { class: 'chart-box', tabindex: '0' });
    const total = el('p', { class: 'panel__total' });
    const drawChart = () => {
      const pts = d.series[chartKind];
      visitsChart(chartBox, chartKind, pts);
      total.textContent = t('analytics.totalShown', {
        visits: fmt(pts.reduce((s, p) => s + p.visits, 0)), uniques: fmt(pts.reduce((s, p) => s + p.uniques, 0)),
      });
    };
    const chartTabs = segmented('chart-kind', [['daily', t('analytics.daily')], ['weekly', t('analytics.weekly')], ['monthly', t('analytics.monthly')]],
      chartKind, (v) => { chartKind = v; drawChart(); }, t('analytics.visits'));
    const rangeTabs = segmented('range', [[7, t('analytics.range7')], [30, t('analytics.range30')], [90, t('analytics.range90')], [365, t('analytics.range365')]]
      .map(([v, l]) => [String(v), l]), String(range), (v) => { range = Number(v); load(); }, t('analytics.breakdownFor'));

    container.replaceChildren(
      head(),
      el('div', { class: 'kpis' }, [
        kpi('sun', t('analytics.today'), fmt(k.today.visits), t('analytics.uniquesN', { n: fmt(k.today.uniques) })),
        kpi('calendar-days', t('analytics.thisWeek'), fmt(k.week.visits), t('analytics.uniquesN', { n: fmt(k.week.uniques) })),
        kpi('calendar', t('analytics.thisMonth'), fmt(k.month.visits), t('analytics.uniquesN', { n: fmt(k.month.uniques) })),
      ]),
      el('section', { class: 'panel' }, [
        el('div', { class: 'panel__head' }, [
          el('div', {}, [el('h2', {}, [icon('chart-column'), el('span', { text: t('analytics.visits') })]), total]),
          chartTabs,
        ]),
        chartBox,
        el('p', { class: 'chart-legend' }, [
          el('span', {}, [el('i', { class: 'chart-legend__key' }), t('analytics.visitsLegend')]),
          el('span', {}, [el('i', { class: 'chart-legend__key chart-legend__key--inner' }), t('analytics.uniquesLegend')]),
        ]),
      ]),
      el('div', { class: 'paper range-bar' }, [
        el('h2', {}, [icon('sliders-horizontal'), el('span', { text: t('analytics.breakdownFor') })]),
        rangeTabs,
        el('span', { class: 'form-hint', text: t('analytics.rangeVisits', { n: fmt(k.range.visits) }) }),
      ]),
      el('div', { class: 'kpis kpis--range' }, [
        kpi('timer', t('analytics.avgVisit'), duration(k.avgVisitMs), t('analytics.inRange', { n: range })),
        kpi('loader', t('analytics.avgLoading'), fmtSeconds1(k.avgLoaderMs), t('analytics.inRange', { n: range })),
      ]),
      ...group('analytics.groups.audience', [
        card('analytics.devices', 'smartphone', barList(d.devices.map((r) => ({ label: t(`analytics.deviceNames.${r.key}`), value: r.value })))),
        card('analytics.browsers', 'globe', barList(d.browsers.map((r) => ({ label: r.key, value: r.value })))),
        card('analytics.languages', 'languages', el('div', {}, [
          barList(d.languages.map((r) => ({ label: LANG_NAMES[r.key] || t('analytics.unknown'), value: r.value }))),
          el('p', { class: 'form-hint bars-note', text: t('analytics.switches', {
            ja: fmt(d.langSwitches.find((s) => s.key === 'ja')?.value || 0),
            en: fmt(d.langSwitches.find((s) => s.key === 'en')?.value || 0),
          }) }),
        ])),
        card('analytics.countries', 'map-pin', el('div', {}, [
          el('p', { class: 'form-hint bars-lead', text: t('analytics.japanShare', { pct: known ? Math.round((japan / known) * 100) : 0 }) }),
          barList(d.countries.map((r) => ({ label: countryName(r.key), value: r.value }))),
        ])),
      ]),
      ...group('analytics.groups.traffic', [
        card('analytics.sources', 'link', barList(d.sources.map((r) => ({ label: r.key || t('analytics.direct'), value: r.value })))),
        card('analytics.hours', 'clock', d.hours.some((h) => h.value) ? hoursChart(d.hours) : stateBox(t('analytics.noData'), { small: true }), 'analytics.hoursHint'),
      ]),
      ...group('analytics.groups.engagement', [
        card('analytics.sections', 'layers', barList(d.sections.filter((s) => s.reach).map((s) => ({
          label: t(`analytics.sectionNames.${s.key}`), value: s.reachPct,
          display: `${s.reachPct}% · ${duration(s.avgMs)}`,
        }))), 'analytics.sectionsHint'),
        card('analytics.videoPlays', 'circle-play', barList(d.videoPlays.map((r) => ({ label: r.name || t('analytics.removedItem', { id: r.key }), value: r.value })))),
        card('analytics.socialClicks', 'mouse-pointer-click', barList(d.outbound.map((r) => ({ label: PLATFORMS[r.key] || r.key, value: r.value })))),
        card('analytics.newsLinks', 'newspaper', barList(d.newsLinks.map((r) => ({ label: r.name || t('analytics.removedItem', { id: r.key }), value: r.value })))),
        card('analytics.gallery', 'images', barList(d.gallery.map((r) => ({
          label: r.name || t('analytics.removedItem', { id: r.key }), value: r.opens,
          display: t('analytics.opensCredits', { opens: fmt(r.opens), credits: fmt(r.creditClicks) }),
        }))), 'analytics.galleryHint'),
      ]),
      el('p', { class: 'paper privacy-note' }, [icon('shield-check'), el('span', { text: t('analytics.privacyNote') })]),
    );
    drawChart();
    refreshIcons();
    // Redraw the chart when its width changes noticeably (phone rotation, sidebar breakpoint).
    resizeObs?.disconnect();
    let lastW = chartBox.clientWidth;
    resizeObs = new ResizeObserver(() => {
      if (!chartBox.isConnected) { resizeObs.disconnect(); return; }
      if (Math.abs(chartBox.clientWidth - lastW) > 30) { lastW = chartBox.clientWidth; drawChart(); }
    });
    resizeObs.observe(chartBox);
  };

  async function load() {
    container.setAttribute('aria-busy', 'true');
    try {
      data = await api(`admin/analytics?range=${range}`);
      draw();
    } catch (err) {
      container.replaceChildren(head(), stateBox(errorText(err), {
        kind: 'error', action: el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: t('common.retry'), onclick: load }),
      }));
      refreshIcons();
    } finally {
      container.removeAttribute('aria-busy');
    }
  }

  // First load: placeholders at the final size so the page doesn't jump when the numbers arrive.
  container.replaceChildren(head(),
    el('div', { class: 'kpis' }, [1, 2, 3].map(() => el('div', { class: 'skeleton skeleton--kpi', 'aria-hidden': 'true' }))),
    el('div', { class: 'skeleton skeleton--chart', 'aria-hidden': 'true' }),
    el('p', { class: 'visually-hidden', text: t('common.loading') }));
  load();
}
