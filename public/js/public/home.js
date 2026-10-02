// Home-only pieces built from live data: "this week" strip, "coming soon" cards, fan art of the moment.
import { t } from '../shared/i18n-core.js';
import { el, sprite, formatDate, cloudinaryUrl } from './render.js';
import { nextStream } from './countdown.js';

const jstDate = (ms = Date.now()) => new Date(ms + 9 * 3600e3);          // read with getUTC* for Japan time
const todayJst = () => jstDate().toISOString().slice(0, 10);

/** Whole days from today (JST) until `day` (YYYY-MM-DD). */
export function daysUntil(day) {
  const base = Date.parse(`${todayJst()}T00:00:00+09:00`);
  return Math.round((Date.parse(`${day}T00:00:00+09:00`) - base) / 864e5);
}

/** The first release dated after today (JST), if any. */
export const upcomingRelease = (releases) => releases
  .filter((r) => r.releasedOn > todayJst())
  .sort((a, b) => a.releasedOn.localeCompare(b.releasedOn))[0] || null;

/** True when `postedOn` (YYYY-MM-DD) is within the last `days` days — drives the NEW stamp. */
export const isRecent = (postedOn, days = 45) => daysUntil(postedOn) >= -days;

/** This week's streams (JST; weeks start on Monday): the Tue/Fri slots, today ringed, LIVE while on air. */
export function renderWeek(list) {
  const now = jstDate();
  const dow = (now.getUTCDay() + 6) % 7;                         // 0 = Monday
  const monday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow);
  const names = t('home.days');
  const live = nextStream()?.live;
  list.replaceChildren(...names.map((name, i) => {
    const d = new Date(monday + i * 864e5);
    const stream = i === 1 || i === 4;
    const today = i === dow;
    return el('li', { class: `week__day${stream ? ' is-stream' : ''}${today ? ' is-today' : ''}` }, [
      el('span', { text: name }),
      el('span', { class: 'week__date', text: String(d.getUTCDate()) }),
      el('span', { class: 'week__tag', text: stream ? (today && live ? t('home.live').replace(/[!！]$/, '') : '21:00') : '' }),
      stream ? sprite('cl-leaf', 'cl') : null,
    ]);
  }));
}

/** Small "coming soon" card on Home (right column) + the wide one in Discography. Both hidden when nothing is upcoming. */
export function renderSoon(release, mini, wide) {
  for (const box of [mini, wide]) box.hidden = !release;
  if (!release) return;
  const days = daysUntil(release.releasedOn);
  mini.replaceChildren(
    el('span', { class: 'tape tape--right' }),
    el('span', { class: 'sticker sticker--sm sticker--pink soon__label', text: t('discography.comingSoon') }),
    el('p', { class: 'soon__title', text: release.title }),
    el('p', { class: 'soon__count', text: `${t('discography.inDays', { n: days })} · ${formatDate(release.releasedOn)}` }),
  );
  wide.replaceChildren(
    el('span', { class: 'tape' }),
    el('span', { class: 'sticker sticker--pink soon__label', text: t('discography.comingSoon') }),
    el('div', {}, [
      el('p', { class: 'soon__title', text: release.title }),
      release.note ? el('p', { class: 'ink-soft', text: release.note }) : null,
      el('p', { class: 'date-chip', text: t('discography.releaseOn', { date: formatDate(release.releasedOn) }) }),
    ]),
    el('p', { class: 'soon__days' }, [el('b', { text: String(days) }), el('span', { text: t('discography.daysToGo') })]),
  );
}

/** One artwork chosen at random per visit (stable across language switches). */
let pick = null;
export function renderFanArt(box, images) {
  box.hidden = !images.length;
  if (!images.length) return;
  pick = images.includes(pick) ? pick : images[Math.floor(Math.random() * images.length)];
  box.replaceChildren(
    el('img', { src: cloudinaryUrl(pick.url, 240), alt: t('gallery.alt', { name: pick.authorName }), width: 96, height: 96, loading: 'lazy' }),
    el('div', {}, [
      el('p', { class: 'mini-title' }, [sprite('cl-leaf', 'cl cl--gold'), el('span', { class: 'mini-title__en', text: t('home.fanArtTitle') })]),
      el('p', { class: 'ink-soft', text: t('home.fanArtBy', { name: pick.authorName }) }),
      el('a', { class: 'chip', href: '#gallery', 'data-nav-link': 'gallery', text: t('home.seeGallery') }),
    ]),
  );
}
