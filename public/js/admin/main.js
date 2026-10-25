// Admin panel shell: auth check, forced password change, language, hash router.
import './styles.js';
import { t, setLang, currentLang, isLangChosen, onLangChange, mountLangSwitches } from '../shared/i18n-core.js';
import { api, errorText, setSlowHandler, setUnauthenticatedHandler } from './api.js';
import { el, $, toast, refreshIcons, clover, sticker, stateBox } from './ui.js';
import { passwordForm } from './password.js';
import { renderContent } from './content.js';
import { renderGallery } from './gallery.js';
import { renderDashboard, renderArchive, renderActivity, renderAccounts, renderAccount } from './pages.js';

const LOCALES = '/locales/admin';
let user = null;
let wakingToast = null;

const ROUTES = {
  dashboard: (v) => renderDashboard(v, { user }),
  videos: (v) => renderContent('videos', v),
  news: (v) => renderContent('news', v),
  achievements: (v) => renderContent('achievements', v),
  discography: (v) => renderContent('discography', v),
  gallery: (v) => renderGallery(v),
  archive: (v) => renderArchive(v),
  activity: (v) => renderActivity(v),
  accounts: (v) => (user.role === 'owner' ? renderAccounts(v) : renderDashboard(v, { user })),
  account: (v) => renderAccount(v, { user, onPasswordChanged: (u) => { user = u; } }),
};

async function initialLanguage() {
  let lang = currentLang();
  if (!isLangChosen()) {
    if (user?.preferredLang) lang = user.preferredLang;
    else {
      try { const geo = await (await fetch('/api/public/geo')).json(); lang = geo.lang || lang; } catch { /* keep default */ }
    }
  }
  await setLang(lang, { base: LOCALES });
}

function currentRoute() {
  const name = location.hash.replace(/^#\/?/, '').split('/')[0];
  return Object.hasOwn(ROUTES, name) ? name : 'dashboard';
}

let renderSeq = 0;

async function render() {
  const view = $('#view');
  const route = currentRoute();
  const seq = ++renderSeq;
  document.querySelectorAll('[data-route]').forEach((a) => { if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  // Each navigation renders into its own container: a slow page that finishes after the admin has moved on
  // (e.g. while the database wakes up) writes into a detached element instead of replacing the current page.
  const page = el('div', { class: 'view__page' }, [el('p', { class: 'view__loading', text: t('common.loading') })]);
  view.replaceChildren(page);
  try {
    await ROUTES[route](page);
  } catch (err) {
    page.replaceChildren(stateBox(errorText(err), { kind: 'error', action: el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: t('common.retry'), onclick: render }) }));
  }
  if (seq !== renderSeq) return;
  refreshIcons();
  view.focus({ preventScroll: true });
  closeNav();
}

function showForcedChange() {
  document.body.dataset.state = 'forced';
  $('#view').replaceChildren(
    el('div', { class: 'paper forced' }, [
      el('h1', {}, [sticker(t('password.forcedTitle'), { small: true })]),
      el('p', { class: 'form-hint forced__intro', text: t('password.forcedIntro') }),
      passwordForm({
        forced: true,
        username: user.username,
        onDone: (u) => { user = u; startApp(); },
      }),
    ]),
  );
}

function startApp() {
  document.body.dataset.state = 'ready';
  document.querySelectorAll('[data-owner-only]').forEach((n) => { n.hidden = user.role !== 'owner'; });
  $('#user-badge').replaceChildren(
    el('span', { class: 'user-badge__avatar', 'aria-hidden': 'true' }, [clover(user.role === 'owner' ? '' : 'pink')]),
    el('span', { text: user.username }),
    el('span', { class: `pill pill--${user.role}`, text: t(`roles.${user.role}`) }),
  );
  render();
}

// Mobile menu: scrim behind it; tap outside, Esc or a route change closes it; focus moves in and back.
const navIsOpen = () => $('#sidebar').classList.contains('is-open');
function openNav() {
  $('#sidebar').classList.add('is-open');
  $('#nav-scrim').classList.add('is-open');
  $('#nav-toggle').setAttribute('aria-expanded', 'true');
  ($('#sidebar a[aria-current="page"]') || $('#sidebar a'))?.focus();
}
function closeNav({ restoreFocus = false } = {}) {
  if (!navIsOpen()) return;
  $('#sidebar').classList.remove('is-open');
  $('#nav-scrim').classList.remove('is-open');
  $('#nav-toggle').setAttribute('aria-expanded', 'false');
  if (restoreFocus) $('#nav-toggle').focus();
}

async function boot() {
  setUnauthenticatedHandler(() => location.replace('/login'));
  setSlowHandler((slow) => {
    if (slow && !wakingToast) { wakingToast = true; toast(t('common.wakingUp'), 'info', 9000); }
    if (!slow) wakingToast = null;
  });

  try {
    ({ user } = await api('auth/me'));
  } catch {
    location.replace('/login');
    return;
  }
  await initialLanguage();

  mountLangSwitches(async (lang) => {
    await setLang(lang, { persist: true, base: LOCALES });
    api('auth/preferences', { method: 'POST', body: { preferredLang: lang } }).catch(() => {});
  });
  onLangChange(() => {
    if (document.body.dataset.state === 'forced') showForcedChange();
    else if (document.body.dataset.state === 'ready') { startApp(); }
  });

  $('#sign-out').addEventListener('click', async () => {
    try { await api('auth/logout', { method: 'POST' }); } catch { /* signed out anyway */ }
    location.replace('/login');
  });
  $('#nav-toggle').addEventListener('click', () => (navIsOpen() ? closeNav({ restoreFocus: true }) : openNav()));
  $('#nav-scrim').addEventListener('click', () => closeNav({ restoreFocus: true }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navIsOpen()) closeNav({ restoreFocus: true }); });
  window.addEventListener('hashchange', () => { if (document.body.dataset.state === 'ready') render(); });

  refreshIcons();
  if (user.mustChangePassword) showForcedChange();
  else startApp();
}

boot().catch((err) => {
  console.error(err);
  toast(errorText(err), 'error');
});
