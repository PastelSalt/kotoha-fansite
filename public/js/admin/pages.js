// Admin pages: dashboard, archive, activity log, accounts (Owner), my account.
import { t } from '../shared/i18n-core.js';
import { api, errorText } from './api.js';
import { el, icon, refreshIcons, toast, openDialog, confirmAction, formatDateTime, copyText, pageHead } from './ui.js';
import { passwordForm } from './password.js';
import { renderAnalytics } from './analytics.js';

// ---------------------------------------------------------------- dashboard
export async function renderDashboard(view, { user }) {
  const s = await api('admin/summary');
  const analytics = el('div', { id: 'analytics' });
  const stat = (labelKey, pub, draft, href) => el('a', { class: 'stat', href, style: 'text-decoration:none;color:inherit' }, [
    el('p', { class: 'stat__label', text: t(labelKey) }),
    el('p', { class: 'stat__value', text: String(pub) }),
    el('p', { class: 'stat__sub', text: `${t('dashboard.published')} · ${draft} ${t('dashboard.drafts')}` }),
  ]);
  view.replaceChildren(
    el('div', { class: 'page-head' }, [el('div', {}, [
      el('h1', { text: t('dashboard.hello', { name: user.username }) }),
      el('p', { text: t('dashboard.intro') }),
    ])]),
    el('div', { class: 'stats' }, [
      stat('nav.videos', s.videos_published, s.videos_draft, '#/videos'),
      stat('nav.news', s.news_published, s.news_draft, '#/news'),
      stat('nav.achievements', s.achievements_published, s.achievements_draft, '#/achievements'),
      stat('nav.discography', s.discography_published, s.discography_draft, '#/discography'),
      stat('nav.gallery', s.gallery_published, s.gallery_draft, '#/gallery'),
    ]),
    analytics,
  );
  renderAnalytics(analytics);
}

// ---------------------------------------------------------------- archive
export async function renderArchive(view) {
  let source = '';
  let cursor = null;
  const list = el('div', { class: 'items' });
  const more = el('div', { class: 'more' });
  const sections = ['videos', 'news', 'achievements', 'discography_items', 'gallery_images', 'admin_users'];
  const select = el('select', { 'aria-label': t('archive.from') }, [
    el('option', { value: '', text: t('common.all') }),
    ...sections.map((s) => el('option', { value: s, text: t(`archive.sections.${s}`) })),
  ]);
  select.addEventListener('change', () => { source = select.value; load(false); });

  const row = (a) => {
    const restore = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, [icon('archive-restore'), ' ', t('common.restore')]);
    restore.addEventListener('click', async () => {
      restore.disabled = true;
      try {
        await api(`admin/archive/${a.id}/restore`, { method: 'POST' });
        toast(t('archive.restoreDone'));
        load(false);
      } catch (err) { toast(errorText(err), 'error'); restore.disabled = false; }
    });
    return el('article', { class: 'item' }, [
      el('span', { class: 'pill pill--draft', text: t(`archive.sections.${a.sourceTable}`) }),
      el('div', { class: 'item__main' }, [
        el('p', { class: 'item__title', text: a.label || `#${a.originalId}` }),
        el('p', { class: 'item__meta' }, [
          el('span', { text: `${t('archive.when')}: ${formatDateTime(a.archivedAt)}` }),
          el('span', { text: `${t('archive.by')}: ${a.archivedBy}` }),
          a.restoredAt ? el('span', { class: 'pill pill--published', text: t('archive.restored') }) : null,
        ]),
        a.reason ? el('p', { class: 'item__text', text: `${t('archive.reason')}: ${a.reason}` }) : null,
        a.note ? el('p', { class: 'item__text', text: a.note }) : null,
      ]),
      el('div', { class: 'item__actions' }, [a.restorable ? restore : null]),
    ]);
  };

  async function load(append) {
    const qs = new URLSearchParams({ limit: '30' });
    if (source) qs.set('source', source);
    if (append && cursor) qs.set('cursor', cursor);
    const page = await api(`admin/archive?${qs}`);
    cursor = page.nextCursor;
    const rows = page.items.map(row);
    if (append) list.append(...rows);
    else list.replaceChildren(...(rows.length ? rows : [el('p', { class: 'empty', text: t('common.empty') })]));
    more.replaceChildren(cursor ? el('button', { class: 'btn btn--ghost', type: 'button', text: t('common.loadMore'), onclick: () => load(true) }) : '');
    refreshIcons();
  }

  view.replaceChildren(pageHead('archive.title', 'archive.hint'), el('div', { class: 'toolbar' }, [el('div', { class: 'field' }, [select])]), list, more);
  await load(false);
}

// ---------------------------------------------------------------- activity log
const actionLabel = (code) => {
  const label = t(`activity.actions.${code}`);
  return typeof label === 'string' && label !== `activity.actions.${code}` ? label : code;
};
export async function renderActivity(view) {
  let cursor = null;
  const list = el('div', { class: 'items' });
  const more = el('div', { class: 'more' });
  const row = (a) => el('article', { class: 'item' }, [
    el('span', { class: 'pill pill--admin', text: a.username }),
    el('div', { class: 'item__main' }, [
      el('p', { class: 'item__title', text: actionLabel(a.action) }),
      el('p', { class: 'item__meta', text: formatDateTime(a.createdAt) }),
      a.details?.label || a.details?.username || a.details?.author
        ? el('p', { class: 'item__text', text: a.details.label || a.details.username || a.details.author }) : null,
    ]),
    el('span'),
  ]);
  async function load(append) {
    const qs = new URLSearchParams({ limit: '50' });
    if (append && cursor) qs.set('cursor', cursor);
    const page = await api(`admin/activity?${qs}`);
    cursor = page.nextCursor;
    const rows = page.items.map(row);
    if (append) list.append(...rows);
    else list.replaceChildren(...(rows.length ? rows : [el('p', { class: 'empty', text: t('common.empty') })]));
    more.replaceChildren(cursor ? el('button', { class: 'btn btn--ghost', type: 'button', text: t('common.loadMore'), onclick: () => load(true) }) : '');
  }
  view.replaceChildren(pageHead('activity.title', 'activity.hint'), list, more);
  await load(false);
}

