// Gallery manager: signed direct uploads to Cloudinary (auto-shrink to the free-tier limits), credits, delete.
import { t } from '../shared/i18n-core.js';
import { api, errorText, ApiError } from './api.js';
import {
  el, icon, refreshIcons, toast, openDialog, confirmAction, textField, segmentedField, formValue,
  clearErrors, showFieldErrors, statusPill, pageHead,
} from './ui.js';

const MAX_BYTES = 10 * 1024 * 1024;   // Cloudinary free plan: 10 MB per image
const MAX_PIXELS = 25_000_000;        // …and 25 megapixels
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.heic,.heif';

const thumbUrl = (url) => url.replace('/upload/', '/upload/f_auto,q_auto,c_fill,g_auto,w_360,h_360/');

/** Shrinks images above the size/pixel limits in the browser (WebP keeps transparency). */
async function prepareFile(file) {
  let bitmap = null;
  try { bitmap = await createImageBitmap(file); } catch { /* e.g. HEIC outside Safari */ }
  if (!bitmap) {
    if (file.size > MAX_BYTES) throw new Error('heicTooBig');
    return { file, shrunk: false };
  }
  const pixels = bitmap.width * bitmap.height;
  if (file.size <= MAX_BYTES && pixels <= MAX_PIXELS) { bitmap.close(); return { file, shrunk: false }; }
  let scale = Math.min(1, Math.sqrt(MAX_PIXELS / pixels) * 0.98);
  let quality = 0.92;
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality));
    if (blob && blob.size <= MAX_BYTES) {
      bitmap.close();
      return { file: new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' }), shrunk: true };
    }
    quality = Math.max(0.7, quality - 0.08);
    scale *= 0.85;
  }
  bitmap.close();
  throw new Error('tooBig');
}

function uploadToCloudinary(sig, file, onProgress) {
  return new Promise((resolve, reject) => {
    const data = new FormData();
    data.append('file', file);
    data.append('api_key', sig.apiKey);
    data.append('timestamp', sig.timestamp);
    data.append('signature', sig.signature);
    data.append('folder', sig.folder);
    data.append('upload_preset', sig.upload_preset);
    data.append('tags', sig.tags);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', sig.uploadUrl);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      let json = null;
      try { json = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && json) resolve(json);
      else reject(new ApiError(xhr.status, 'UPLOAD_REJECTED', json?.error?.message || 'Upload failed'));
    };
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK', t('common.networkError')));
    xhr.send(data);
  });
}

