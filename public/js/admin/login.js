// /login page.
import './styles.js';
import { t, setLang, currentLang, isLangChosen, mountLangSwitches } from '../shared/i18n-core.js';
import { api, errorText, setSlowHandler } from './api.js';
import { $ } from '../shared/dom.js';

const LOCALES = '/locales/admin';

async function boot() {
  // Already signed in? Go straight to the panel.
  try { await api('auth/me'); location.replace('/admin'); return; } catch { /* not signed in */ }

  let lang = currentLang();
  if (!isLangChosen()) {
    try { const geo = await (await fetch('/api/public/geo')).json(); lang = geo.lang || lang; } catch { /* default */ }
  }
  await setLang(lang, { base: LOCALES });
  mountLangSwitches((l) => setLang(l, { persist: true, base: LOCALES }));

  const form = $('#login-form');
  const error = $('#login-error');
  const submit = $('#login-submit');
  const waking = $('#login-waking');
  setSlowHandler((slow) => { waking.hidden = !slow; });
  $('#show-password').addEventListener('change', (e) => { $('#password').type = e.target.checked ? 'text' : 'password'; });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    error.hidden = true;
    const username = $('#username').value.trim();
    const password = $('#password').value;
    if (!username || !password) {
      error.textContent = t('errors.INVALID_CREDENTIALS');
      error.hidden = false;
      return;
    }
    submit.disabled = true;
    submit.textContent = t('login.signingIn');
    try {
      await api('auth/login', { method: 'POST', body: { username, password } });
      location.replace('/admin');
    } catch (err) {
      error.textContent = errorText(err);
      error.hidden = false;
      $('#password').value = '';
      $('#password').focus();
    } finally {
      submit.disabled = false;
      submit.textContent = t('login.submit');
    }
  });
  $('#username').focus();
}

boot();