// ---------------------------------------------------------------- accounts (Owner)
function showSecret(titleKey, account, tempPassword) {
  const copyBtn = el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: t('common.copy') });
  copyBtn.addEventListener('click', () => copyText(`${account.username}\n${tempPassword}`, copyBtn));
  return openDialog({
    title: t(titleKey),
    body: [
      el('p', { text: t('accounts.createdInfo') }),
      el('div', { class: 'secret' }, [
        el('div', { class: 'secret__row' }, [el('strong', { text: `${t('accounts.username')}:` }), el('code', { text: account.username })]),
        el('div', { class: 'secret__row' }, [el('strong', { text: `${t('accounts.tempPassword')}:` }), el('code', { text: tempPassword })]),
        copyBtn,
      ]),
    ],
    actions: [{ label: t('common.close'), value: 'close', kind: 'primary' }],
  });
}

export async function renderAccounts(view) {
  const list = el('div', { class: 'items' });
  const createBtn = el('button', { class: 'btn btn--primary', type: 'button' }, [icon('user-plus'), ' ', t('accounts.create')]);
  createBtn.addEventListener('click', async () => {
    createBtn.disabled = true;
    try {
      const { account, tempPassword } = await api('admin/accounts', { method: 'POST' });
      await showSecret('accounts.createdTitle', account, tempPassword);
      load();
    } catch (err) { toast(errorText(err), 'error'); } finally { createBtn.disabled = false; }
  });

  const row = (a) => {
    const pills = [
      el('span', { class: `pill pill--${a.role}`, text: t(`roles.${a.role}`) }),
      !a.isActive ? el('span', { class: 'pill pill--removed', text: t('accounts.removed') }) : null,
      a.isActive && a.mustChangePassword ? el('span', { class: 'pill pill--warn', text: t('accounts.mustChange') }) : null,
    ];
    const actions = [];
    if (a.role === 'admin' && a.isActive) {
      actions.push(el('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: async () => {
        const { ok } = await confirmAction({ title: t('accounts.reset'), message: t('accounts.resetConfirm', { name: a.username }), confirmLabel: t('accounts.reset') });
        if (!ok) return;
        try {
          const res = await api(`admin/accounts/${a.id}/reset-password`, { method: 'POST' });
          await showSecret('accounts.resetTitle', res.account, res.tempPassword);
          load();
        } catch (err) { toast(errorText(err), 'error'); }
      } }, [icon('key-round'), ' ', t('accounts.reset')]));
      actions.push(el('button', { class: 'btn btn--danger-ghost btn--sm', type: 'button', onclick: async () => {
        const { ok, reason } = await confirmAction({ title: t('accounts.remove'), message: t('accounts.removeConfirm', { name: a.username }), confirmLabel: t('accounts.remove'), danger: true, withReason: true });
        if (!ok) return;
        try { await api(`admin/accounts/${a.id}`, { method: 'DELETE', body: { reason } }); toast(t('common.saved')); load(); } catch (err) { toast(errorText(err), 'error'); }
      } }, [icon('user-x'), ' ', t('accounts.remove')]));
    }
    return el('article', { class: 'item' }, [
      el('span', { class: 'item__thumb item__thumb--square', style: 'display:grid;place-items:center' }, [icon('user-round')]),
      el('div', { class: 'item__main' }, [
        el('p', { class: 'item__title', text: a.username }),
        el('p', { class: 'item__meta' }, [...pills, el('span', { text: `${t('accounts.lastLogin')}: ${a.lastLoginAt ? formatDateTime(a.lastLoginAt) : t('accounts.never')}` })]),
      ]),
      el('div', { class: 'item__actions' }, actions),
    ]);
  };

  async function load() {
    const { items } = await api('admin/accounts');
    list.replaceChildren(...items.map(row));
    refreshIcons();
  }
  view.replaceChildren(pageHead('accounts.title', 'accounts.hint', [createBtn]), list);
  await load();
}

// ---------------------------------------------------------------- my account
export async function renderAccount(view, { user, onPasswordChanged }) {
  const others = el('button', { class: 'btn btn--ghost', type: 'button' }, [icon('log-out'), ' ', t('account.signOutOthers')]);
  others.addEventListener('click', async () => {
    try { await api('auth/logout-others', { method: 'POST' }); toast(t('account.signedOutOthers')); } catch (err) { toast(errorText(err), 'error'); }
  });
  view.replaceChildren(
    pageHead('account.title', null),
    el('section', { class: 'panel' }, [
      el('p', {}, [el('strong', { text: user.username }), ' ', el('span', { class: `pill pill--${user.role}`, text: t(`roles.${user.role}`) })]),
      el('div', { style: 'margin-top:12px' }, [others]),
    ]),
    el('section', { class: 'panel' }, [el('h2', { text: t('password.submit') }), passwordForm({ username: user.username, onDone: onPasswordChanged })]),
  );
  refreshIcons();
}