export async function renderGallery(view) {
  const queue = el('div', { class: 'upload-queue' });
  const grid = el('div', { class: 'gallery-grid' });
  const more = el('div', { class: 'more' });
  let cursor = null;

  // ------------------------------------------------ upload queue
  const input = el('input', { type: 'file', accept: ACCEPT, multiple: true, id: 'gallery-files' });
  const drop = el('label', { class: 'dropzone', for: 'gallery-files' }, [
    icon('image-plus'),
    el('p', {}, [t('gallery.drop'), ' ', el('strong', { text: t('gallery.choose') })]),
    el('p', { class: 'field__help', text: t('gallery.formats') }),
    input,
  ]);
  const uploadAll = el('button', { class: 'btn btn--primary', type: 'button', hidden: true }, [icon('upload'), ' ', t('gallery.uploadAll')]);

  function addToQueue(file) {
    const preview = el('img', { alt: '', src: URL.createObjectURL(file) });
    const author = textField({ name: 'authorName', label: t('gallery.author'), required: true, max: 100 });
    const source = textField({ name: 'sourceUrl', label: t('gallery.source'), type: 'url', max: 2000 });
    const bar = el('span');
    const status = el('span', { class: 'field__help' });
    const uploadBtn = el('button', { class: 'btn btn--primary btn--sm', type: 'button' }, [icon('upload'), ' ', t('gallery.upload')]);
    const removeBtn = el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: t('gallery.remove') });
    const card = el('div', { class: 'upload-item' }, [
      preview,
      el('div', { class: 'upload-item__fields' }, [author, source]),
      el('div', { class: 'upload-item__foot' }, [uploadBtn, removeBtn, el('div', { class: 'progress', 'aria-hidden': 'true' }, [bar]), status]),
    ]);
    card.upload = async () => {
      clearErrors(card);
      const authorName = card.querySelector('[name="authorName"]').value.trim();
      const sourceUrl = card.querySelector('[name="sourceUrl"]').value.trim();
      if (!authorName) { showFieldErrors(card, { authorName: 'required' }); return false; }
      uploadBtn.disabled = true; removeBtn.disabled = true;
      try {
        const prepared = await prepareFile(file);
        if (prepared.shrunk) status.textContent = t('gallery.shrunk');
        const sig = await api('admin/gallery/sign', { method: 'POST' });
        const up = await uploadToCloudinary(sig, prepared.file, (p) => { bar.style.width = `${p}%`; status.textContent = t('gallery.uploading', { p }); });
        await api('admin/gallery', { method: 'POST', body: { publicId: up.public_id, version: up.version, signature: up.signature, authorName, sourceUrl, status: 'published' } });
        status.textContent = t('gallery.uploaded');
        toast(t('gallery.uploaded'));
        setTimeout(() => { card.remove(); syncQueue(); }, 800);
        loadGrid(false);
        return true;
      } catch (err) {
        uploadBtn.disabled = false; removeBtn.disabled = false;
        if (err.message === 'heicTooBig' || err.message === 'tooBig') status.textContent = t('gallery.heicTooBig');
        else if (err.fields) showFieldErrors(card, err.fields);
        else status.textContent = errorText(err);
        return false;
      }
    };
    uploadBtn.addEventListener('click', () => card.upload());
    removeBtn.addEventListener('click', () => { card.remove(); syncQueue(); });
    queue.append(card);
    syncQueue();
    refreshIcons();
  }
  const syncQueue = () => { uploadAll.hidden = queue.children.length < 2; };
  uploadAll.addEventListener('click', async () => { for (const card of [...queue.children]) await card.upload?.(); });
  input.addEventListener('change', () => { [...input.files].forEach(addToQueue); input.value = ''; });
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('is-over'); [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/') || /\.hei[cf]$/i.test(f.name)).forEach(addToQueue); });

  // ------------------------------------------------ existing images
  const card = (img) => el('article', { class: 'gallery-card' }, [
    el('img', { src: thumbUrl(img.url), alt: '', loading: 'lazy', width: 360, height: 360 }),
    el('div', { class: 'gallery-card__body' }, [
      el('strong', { text: img.authorName }),
      img.sourceUrl ? el('a', { href: img.sourceUrl, target: '_blank', rel: 'noopener noreferrer', text: new URL(img.sourceUrl).hostname }) : null,
      statusPill(img.status),
      el('div', { class: 'gallery-card__actions' }, [
        el('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => editCredit(img) }, [icon('pencil'), ' ', t('gallery.editCredit')]),
        el('button', { class: 'btn btn--danger-ghost btn--sm', type: 'button', onclick: () => remove(img) }, [icon('trash-2'), ' ', t('common.delete')]),
      ]),
    ]),
  ]);

  async function editCredit(img) {
    const form = el('form', { class: 'form', novalidate: true }, [
      textField({ name: 'authorName', label: t('gallery.author'), value: img.authorName, required: true, max: 100 }),
      textField({ name: 'sourceUrl', label: t('gallery.source'), value: img.sourceUrl || '', type: 'url', max: 2000 }),
      segmentedField({ name: 'status', label: t('content.fields.status'), value: img.status, options: [['draft', t('content.fields.statusDraft')], ['published', t('content.fields.statusPublished')]] }),
    ]);
    await openDialog({
      title: t('gallery.editCredit'), body: [form],
      actions: [{ label: t('common.cancel'), value: 'cancel' }, { label: t('common.save'), value: 'save', kind: 'primary' }],
      onSubmit: async () => {
        clearErrors(form);
        try {
          await api(`admin/gallery/${img.id}`, { method: 'PATCH', body: { authorName: formValue(form, 'authorName'), sourceUrl: formValue(form, 'sourceUrl'), status: formValue(form, 'status') } });
          toast(t('common.saved'));
          loadGrid(false);
          return true;
        } catch (err) { if (err.fields) showFieldErrors(form, err.fields); else toast(errorText(err), 'error'); return false; }
      },
    });
  }

  async function remove(img) {
    const { ok } = await confirmAction({ title: t('common.delete'), message: t('gallery.deleteConfirm'), confirmLabel: t('common.delete'), danger: true });
    if (!ok) return;
    try {
      await api(`admin/gallery/${img.id}`, { method: 'DELETE' });
      toast(t('gallery.deleted'));
      loadGrid(false);
    } catch (err) { toast(errorText(err), 'error'); }
  }

  async function loadGrid(append) {
    const qs = new URLSearchParams({ limit: '30' });
    if (append && cursor) qs.set('cursor', cursor);
    const page = await api(`admin/gallery?${qs}`);
    cursor = page.nextCursor;
    const cards = page.items.map(card);
    if (append) grid.append(...cards);
    else grid.replaceChildren(...(cards.length ? cards : [el('p', { class: 'empty', text: t('common.empty') })]));
    more.replaceChildren(cursor ? el('button', { class: 'btn btn--ghost', type: 'button', text: t('common.loadMore'), onclick: () => loadGrid(true) }) : '');
    refreshIcons();
  }

  view.replaceChildren(pageHead('gallery.title', 'gallery.hint', [uploadAll]), drop, queue, grid, more);
  refreshIcons();
  await loadGrid(false);
}
