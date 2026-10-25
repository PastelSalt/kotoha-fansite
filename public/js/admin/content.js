// Generic content manager for videos, news, achievements and discography (list, add, edit, publish, archive).
import { t } from '../shared/i18n-core.js';
import { api, errorText } from './api.js';
import {
  el, icon, refreshIcons, toast, openDialog, confirmAction, textField, selectField, segmentedField,
  formValue, clearErrors, showFieldErrors, formatDate, todayJst, ytThumb, statusPill, pageHead, stateBox, skeletonRows,
} from './ui.js';

const LINK_KEYS = ['watch', 'listen', 'details', 'tickets', 'official', 'shop'];
const RELEASE_TYPES = ['single', 'album', 'ep', 'tie_in', 'cover', 'collab', 'other'];
const ytUrl = (id) => (id ? `https://www.youtube.com/watch?v=${id}` : '');

// Resource definitions: list presentation + form fields (keys match the API).
export const RESOURCES = {
  videos: {
    icon: 'circle-play',
    date: (i) => i.postedOn,
    title: (i) => i.title,
    thumb: (i) => ytThumb(i.youtubeId),
    fields: [
      { key: 'youtube', type: 'youtube', required: true, label: 'content.fields.youtube', help: 'content.fields.youtubeHelp', from: (i) => ytUrl(i.youtubeId) },
      { key: 'title', type: 'text', max: 200, required: true, label: 'content.fields.title' },
      { key: 'postedOn', type: 'date', required: true, label: 'content.fields.postedOn', initial: todayJst },
      { key: 'status', type: 'status' },
    ],
  },
  news: {
    icon: 'newspaper',
    date: (i) => i.postedOn,
    title: (i) => i.headline,
    text: (i) => i.summary,
    fields: [
      { key: 'postedOn', type: 'date', required: true, label: 'content.fields.postedOn', initial: todayJst },
      { key: 'headline', type: 'text', max: 200, required: true, label: 'content.fields.headline' },
      { key: 'summary', type: 'textarea', max: 500, required: true, label: 'content.fields.summary' },
      { key: 'links', type: 'links' },
      { key: 'status', type: 'status' },
    ],
  },
  achievements: {
    icon: 'trophy',
    date: (i) => i.achievedOn,
    title: (i) => i.text,
    fields: [
      { key: 'achievedOn', type: 'date', required: true, label: 'content.fields.achievedOn', initial: todayJst },
      { key: 'text', type: 'textarea', max: 500, required: true, label: 'content.fields.text' },
      { key: 'linkUrl', type: 'url', label: 'content.fields.linkUrlOptional' },
      { key: 'status', type: 'status' },
    ],
  },
  discography: {
    icon: 'disc-3',
    date: (i) => i.releasedOn,
    title: (i) => i.title,
    text: (i) => [t(`content.types.${i.releaseType}`), i.note].filter(Boolean).join(' · '),
    thumb: (i) => (i.youtubeId ? ytThumb(i.youtubeId) : null),
    fields: [
      { key: 'title', type: 'text', max: 200, required: true, label: 'content.fields.title' },
      { key: 'releaseType', type: 'select', options: RELEASE_TYPES, optionLabel: 'content.types', label: 'content.fields.releaseType' },
      { key: 'releasedOn', type: 'date', required: true, label: 'content.fields.releasedOn', initial: todayJst },
      { key: 'note', type: 'textarea', max: 500, label: 'content.fields.note' },
      { key: 'youtube', type: 'youtube', label: 'content.fields.youtubeOptional', from: (i) => ytUrl(i.youtubeId) },
      { key: 'links', type: 'links' },
      { key: 'status', type: 'status' },
    ],
  },
};

