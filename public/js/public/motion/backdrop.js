// Fixed artwork backdrop that CROSSFADES between section artworks as the visitor moves through the page,
// so there is never a hard cut where one section's art ends and the next begins (the page scrolls freely on
// every device).
// Markup: .backdrop > .backdrop__art[data-art="home"] … ; sections carry data-art="home" etc.

export function startBackdrop(backdrop, sections, { onChange } = {}) {
  const arts = new Map([...backdrop.querySelectorAll('[data-art]')].map((el) => [el.dataset.art, el]));
  let current = null;
  const show = (name) => {
    if (!name || name === current || !arts.has(name)) return;
    current = name;
    arts.forEach((el, key) => el.classList.toggle('is-active', key === name));
    onChange?.(name);
  };
  // A section becomes "current" when it crosses the middle of the screen (works scrolling up or down).
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) show(e.target.dataset.art); });
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
  show(sections[0]?.dataset.art);
  return { show, current: () => current };
}
