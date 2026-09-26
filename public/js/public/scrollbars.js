// Dashed scrollbar pills (from the references): the pill is the thumb and moves with the list.
export function initScrollbars() {
  document.querySelectorAll('.scroll-area').forEach((area) => {
    const list = area.querySelector('.scroll-list');
    const bar = area.querySelector('.scroll-bar');
    const thumb = area.querySelector('.scroll-bar__thumb');
    if (!list || !bar || !thumb) return;

    const update = () => {
      const { scrollHeight, clientHeight, scrollTop } = list;
      const overflow = scrollHeight - clientHeight > 2;
      area.classList.toggle('no-overflow', !overflow);
      if (!overflow) return;
      const track = bar.clientHeight || clientHeight;
      const size = Math.max(40, Math.min(track, (clientHeight / scrollHeight) * track));
      const top = (scrollTop / (scrollHeight - clientHeight)) * (track - size);
      thumb.style.height = `${size}px`;
      thumb.style.transform = `translateY(${top}px)`;
    };

    list.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(list);
    new MutationObserver(update).observe(list, { childList: true, subtree: false });
    update();
  });
}