// ---------------------------------------------------------------- form building
function linksEditor(links = []) {
  const box = el('div', { class: 'links-editor' });
  const addBtn = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, [icon('plus'), ' ', t('content.fields.addLink')]);
  const addRow = (link = { url: '', labelKey: 'details' }) => {
    const select = el('select', { 'aria-label': t('content.fields.links') }, LINK_KEYS.map((k) => el('option', { value: k, text: t(`content.linkLabels.${k}`) })));
    select.value = link.labelKey || 'details';
    const row = el('div', { class: 'links-editor__row' }, [
      el('input', { type: 'url', placeholder: t('content.fields.linkUrl'), value: link.url, 'aria-label': t('content.fields.linkUrl') }),
      select,
      el('button', { class: 'icon-btn', type: 'button', 'aria-label': t('content.fields.removeLink'), onclick: () => { row.remove(); sync(); } }, [icon('x')]),
    ]);
    addBtn.before(row);
    sync();
    refreshIcons();
  };
  const sync = () => { addBtn.hidden = box.querySelectorAll('.links-editor__row').length >= 3; };
  box.append(addBtn);
  addBtn.addEventListener('click', () => addRow());
  links.forEach(addRow);
  box.read = () => [...box.querySelectorAll('.links-editor__row')].map((r) => ({
    url: r.querySelector('input').value.trim(), labelKey: r.querySelector('select').value,
  })).filter((l) => l.url);
  return el('div', { class: 'field', dataset: { field: 'links' } }, [
    el('span', { class: 'field__label', text: t('content.fields.links') }), box, el('p', { class: 'field__error', hidden: true }),
  ]);
}

function buildForm(def, item) {
  const nodes = [];
  const getters = {};
  for (const f of def.fields) {
    const initial = item ? (f.from ? f.from(item) : item[f.key]) : (f.initial ? f.initial() : '');
    if (f.type === 'status') {
      nodes.push(segmentedField({ name: 'status', label: t('content.fields.status'), value: item?.status || 'draft',
        options: [['draft', t('content.fields.statusDraft')], ['published', t('content.fields.statusPublished')]] }));
    } else if (f.type === 'links') {
      const node = linksEditor(item?.links || []);
      nodes.push(node);
      getters.links = () => node.querySelector('.links-editor').read();
    } else if (f.type === 'select') {
      nodes.push(selectField({ name: f.key, label: t(f.label), value: initial || f.options[0], options: f.options.map((o) => [o, t(`${f.optionLabel}.${o}`)]) }));
    } else {
      const type = { date: 'date', url: 'url', youtube: 'url' }[f.type] || 'text';
      const node = textField({ name: f.key, label: t(f.label), value: initial, required: f.required, max: f.max, type, multiline: f.type === 'textarea', help: f.help ? t(f.help) : null });
      nodes.push(node);
      if (f.type === 'youtube' && f.key === 'youtube' && f.required) {
        // "Get title" helper: fills the title from YouTube (the title stays editable)
        const input = node.querySelector('input');
        const lookup = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, [icon('sparkles'), ' ', t('content.fields.lookup')]);
        const row = el('div', { class: 'field__row' });
        input.replaceWith(row);          // swap first, then move the input in (el() would detach it too early)
        row.append(input, lookup);
        const run = async () => {
          if (!input.value.trim()) return;
          lookup.disabled = true;
          try {
            const info = await api('admin/videos/lookup', { method: 'POST', body: { url: input.value.trim() } });
            const title = node.closest('form')?.querySelector('[name="title"]');
            if (title && (!title.value || title.dataset.auto === '1')) { title.value = info.title; title.dataset.auto = '1'; title.dispatchEvent(new Event('input')); }
          } catch (err) {
            showFieldErrors(node.closest('form'), { youtube: err.fields?.url || err.code }, 'errors');
          } finally { lookup.disabled = false; }
        };
        lookup.addEventListener('click', run);
        input.addEventListener('change', run);
        // A title typed by hand is never overwritten by a later lookup.
        queueMicrotask(() => node.closest('form')?.querySelector('[name="title"]')
          ?.addEventListener('input', (e) => { if (e.isTrusted) delete e.target.dataset.auto; }));
      }
    }
  }
  const form = el('form', { class: 'form', novalidate: true }, nodes);
  form.read = () => {
    const body = {};
    for (const f of def.fields) {
      if (getters[f.key]) body[f.key] = getters[f.key]();
      else body[f.key] = formValue(form, f.key) ?? '';
    }
    return body;
  };
  return form;
}

async function editDialog(name, item) {
  const def = RESOURCES[name];
  const form = buildForm(def, item);
  const errorBox = el('p', { class: 'form-error', role: 'alert', hidden: true });
  let saved = null;
  await openDialog({
    title: t(`content.${name}.${item ? 'edit' : 'add'}`),
    body: [form, errorBox],
    actions: [
      { label: t('common.cancel'), value: 'cancel', kind: 'ghost' },
      { label: t('common.save'), value: 'save', kind: 'primary' },
    ],
    onSubmit: async () => {
      clearErrors(form);
      errorBox.hidden = true;
      try {
        const body = form.read();
        const res = item
          ? await api(`admin/${name}/${item.id}`, { method: 'PATCH', body })
          : await api(`admin/${name}`, { method: 'POST', body });
        saved = res.item;
        toast(t('common.saved'));
        if (saved.status === 'published' && !item && window.confetti) window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, disableForReducedMotion: true });
        return true;
      } catch (err) {
        if (err.fields) showFieldErrors(form, err.fields);
        else { errorBox.textContent = errorText(err); errorBox.hidden = false; }
        return false;
      }
    },
  });
  return saved;
}

