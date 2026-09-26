// Password change form (forced first-login change and "My Account"), with a live rule checklist.
import { t } from '../shared/i18n-core.js';
import { api, errorText } from './api.js';
import { el, textField, clearErrors, showFieldErrors, toast } from './ui.js';

const CLIENT_RULES = ['min_length', 'contains_username', 'same_as_current', 'mismatch'];
const SERVER_RULES = ['guessable', 'leaked'];

export function passwordForm({ forced = false, username, onDone }) {
  const current = textField({ name: 'currentPassword', label: t(forced ? 'password.currentTemp' : 'password.current'), type: 'password', required: true, autocomplete: 'current-password' });
  const next = textField({ name: 'newPassword', label: t('password.new'), type: 'password', required: true, max: 128, autocomplete: 'new-password' });
  const confirm = textField({ name: 'confirmPassword', label: t('password.confirm'), type: 'password', required: true, max: 128, autocomplete: 'new-password' });
  const rules = el('ul', { class: 'rules', 'aria-live': 'polite' },
    [...CLIENT_RULES, ...SERVER_RULES].map((r) => el('li', { dataset: { rule: r }, text: t(`password.${r}`) })));
  const errorBox = el('p', { class: 'form-error', role: 'alert', hidden: true });
  const submit = el('button', { class: 'btn btn--primary', type: 'submit', text: t('password.submit') });
  const form = el('form', { class: 'form', novalidate: true }, [
    current, next, confirm,
    el('div', {}, [el('p', { class: 'field__label', text: t('password.rulesTitle') }), rules]),
    errorBox, submit,
  ]);

  const val = (name) => form.querySelector(`[name="${name}"]`).value;
  const mark = (rule, state) => { const li = rules.querySelector(`[data-rule="${rule}"]`); li.classList.toggle('ok', state === true); li.classList.toggle('bad', state === false); };
  const check = () => {
    const pw = val('newPassword');
    if (!pw) { CLIENT_RULES.forEach((r) => mark(r, null)); return; }
    mark('min_length', pw.length >= 12);
    mark('contains_username', !username || !pw.toLowerCase().includes(username.toLowerCase()));
    mark('same_as_current', !val('currentPassword') || pw !== val('currentPassword'));
    mark('mismatch', val('confirmPassword') ? pw === val('confirmPassword') : null);
    SERVER_RULES.forEach((r) => mark(r, null));
  };
  form.addEventListener('input', check);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearErrors(form);
    errorBox.hidden = true;
    check();
    if (val('newPassword') !== val('confirmPassword')) {
      showFieldErrors(form, { confirmPassword: 'mismatch' }, 'password');
      return;
    }
    submit.disabled = true;
    submit.textContent = t('common.saving');
    try {
      const { user } = await api('auth/change-password', { method: 'POST', body: { currentPassword: val('currentPassword'), newPassword: val('newPassword') } });
      toast(t('password.changed'));
      form.reset();
      check();
      onDone?.(user);
    } catch (err) {
      if (err.fields) {
        showFieldErrors(form, err.fields, 'password');
        [].concat(err.fields.newPassword || []).forEach((r) => mark(r, false));
      } else {
        errorBox.textContent = errorText(err);
        errorBox.hidden = false;
      }
    } finally {
      submit.disabled = false;
      submit.textContent = t('password.submit');
    }
  });
  return form;
}
