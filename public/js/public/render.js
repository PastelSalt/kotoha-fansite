// DOM builders for public content (design v2 components). All database text goes through textContent (never innerHTML).
import { t } from '../shared/i18n-core.js';
import { el } from '../shared/dom.js';

export { el };

const NS = 'http://www.w3.org/2000/svg';
const SPRITE = '/assets/svg/v2-sprite.svg';

/** Illustrated clover / sparkle / heart from the v2 sprite: sprite('cl-leaf', 'cl cl--pink'). Decorative. */
export function sprite(symbol, cls = 'cl') {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `${SPRITE}#${symbol}`);
  svg.append(use);
  return svg;
}

/** Line icon from the inline Lucide sprite in index.html. */
export function icon(name) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

export const formatDate = (iso) => (iso ? iso.slice(0, 10).replaceAll('-', '.') : '');
export const ytThumb = (id, q = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;

/** Cloudinary delivery URL with automatic format/quality and a width limit (never cropped). */
export function cloudinaryUrl(url, width) {
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

function externalLink(url, label, attrs = {}) {
  return el('a', { class: 'chip', href: url, target: '_blank', rel: 'noopener noreferrer', ...attrs }, [
    el('span', { text: label }), icon('external'),
    el('span', { class: 'visually-hidden', text: t('common.opensNewTab') }),
  ]);
}

function linkChips(links, trackAttrs = () => ({})) {
  if (!links?.length) return null;
  return el('p', { class: 'chips' }, links.map((l) => externalLink(l.url, t(`links.${l.labelKey}`), trackAttrs(l))));
}

/** Click-to-load YouTube video as a polaroid photo (no iframe until the visitor asks for it). */
export function videoPolaroid(video, { label = null, rot = 1.5 } = {}) {
  const fig = el('figure', { class: 'polaroid lean', style: `--polaroid-rot: ${rot}deg` });
  const photo = el('button', {
    class: 'polaroid__photo', type: 'button', 'aria-label': t('video.play', { title: video.title }),
    'data-track': 'video_play', 'data-track-type': 'video', 'data-track-id': video.id, 'data-track-target': video.youtubeId,
  }, [
    el('img', { src: ytThumb(video.youtubeId), alt: '', loading: 'lazy', decoding: 'async', width: 480, height: 360 }),
    el('span', { class: 'play', 'aria-hidden': 'true' }),
  ]);
  photo.addEventListener('click', () => {
    photo.replaceWith(el('iframe', {
      class: 'polaroid__photo',
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?autoplay=1&rel=0&playsinline=1`,
      title: video.title,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowfullscreen: true,
      referrerpolicy: 'strict-origin-when-cross-origin',
    }));
  });
  fig.append(label ? el('span', { class: 'ribbon', text: label }) : null, photo, el('figcaption', { text: video.title }));
  return fig;
}

/** A frame of the film strip (other videos). */
export function filmFrame(video, { current, onSelect }) {
  return el('button', {
    class: 'film__frame', type: 'button', 'aria-current': String(Boolean(current)), 'aria-label': video.title,
    onclick: () => onSelect(video),
  }, [el('img', { src: ytThumb(video.youtubeId, 'mqdefault'), alt: '', loading: 'lazy', decoding: 'async', width: 320, height: 180 })]);
}

/** Paper note for a news item; `isNew` adds the NEW stamp, `tape` swaps the clover pin for washi tape. */
export function newsNote(item, { isNew = false, tape = false, links = true } = {}) {
  return el('article', { class: 'paper note lean reveal' }, [
    tape ? el('span', { class: 'tape' }) : sprite('cl-leaf', 'cl cl--pink pin'),
    isNew ? el('span', { class: 'stamp', text: t('news.new') }) : null,
    el('time', { class: 'date-chip', datetime: item.postedOn, text: formatDate(item.postedOn) }),
    el('h3', { class: 'note__title', text: item.headline }),
    el('p', { class: 'note__text', text: item.summary }),
    links ? linkChips(item.links, (l) => ({
      'data-track': 'news_link_click', 'data-track-type': 'news', 'data-track-id': item.id, 'data-track-target': l.labelKey,
    })) : null,
  ]);
}

/** Record sleeve + disc; a designed placeholder cover when there is no YouTube thumbnail. */
export function releaseSleeve(item) {
  const type = t(`discography.types.${item.releaseType}`);
  return el('article', { class: 'sleeve' }, [
    el('div', { class: 'sleeve__art' }, [
      el('span', { class: 'sleeve__disc', 'aria-hidden': 'true' }),
      item.youtubeId
        ? el('img', { src: ytThumb(item.youtubeId, 'mqdefault'), alt: '', loading: 'lazy', decoding: 'async' })
        : el('div', { class: 'sleeve__cover', 'aria-hidden': 'true' }, [el('b', { text: type }), el('span', { text: item.title }), sprite('cl-round', 'cl cl--white')]),
    ]),
    el('div', { class: 'sleeve__meta' }, [
      el('p', { class: 'sleeve__kind' }, [`${type} · `, el('time', { datetime: item.releasedOn, text: formatDate(item.releasedOn) })]),
      el('h3', { class: 'sleeve__title', text: item.title }),
      item.note ? el('p', { class: 'sleeve__note', text: item.note }) : null,
      linkChips(item.links),
    ]),
  ]);
}

/** Timeline rows for one achievement; a year pill comes first when the year changes. */
export function achievementRows(item, index, all) {
  const year = item.achievedOn.slice(0, 4);
  const rows = [];
  if (index === 0 || all[index - 1].achievedOn.slice(0, 4) !== year) rows.push(el('li', { class: 'timeline__year', text: year }));
  const text = item.linkUrl ? externalLink(item.linkUrl, item.text) : el('span', { text: item.text });
  rows.push(el('li', { class: 'timeline__item' }, [
    sprite('cl-leaf', 'cl cl--pink'),
    el('time', { datetime: item.achievedOn, text: formatDate(item.achievedOn).slice(5) }),
    el('p', {}, [text]),
  ]));
  return rows;
}

export function galleryTile(img, onOpen) {
  const alt = t('gallery.alt', { name: img.authorName });
  return el('button', {
    class: 'tile lean reveal', type: 'button', onclick: (e) => onOpen(e.currentTarget), 'aria-label': alt,
    'data-track': 'gallery_open', 'data-track-type': 'gallery', 'data-track-id': img.id,
  }, [
    el('img', {
      src: cloudinaryUrl(img.url, 600),
      srcset: `${cloudinaryUrl(img.url, 400)} 400w, ${cloudinaryUrl(img.url, 800)} 800w`,
      sizes: '(min-width: 1250px) 20vw, (min-width: 1000px) 24vw, (min-width: 700px) 32vw, 48vw',
      alt: '', width: img.width, height: img.height, loading: 'lazy', decoding: 'async',
    }),
    el('span', { class: 'tile__credit', text: t('gallery.by', { name: img.authorName }) }),
  ]);
}

/** Official-channel badge (icon + handle). `<li>` ready to drop into a .socials list. */
export function socialBadge(s) {
  return el('li', {}, [el('a', {
    class: 'social', href: s.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': s.handle ? `${s.label} ${s.handle}` : s.label,
    'data-track': 'outbound_click', 'data-track-type': 'social', 'data-track-target': s.id,
  }, [
    s.icon ? el('img', { src: s.icon, alt: '', width: 96, height: 96, loading: 'lazy' }) : sprite('cl-leaf', 'cl'),
    el('span', { text: s.handle || s.label }),
  ])]);
}

/** Empty / error states with the mascot. */
export function stateNote(kind, { textKey, onRetry } = {}) {
  const box = el('div', { class: 'paper state-note', role: kind === 'error' ? 'alert' : null }, [
    el('img', { src: '/assets/img/mascot-front-240.webp', alt: '', loading: 'lazy', width: 240, height: 204 }),
    el('p', { text: t(textKey || (kind === 'error' ? 'common.retry' : 'news.empty')) }),
  ]);
  if (onRetry) box.append(el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: '↻', 'aria-label': t('common.retry'), onclick: onRetry }));
  return box;
}
