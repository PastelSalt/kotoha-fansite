// DOM builders for public content. All database text goes through textContent (never innerHTML).
import { t } from '../shared/i18n-core.js';

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of [].concat(children)) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
}

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

export const formatDate = (iso) => (iso ? iso.slice(0, 10).replaceAll('-', '.') : '');
export const ytThumb = (id, q = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;

function externalLink(url, label, cls = 'chip') {
  return el('a', { class: cls, href: url, target: '_blank', rel: 'noopener noreferrer' }, [
    el('span', { text: label }), icon('external'),
    el('span', { class: 'visually-hidden', text: t('common.opensNewTab') }),
  ]);
}

function linkChips(links, cls) {
  if (!links?.length) return null;
  return el('p', { class: cls }, links.map((l) => externalLink(l.url, t(`links.${l.labelKey}`))));
}

/** Click-to-load YouTube player (no iframe until the visitor asks for it). */
export function videoFacade(video, { badge = null, onPlay } = {}) {
  const btn = el('button', {
    class: 'video-facade', type: 'button', 'aria-label': t('video.play', { title: video.title }),
  }, [
    el('img', { src: ytThumb(video.youtubeId), alt: '', loading: 'lazy', decoding: 'async', width: 480, height: 360 }),
    badge ? el('span', { class: 'video-facade__badge', text: badge }) : null,
    el('span', { class: 'video-facade__play' }, [icon('play')]),
    el('span', { class: 'video-facade__title', text: video.title }),
  ]);
  btn.addEventListener('click', () => {
    const frame = el('iframe', {
      class: 'video-frame',
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?autoplay=1&rel=0&playsinline=1`,
      title: video.title,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowfullscreen: true,
      referrerpolicy: 'strict-origin-when-cross-origin',
    });
    btn.replaceWith(frame);
    onPlay?.(video);
  });
  return btn;
}

export function newsCard(item, { compact = false } = {}) {
  return el('article', { class: 'card news-card' }, [
    el('p', { class: 'news-card__date' }, [el('time', { datetime: item.postedOn, text: formatDate(item.postedOn) })]),
    el('h3', { class: 'news-card__title', text: item.headline }),
    el('p', { class: 'news-card__summary', text: item.summary }),
    compact ? null : linkChips(item.links, 'news-card__links'),
  ]);
}

export function videoChip(video, { current, onSelect }) {
  return el('button', {
    class: 'video-chip', type: 'button', 'aria-current': current ? 'true' : null,
    onclick: () => onSelect(video),
  }, [
    el('img', { src: ytThumb(video.youtubeId, 'mqdefault'), alt: '', loading: 'lazy', decoding: 'async', width: 320, height: 180 }),
    el('span', { text: video.title }),
  ]);
}

export function releaseCard(item) {
  const cover = item.youtubeId
    ? el('div', { class: 'release__cover' }, [el('img', { src: ytThumb(item.youtubeId, 'mqdefault'), alt: '', loading: 'lazy', decoding: 'async' })])
    : el('div', { class: 'release__cover release__cover--placeholder' }, [
      el('img', { src: '/assets/svg/clover-fill.svg', alt: '', loading: 'lazy' }),
      el('span', { class: 'visually-hidden', text: t('discography.noCover') }),
    ]);
  return el('article', { class: 'card release' }, [
    cover,
    el('div', {}, [
      el('p', { class: 'release__meta' }, [
        el('span', { text: t(`discography.types.${item.releaseType}`) }), ' · ',
        el('time', { datetime: item.releasedOn, text: formatDate(item.releasedOn) }),
      ]),
      el('h3', { class: 'release__title', text: item.title }),
      item.note ? el('p', { class: 'release__note', text: item.note }) : null,
      linkChips(item.links, 'release__links'),
    ]),
  ]);
}

export function achievementItem(item) {
  const text = item.linkUrl ? externalLink(item.linkUrl, item.text, '') : el('span', { text: item.text });
  return el('li', {}, [el('time', { datetime: item.achievedOn, text: formatDate(item.achievedOn) }), text]);
}

/** Cloudinary delivery URL with automatic format/quality and a width limit (never cropped). */
export function cloudinaryUrl(url, width) {
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

export function galleryTile(img, onOpen) {
  const alt = t('gallery.alt', { name: img.authorName });
  return el('button', { class: 'tile', type: 'button', onclick: onOpen, 'aria-label': alt }, [
    el('img', {
      src: cloudinaryUrl(img.url, 600),
      srcset: `${cloudinaryUrl(img.url, 400)} 400w, ${cloudinaryUrl(img.url, 800)} 800w`,
      sizes: '(min-width: 900px) 16vw, 45vw',
      alt, width: img.width, height: img.height, loading: 'lazy', decoding: 'async',
      class: 'animate__animated animate__fadeIn',
    }),
    el('span', { class: 'tile__credit', text: t('gallery.by', { name: img.authorName }) }),
  ]);
}

/** Empty / error states with the mascot. */
export function stateMessage(kind, { textKey, onRetry } = {}) {
  const box = el('div', { class: 'state-msg animate__animated animate__fadeIn', role: kind === 'error' ? 'alert' : null }, [
    el('img', { src: '/assets/img/mascot-front-240.webp', alt: '', loading: 'lazy', width: 240, height: 204 }),
    el('p', { text: t(textKey || (kind === 'error' ? 'common.retry' : 'news.empty')) }),
  ]);
  if (onRetry) {
    box.append(el('button', { class: 'btn btn--soft', type: 'button', text: '↻', 'aria-label': t('common.retry'), onclick: onRetry }));
  }
  return box;
}
