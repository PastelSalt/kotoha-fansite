// Dashboard visitor statistics (Japan time; weeks start Monday): KPIs, visit charts and breakdowns.
// Charts are plain SVG/HTML — no chart library. All labels go through textContent.
import { t, currentLang } from '../shared/i18n-core.js';
import { api, errorText } from './api.js';
import { el } from './ui.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}
const svgTitle = (text) => { const n = svg('title'); n.textContent = text; return n; };

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

function segmented(name, options, value, onChange) {
  return el('div', { class: 'segmented', role: 'radiogroup' }, options.map(([v, label]) =>
    el('label', {}, [
      el('input', { type: 'radio', name, value: v, checked: v === value, onchange: () => onChange(v) }),
      el('span', { text: label }),
    ])));
}

// ---------------------------------------------------------------- pieces
function kpi(label, value, sub) {
  return el('div', { class: 'stat' }, [
    el('p', { class: 'stat__label', text: label }),
    el('p', { class: 'stat__value', text: value }),
    sub ? el('p', { class: 'stat__sub', text: sub }) : null,
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

/** Visits (light bars) with unique visitors (dark bars) per period. */
function visitsChart(kind, points) {
  const W = 720; const H = 230; const padL = 50; const padB = 30; const padT = 14;
  const max = Math.max(1, ...points.map((p) => p.visits));
  const step = (W - padL) / points.length;
  const barW = Math.max(3, step * 0.7);
  const y = (v) => padT + (H - padT - padB) * (1 - v / max);
  const labelEvery = kind === 'daily' ? 5 : 1;
  const nodes = [
    svg('line', { x1: padL, x2: W, y1: y(0), y2: y(0), class: 'chart__axis' }),
    svg('line', { x1: padL, x2: W, y1: y(max), y2: y(max), class: 'chart__grid' }),
    svg('text', { x: padL - 6, y: y(max) + 4, 'text-anchor': 'end', class: 'chart__tick' }, [document.createTextNode(fmtCompact(max))]),
    svg('text', { x: padL - 6, y: y(0) + 4, 'text-anchor': 'end', class: 'chart__tick' }, [document.createTextNode('0')]),
  ];
  points.forEach((p, i) => {
    const x = padL + i * step + (step - barW) / 2;
    const tip = `${p.key}: ${t('analytics.visitsN', { n: fmt(p.visits) })} · ${t('analytics.uniquesN', { n: fmt(p.uniques) })}`;
    nodes.push(svg('g', { class: 'chart__col' }, [
      svgTitle(tip),
      svg('rect', { x: padL + i * step, y: padT, width: step, height: H - padT - padB, class: 'chart__hit' }),
      svg('rect', { x, y: y(p.visits), width: barW, height: y(0) - y(p.visits), rx: 3, class: 'chart__bar' }),
      svg('rect', { x: x + barW * 0.2, y: y(p.uniques), width: barW * 0.6, height: y(0) - y(p.uniques), rx: 2, class: 'chart__bar chart__bar--inner' }),
    ]));
    const last = i === points.length - 1;
    if (i % labelEvery === 0 || last) {
      nodes.push(svg('text', { x: last ? W : padL + i * step + step / 2, y: H - 6, 'text-anchor': last ? 'end' : 'middle', class: 'chart__tick' },
        [document.createTextNode(periodLabel(kind, p.key))]));
    }
  });
  return svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': t(`analytics.${kind}`) }, nodes);
}

function hoursChart(hours) {
  const W = 300; const H = 120; const padB = 18;
  const max = Math.max(1, ...hours.map((h) => h.value));
  const step = W / 24;
  const nodes = [];
  hours.forEach((h, i) => {
    const bh = (H - padB - 4) * (h.value / max);
    nodes.push(svg('g', {}, [
      svgTitle(`${h.key}:00–${h.key}:59 JST · ${t('analytics.visitsN', { n: fmt(h.value) })}`),
      svg('rect', { x: i * step + 1.5, y: H - padB - bh, width: step - 3, height: Math.max(bh, 1), rx: 2, class: 'chart__bar chart__bar--inner' }),
    ]));
    if (i % 3 === 0) nodes.push(svg('text', { x: i * step + step / 2, y: H - 4, 'text-anchor': 'middle', class: 'chart__tick' }, [document.createTextNode(String(i))]));
  });
  return svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart chart--hours', role: 'img', 'aria-label': t('analytics.hours') }, nodes);
}

/** Horizontal bar list: [{ label, value, display }] */
function barList(rows, { empty = t('analytics.noData') } = {}) {
  if (!rows.length) return el('p', { class: 'empty empty--small', text: empty });
  const max = Math.max(1, ...rows.map((r) => r.value));
  return el('ul', { class: 'bars' }, rows.map((r) => el('li', { class: 'bars__row' }, [
    el('span', { class: 'bars__label', text: r.label, title: r.label }),
    el('span', { class: 'bars__value', text: r.display ?? fmt(r.value) }),
    el('span', { class: 'bars__track', 'aria-hidden': 'true' }, [el('span', { class: 'bars__fill', style: `width:${Math.max(2, (r.value / max) * 100)}%` })]),
  ])));
}

const card = (titleKey, body, hintKey) => el('section', { class: 'panel panel--stat' }, [
  el('h2', { text: t(titleKey) }),
  hintKey ? el('p', { class: 'form-hint', text: t(hintKey) }) : null,
  body,
]);

// ---------------------------------------------------------------- main
export function renderAnalytics(container) {
  let range = 30;
  let chartKind = 'daily';
  let data = null;

  const draw = () => {
    const d = data;
    const k = d.kpis;
    const rangeVisits = k.range.visits;
    const japan = d.countries.filter((c) => c.key === 'JP').reduce((s, c) => s + c.value, 0);
    const known = d.countries.reduce((s, c) => s + c.value, 0);

    const chartBox = el('div', { class: 'chart-box' }, [visitsChart(chartKind, d.series[chartKind])]);
    const chartTabs = segmented('chart-kind', [['daily', t('analytics.daily')], ['weekly', t('analytics.weekly')], ['monthly', t('analytics.monthly')]],
      chartKind, (v) => { chartKind = v; chartBox.replaceChildren(visitsChart(v, d.series[v])); });
    const rangeTabs = segmented('range', [[7, t('analytics.range7')], [30, t('analytics.range30')], [90, t('analytics.range90')], [365, t('analytics.range365')]]
      .map(([v, l]) => [String(v), l]), String(range), (v) => { range = Number(v); load(); });

    container.replaceChildren(
      el('div', { class: 'page-head page-head--sub' }, [el('div', {}, [
        el('h2', { text: t('analytics.title') }),
        el('p', { text: t('analytics.hint') }),
      ])]),
      el('div', { class: 'stats' }, [
        kpi(t('analytics.today'), fmt(k.today.visits), t('analytics.uniquesN', { n: fmt(k.today.uniques) })),
        kpi(t('analytics.thisWeek'), fmt(k.week.visits), t('analytics.uniquesN', { n: fmt(k.week.uniques) })),
        kpi(t('analytics.thisMonth'), fmt(k.month.visits), t('analytics.uniquesN', { n: fmt(k.month.uniques) })),
        kpi(t('analytics.avgVisit'), duration(k.avgVisitMs), t('analytics.inRange', { n: range })),
        kpi(t('analytics.avgLoading'), fmtSeconds1(k.avgLoaderMs), t('analytics.inRange', { n: range })),
      ]),
      el('section', { class: 'panel' }, [
        el('div', { class: 'panel__head' }, [el('h2', { text: t('analytics.visits') }), chartTabs]),
        chartBox,
        el('p', { class: 'chart-legend' }, [
          el('span', { class: 'chart-legend__key' }), t('analytics.visitsLegend'), ' ',
          el('span', { class: 'chart-legend__key chart-legend__key--inner' }), t('analytics.uniquesLegend'),
        ]),
      ]),
      el('div', { class: 'toolbar' }, [
        el('strong', { text: t('analytics.breakdownFor') }), rangeTabs,
        el('span', { class: 'form-hint', text: t('analytics.rangeVisits', { n: fmt(rangeVisits) }) }),
      ]),
      el('div', { class: 'stat-grid' }, [
        card('analytics.sections', barList(d.sections.filter((s) => s.reach).map((s) => ({
          label: t(`analytics.sectionNames.${s.key}`), value: s.reachPct,
          display: `${s.reachPct}% · ${duration(s.avgMs)}`,
        }))), 'analytics.sectionsHint'),
        card('analytics.devices', barList(d.devices.map((r) => ({ label: t(`analytics.deviceNames.${r.key}`), value: r.value })))),
        card('analytics.languages', el('div', {}, [
          barList(d.languages.map((r) => ({ label: LANG_NAMES[r.key] || t('analytics.unknown'), value: r.value }))),
          el('p', { class: 'form-hint bars-note', text: t('analytics.switches', {
            ja: fmt(d.langSwitches.find((s) => s.key === 'ja')?.value || 0),
            en: fmt(d.langSwitches.find((s) => s.key === 'en')?.value || 0),
          }) }),
        ])),
        card('analytics.countries', el('div', {}, [
          el('p', { class: 'form-hint', text: t('analytics.japanShare', { pct: known ? Math.round((japan / known) * 100) : 0 }) }),
          barList(d.countries.map((r) => ({ label: countryName(r.key), value: r.value }))),
        ])),
        card('analytics.sources', barList(d.sources.map((r) => ({ label: r.key || t('analytics.direct'), value: r.value })))),
        card('analytics.hours', d.hours.some((h) => h.value) ? hoursChart(d.hours) : el('p', { class: 'empty empty--small', text: t('analytics.noData') }), 'analytics.hoursHint'),
        card('analytics.videoPlays', barList(d.videoPlays.map((r) => ({ label: r.name || t('analytics.removedItem', { id: r.key }), value: r.value })))),
        card('analytics.socialClicks', barList(d.outbound.map((r) => ({ label: PLATFORMS[r.key] || r.key, value: r.value })))),
        card('analytics.newsLinks', barList(d.newsLinks.map((r) => ({ label: r.name || t('analytics.removedItem', { id: r.key }), value: r.value })))),
        card('analytics.gallery', barList(d.gallery.map((r) => ({
          label: r.name || t('analytics.removedItem', { id: r.key }), value: r.opens,
          display: t('analytics.opensCredits', { opens: fmt(r.opens), credits: fmt(r.creditClicks) }),
        }))), 'analytics.galleryHint'),
        card('analytics.browsers', barList(d.browsers.map((r) => ({ label: r.key, value: r.value })))),
      ]),
      el('p', { class: 'form-hint', text: t('analytics.privacyNote') }),
    );
  };

  async function load() {
    container.setAttribute('aria-busy', 'true');
    try {
      data = await api(`admin/analytics?range=${range}`);
      draw();
    } catch (err) {
      container.replaceChildren(el('section', { class: 'panel' }, [
        el('h2', { text: t('analytics.title') }),
        el('p', { class: 'form-error', role: 'alert', text: errorText(err) }),
        el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: t('common.retry'), onclick: load }),
      ]));
    } finally {
      container.removeAttribute('aria-busy');
    }
  }

  container.replaceChildren(el('section', { class: 'panel' }, [el('h2', { text: t('analytics.title') }), el('p', { class: 'view__loading', text: t('common.loading') })]));
  load();
}