// ---------------------------------------------------------------- list page
export async function renderContent(name, view) {
  const def = RESOURCES[name];
  let filter = '';
  let cursor = null;
  const list = el('div', { class: 'items' }, skeletonRows());
  const more = el('div', { class: 'more' });

  const row = (item) => {
    const thumb = def.thumb?.(item);
    const toggle = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' },
      [icon(item.status === 'published' ? 'eye-off' : 'eye'), ' ', t(item.status === 'published' ? 'common.unpublish' : 'common.publish')]);
    const node = el('article', { class: item.status === 'draft' ? 'item item--draft' : 'item' }, [
      thumb ? el('img', { class: 'item__thumb', src: thumb, alt: '', loading: 'lazy' }) : el('span', { class: 'item__icon' }, [icon(def.icon)]),
      el('div', { class: 'item__main' }, [
        el('p', { class: 'item__title', text: def.title(item) }),
        el('p', { class: 'item__meta' }, [el('span', { class: 'item__date', text: formatDate(def.date(item)) }), statusPill(item.status)]),
        def.text ? el('p', { class: 'item__text', text: def.text(item) }) : null,
      ]),
      el('div', { class: 'item__actions' }, [
        el('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: async () => { const s = await editDialog(name, item); if (s) reload(); } }, [icon('pencil'), ' ', t('common.edit')]),
        toggle,
        el('button', { class: 'btn btn--danger-ghost btn--sm', type: 'button', onclick: () => archive(item) }, [icon('archive'), ' ', t('common.archive')]),
      ]),
    ]);
    toggle.addEventListener('click', async () => {
      toggle.disabled = true;
      try {
        await api(`admin/${name}/${item.id}`, { method: 'PATCH', body: { status: item.status === 'published' ? 'draft' : 'published' } });
        toast(t('common.saved'));
        reload();
      } catch (err) { toast(errorText(err), 'error'); toggle.disabled = false; }
    });
    return node;
  };

  async function archive(item) {
    const { ok, reason } = await confirmAction({
      title: t('common.archive'), message: t('content.archiveConfirm', { label: def.title(item).slice(0, 80) }),
      confirmLabel: t('common.archive'), danger: true, withReason: true,
    });
    if (!ok) return;
    try {
      await api(`admin/${name}/${item.id}`, { method: 'DELETE', body: { reason } });
      toast(t('content.archived'));
      reload();
    } catch (err) { toast(errorText(err), 'error'); }
  }

  async function load(append) {
    const qs = new URLSearchParams({ limit: '30' });
    if (filter) qs.set('status', filter);
    if (append && cursor) qs.set('cursor', cursor);
    const page = await api(`admin/${name}?${qs}`);
    cursor = page.nextCursor;
    const rows = page.items.map(row);
    if (append) list.append(...rows);
    else list.replaceChildren(...(rows.length ? rows : [stateBox(t('common.empty'))]));
    more.replaceChildren(cursor ? el('button', { class: 'btn btn--ghost', type: 'button', text: t('common.loadMore'), onclick: () => load(true) }) : '');
    refreshIcons();
  }
  const reload = () => load(false).catch((err) => toast(errorText(err), 'error'));

  const filters = el('div', { class: 'segmented', role: 'radiogroup', 'aria-label': t('common.status') },
    [['', 'common.all'], ['published', 'common.published'], ['draft', 'common.draft']].map(([v, k]) =>
      el('label', {}, [el('input', { type: 'radio', name: 'status-filter', value: v, checked: v === filter, onchange: () => { filter = v; reload(); } }), el('span', { text: t(k) })])));
  const addBtn = el('button', { class: 'btn btn--primary', type: 'button', onclick: async () => { const s = await editDialog(name, null); if (s) reload(); } }, [icon('plus'), ' ', t(`content.${name}.add`)]);

  view.replaceChildren(pageHead(`content.${name}.title`, `content.${name}.hint`, [addBtn]), el('div', { class: 'toolbar' }, [filters]), list, more);
  await load(false);
}
