// Admin UI helpers: toasts, dialogs, form fields, icons, formatting.
import { t, currentLang } from '../shared/i18n-core.js';
import { el, $ } from '../shared/dom.js';

export { el, $ };

// Lucide loads async; if it isn't there yet, draw every pending icon once the script arrives.
let waitingForIcons = false;
export function refreshIcons() {
  if (window.lucide) { window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } }); return; }
  if (waitingForIcons) return;
  waitingForIcons = true;
  document.getElementById('lucide-js')?.addEventListener('load', () => { waitingForIcons = false; refreshIcons(); }, { once: true });
}

export const icon = (name) => el('i', { 'data-lucide': name });

// ---------------------------------------------------------------- toasts
export function toast(message, kind = 'ok', ms = 3500) {
  const box = el('div', { class: `toast toast--${kind} animate__animated animate__fadeInUp`, role: kind === 'error' ? 'alert' : null, text: message });
  $('#toasts').append(box);
  setTimeout(() => {
    box.classList.replace('animate__fadeInUp', 'animate__fadeOutDown');
    box.addEventListener('animationend', () => box.remove(), { once: true });
    setTimeout(() => box.remove(), 1000);
  }, ms);
}

// ---------------------------------------------------------------- dialog
/**
 * Opens the shared <dialog>. `actions`: [{ label, value, kind: 'primary'|'danger'|'ghost' }].
 * Resolves with the clicked action's value ('' when dismissed). `onSubmit(value)` may return false to keep it open.
 */
export function openDialog({ title, body = [], actions = [], onSubmit }) {
  const dlg = $('#dialog');
  $('#dialog-title').textContent = title;
  $('#dialog-body').replaceChildren(...[].concat(body));
  $('#dialog-actions').replaceChildren(...actions.map((a) =>
    el('button', { class: `btn btn--${a.kind || 'ghost'}`, value: a.value, type: 'submit' }, [a.label])));
  refreshIcons();
  return new Promise((resolve) => {
    const form = $('#dialog-form');
    const handler = async (ev) => {
      const value = ev.submitter?.value ?? '';
      if (onSubmit && value && value !== 'cancel') {
        ev.preventDefault();
        const buttons = [...form.querySelectorAll('button')];
        buttons.forEach((b) => { b.disabled = true; });
        let keepOpen = false;
        try { keepOpen = (await onSubmit(value)) === false; } finally { buttons.forEach((b) => { b.disabled = false; }); }
        if (keepOpen) return;
        dlg.close(value);
      }
    };
    form.addEventListener('submit', handler);
    dlg.addEventListener('close', () => {
      form.removeEventListener('submit', handler);
      resolve(dlg.returnValue === 'cancel' ? '' : dlg.returnValue);
    }, { once: true });
    dlg.returnValue = '';
    dlg.showModal();
    dlg.querySelector('input, textarea, select, button.btn--primary, button.btn--danger')?.focus();
  });
}

/** Confirmation with optional reason field. Resolves { ok, reason }. */
export async function confirmAction({ title, message, confirmLabel, danger = false, withReason = false }) {
  const reasonField = withReason ? textField({ name: 'reason', label: t('content.reason'), max: 300 }) : null;
  const value = await openDialog({
    title,
    body: [el('p', { text: message }), reasonField],
    actions: [
      { label: t('common.cancel'), value: 'cancel', kind: 'ghost' },
      { label: confirmLabel || t('common.confirm'), value: 'ok', kind: danger ? 'danger' : 'primary' },
    ],
  });
  return { ok: value === 'ok', reason: reasonField ? reasonField.querySelector('input').value.trim() : '' };
}

// ---------------------------------------------------------------- form fields
let uid = 0;
const fid = (name) => `f-${name}-${++uid}`;

