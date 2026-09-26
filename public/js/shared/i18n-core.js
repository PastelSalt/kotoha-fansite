// Minimal i18n: JSON dictionaries in /locales, [data-i18n] for text, [data-i18n-attr="attr:key;attr2:key2"] for attributes.
const cache = new Map();
let lang = document.documentElement.lang === 'ja' ? 'ja' : 'en';
let dict = null;
const listeners = new Set();

export const currentLang = () => lang;
export const isLangChosen = () => document.documentElement.dataset.langChosen === '1';

function loadLocale(l, base) {
  if (!cache.has(l)) {
    cache.set(l, fetch(`${base}/${l}.json`).then((r) => {
      if (!r.ok) throw new Error(`locale ${l}: HTTP ${r.status}`);
      return r.json();
    }));
  }
  return cache.get(l);
}

/** Looks up a dotted key; strings get {placeholders} replaced. Missing keys return the key itself. */
export function t(key, vars) {
  const value = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
  if (value === undefined) return key;
  if (typeof value !== 'string' || !vars) return value;
  return value.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k])));
}

export function applyTranslations(root = document) {
  if (!dict) return;
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = t(el.dataset.i18n);
    if (typeof v === 'string' && v !== el.dataset.i18n) el.textContent = v;
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const v = t(key);
      if (attr && typeof v === 'string' && v !== key) el.setAttribute(attr, v);
    }
  });
}

/**
 * Switches language. `persist` stores an explicit visitor choice (auto-detected defaults are not stored).
 * `base` is the locale folder (public site: /locales, admin: /locales/admin).
 */
export async function setLang(next, { persist = false, base = '/locales' } = {}) {
  const l = next === 'ja' ? 'ja' : 'en';
  dict = await loadLocale(l, base);
  lang = l;
  document.documentElement.lang = l;
  if (persist) {
    document.documentElement.dataset.langChosen = '1';
    try { localStorage.setItem('kf_lang', l); } catch { /* storage unavailable */ }
  }
  applyTranslations();
  listeners.forEach((fn) => fn(l));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Renders JP/EN toggles into every [data-lang-switch] element. */
export function mountLangSwitches(onPick) {
  const render = () => {
    document.querySelectorAll('[data-lang-switch]').forEach((box) => {
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', t('a11y.language') === 'a11y.language' ? 'Language' : t('a11y.language'));
      box.replaceChildren(...['ja', 'en'].map((l) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.lang = l;
        b.textContent = l === 'ja' ? 'JP' : 'EN';
        b.setAttribute('aria-label', l === 'ja' ? '日本語' : 'English');
        b.setAttribute('aria-pressed', String(l === lang));
        b.addEventListener('click', () => onPick(l));
        return b;
      }));
    });
  };
  render();
  onLangChange(render);
}
