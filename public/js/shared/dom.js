// Tiny DOM builder shared by the public site and the admin panel. Text always goes through textContent.
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'value' && 'value' in node) node.value = v;
    else if (k === 'checked' && 'checked' in node) node.checked = Boolean(v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of [].concat(children)) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Adds a stylesheet from script, so a slow CDN never holds up the page's own scripts.
// `integrity` (Subresource Integrity) is optional: Google Fonts CSS differs per browser and can't have one.
export function loadStylesheet(href, integrity) {
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
  document.head.append(el('link', { rel: 'stylesheet', href, ...(integrity ? { integrity, crossorigin: 'anonymous' } : {}) }));
}