export function textField({ name, label, value = '', required = false, max, type = 'text', help, placeholder, multiline = false, autocomplete }) {
  const id = fid(name);
  const input = multiline
    ? el('textarea', { id, name, maxlength: max, required, placeholder, rows: 4 })
    : el('input', { id, name, type, maxlength: max, required, placeholder, autocomplete });
  input.value = value ?? '';
  const count = max && multiline ? el('span', { class: 'field__count' }) : null;
  const updateCount = () => { if (count) count.textContent = t('content.chars', { n: input.value.length, max }); };
  input.addEventListener('input', updateCount);
  updateCount();
  return el('div', { class: 'field', dataset: { field: name } }, [
    el('label', { for: id }, [label, required ? null : el('small', { text: ` (${t('common.optional')})` })]),
    input,
    help ? el('p', { class: 'field__help', text: help }) : null,
    count,
    el('p', { class: 'field__error', hidden: true }),
  ]);
}

export function selectField({ name, label, value, options }) {
  const id = fid(name);
  const select = el('select', { id, name }, options.map(([v, text]) => el('option', { value: v, text })));
  select.value = value ?? options[0][0];
  return el('div', { class: 'field', dataset: { field: name } }, [el('label', { for: id, text: label }), select, el('p', { class: 'field__error', hidden: true })]);
}

export function segmentedField({ name, label, value, options }) {
  return el('div', { class: 'field', dataset: { field: name } }, [
    el('span', { class: 'field__label', text: label }),
    el('div', { class: 'segmented', role: 'radiogroup', 'aria-label': label }, options.map(([v, text]) =>
      el('label', {}, [el('input', { type: 'radio', name, value: v, checked: v === value }), el('span', { text })]))),
    el('p', { class: 'field__error', hidden: true }),
  ]);
}

export function formValue(form, name) {
  const field = form.querySelector(`[name="${name}"]`);
  if (!field) return undefined;
  if (field.type === 'radio') return form.querySelector(`[name="${name}"]:checked`)?.value;
  return field.value;
}

export function clearErrors(root) {
  root.querySelectorAll('.field').forEach((f) => { f.classList.remove('has-error'); const e = f.querySelector('.field__error'); if (e) { e.hidden = true; e.textContent = ''; } });
}

/** Shows server validation errors ({ field: code | [codes] }) next to their inputs. */
export function showFieldErrors(root, fields = {}, keyPrefix = 'errors') {
  for (const [name, codes] of Object.entries(fields)) {
    const f = root.querySelector(`.field[data-field="${name}"]`);
    if (!f) continue;
    const text = [].concat(codes).map((c) => {
      const k = `${keyPrefix}.${c}`; const v = t(k);
      if (v !== k) return v;
      const e = t(`errors.${c}`); return e !== `errors.${c}` ? e : c;
    }).join(' ');
    f.classList.add('has-error');
    const box = f.querySelector('.field__error');
    box.textContent = text;
    box.hidden = false;
  }
  root.querySelector('.has-error input, .has-error textarea, .has-error select')?.focus();
}

// ---------------------------------------------------------------- formatting
export function formatDateTime(iso) {
  if (!iso) return '';
  return `${new Intl.DateTimeFormat(currentLang() === 'ja' ? 'ja-JP' : 'en-GB', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo',
  }).format(new Date(iso))} JST`;
}
export const formatDate = (d) => (d ? d.slice(0, 10).replaceAll('-', '.') : '');
export const todayJst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
export const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

export function statusPill(status) {
  return el('span', { class: `pill pill--${status}`, text: t(`common.${status}`) });
}

export async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    if (button) { const old = button.textContent; button.textContent = t('common.copied'); setTimeout(() => { button.textContent = old; }, 1500); }
  } catch { /* clipboard blocked: the text is selectable */ }
}

export function pageHead(titleKey, hintKey, actions = []) {
  return el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { text: t(titleKey) }), hintKey ? el('p', { text: t(hintKey) }) : null]),
    el('div', { class: 'toolbar' }, actions),
  ]);
}
