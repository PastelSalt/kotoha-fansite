# PERFORMANCE_PLAN.md: Making the public site smooth (no content removed, no snapping)

> **Status:** **executed 2026-10-09** (Phases 0–5 and 7; Phase 6 measured and not needed; Phase 8 not approved). What was actually done, what changed from the plan, and the measurements are in **§7**.
> **Scope:** public site only (`public/index.html`, `public/css/v2/*`, `public/js/public/**`). The admin is not touched.
> **Owner's rules for this work:**
> 1. **Remove no content.** Every section, card, sticker, clover, sparkle, marquee, artwork, title animation, confetti and loader effect stays. We only change *how* they are rendered so they cost less.
> 2. **No more snapping.** The desktop "strict snap" (glide to the next section) is removed completely. All devices get normal free scrolling.

---

## 1. Why the site is laggy (diagnosis)

Ranked by how much each one is likely to cost, from reading the code. Phase 0 confirms the ranking with real measurements before anything changes.

| # | Cause | Where | Why it hurts |
|---|---|---|---|
| 1 | **Snap + Lenis smooth scrolling** | `js/public/scroll.js`, Lenis CDN script in `index.html:51` | Lenis takes scrolling away from the browser and runs it in JavaScript on the main thread. Any busy frame becomes a scroll stutter, and every CSS scroll-driven effect now waits for JS as well. The snap adds a 140 ms settle timer, a 0.8 s locked glide, a `ResizeObserver` on `<body>` that re-measures every section on any size change, and `gsap.ticker.lagSmoothing(0)`. |
| 2 | **Frosted-glass blur on every paper card** | `.paper` in `css/v2/components.css:15-16` (`backdrop-filter: blur(14px) saturate(1.15)`) | 13 papers in the static page, plus every news note and state note rendered from the API. The fixed artwork behind them pans with scroll and crossfades between sections, so the browser re-blurs every card's background on every frame. This is the single most expensive visual effect on the page. The card is already 90% opaque, so the blur is barely visible. |
| 3 | **`--lean` written on `<html>` every frame while scrolling** | `js/public/motion/scroll-life.js:33`, `.lean` rule in `css/v2/motion.css:45` | A custom property on the root is inherited by every element, so changing it every frame forces a style recalculation of the whole document (thousands of nodes) 60 times a second. Then each `.lean` card (notes, polaroids, every gallery tile) rotates, which repaints its shadow, tape and blur. |
| 4 | **Marquee reads layout every frame** | `js/public/motion/marquee.js:22` (`getBoundingClientRect()` inside the rAF loop) | It runs in the same frame right after #3 has invalidated styles, so each frame forces a full style and layout pass (layout thrashing). |
| 5 | **All five backdrop artworks animate at once** | `.backdrop__art` scroll-timeline pan in `css/v2/motion.css:72`; scale transitions in `css/v2/sections.css:12-15` | Only one artwork is visible, but all five full-screen layers (up to 2560 px wide) run the `scroll(root)` pan animation and stay composited at `opacity: 0`. That is five screen-sized GPU layers updating on every scroll frame. |
| 6 | **Off-screen sections keep rendering** | All `.scene` sections | Twinkles (7), floats (6), bob, drift, the wave text, the ticket pulse, the turning badge, the 22+ `.reveal` scroll animations and their decorations keep running and painting even when their section is far off screen. |
| 7 | **Several separate animation loops** | `scroll-life.js`, `marquee.js`, nav progress in `main.js:178-183`, Lenis via the GSAP ticker | Four independent `requestAnimationFrame` callbacks each read and write the DOM on their own schedule. |
| 8 | **Expensive paint on large text and icons** | `.sec-title__en` (9 px text stroke + 26 px blurred text-shadow), `.bg-word` (up to 360 px text with stroke, ×6), `.v-text` (×5), `filter: drop-shadow` on every `.cl` clover SVG (27 static + dynamic) | Cheap once, but they are repainted whenever something above or around them animates without its own layer (reveals, lean, parallax). |
| 9 | **Small extras** | `.clover-meter__fill` clip-path updated on every scroll frame; sparkles swap an external sprite `href` on every spawn; `html.scroll-locked` removes the scrollbar (layout shift on menu/lightbox open) | Minor on their own, but they add up on weak machines. |

Things that are already fine and stay as they are: gallery images (`loading="lazy"`, `decoding="async"`, Cloudinary `f_auto,q_auto` with `srcset`), the gallery masonry (sorts by aspect ratio, no layout reads), the one-off GSAP home intro and title letter pops, confetti, the loader (it removes itself from the DOM when done), the lightbox and the mobile menu reveal.

---

## 2. Targets (definition of "smooth")

Measured in Chrome/Edge DevTools on the production build, desktop 1920×1080 and 1366×768, and a phone (real device or 4× CPU throttle with touch emulation):

- **≥ 58 fps** while scrolling the whole page on a normal desktop; **≥ 50 fps** with 4× CPU slowdown (the existing D7 target in `MIGRATION.md` was 55/50).
- **No long tasks (> 50 ms) during scrolling** once the loader is gone.
- **INP < 200 ms** (nav clicks, lightbox, language switch, motion toggle).
- **CLS < 0.1** (also no jump when the menu or lightbox locks scrolling).
- **LCP not worse than today** (loader timings: `data-load-ms` and the `loader_timing` beacon).
- **Visual check:** before/after screenshots of every section at 1920, 1366 and 390 px look the same, apart from the snap being gone.

---

## 3. The plan

Each phase is small, ships on its own, and gets measured against Phase 0 before the next one starts. Do them in order: the first three phases should remove most of the lag.

### Phase 0: Measure the baseline (no code changes)

1. Record a DevTools **Performance** trace of a full slow scroll Home → Gallery → footer, with and without 4× CPU throttle. Note fps, long tasks, and time spent in *Recalculate Style*, *Layout*, *Paint* and *Composite*.
2. Turn on **Rendering → Paint flashing** and **Layer borders**, scroll, and screenshot which areas flash green (repaint).
3. Run Lighthouse (mobile + desktop) and save the scores.
4. Take reference screenshots of every section (1920 / 1366 / 390) for the visual check at the end.
5. Save the numbers in §6 of this file (results log).

### Phase 1: Remove snapping and Lenis → native scrolling everywhere

The owner asked for no snapping. Native scrolling is also the biggest single performance gain: the browser scrolls on the compositor thread, so scrolling stays smooth even when the main thread is busy, and CSS scroll-driven effects (reveals, parallax, backdrop pan) run off the main thread too.

1. **`js/public/scroll.js`:** delete the snap logic: `computePoints`, `inFreeZone`, `glideTo`, `settle`, the settle timer, `points` / `anchor` / `galleryTop`, the `<body>` `ResizeObserver`, the `onSectionSnap` hook, the `?debug` hook and the Lenis start/stop code (incl. `gsap.ticker.lagSmoothing(0)`).
   Keep the module's **public API** so callers barely change:
   - `initScroll()`: only the in-page anchor click handler.
   - `scrollToEl(el, { immediate })`: `el.scrollIntoView({ behavior: immediate || isCalm() ? 'instant' : 'smooth' })` + `history.replaceState` (as today).
   - `lockScroll()` / `unlockScroll()`: toggle `html.scroll-locked` (already exists).
   - `refreshScroll()`: becomes a no-op; remove the call in `main.js:318`.
2. **CSS (`layout.css` / `base.css`):**
   - `html { scroll-padding-top: <nav height + gap>; }` so anchor jumps don't land under the floating nav.
   - `:root[data-motion='full'] { scroll-behavior: smooth; }` (calm mode keeps instant jumps).
   - `html { scrollbar-gutter: stable; }` so locking scroll for the menu/lightbox doesn't shift the page sideways.
   - Inner scroll lists (`.news-list`, `.film`, `.sleeves`, `.timeline`): `overscroll-behavior: contain` (replaces what `data-lenis-prevent` did).
3. **`index.html`:** remove the Lenis `<script>` (line 51) and the four `data-lenis-prevent` attributes. `librariesReady()` in `main.js` then waits for one fewer CDN file during the loader.
4. **Section wipe (`motion/wipe.js`):** it was built to play on each snap but was never wired up, so visitors never saw it and nothing is lost. Keep the file. It could later play on nav-link jumps (`scrollToEl`) if the owner wants it; that is a separate decision.
5. The **film strip's** horizontal `scroll-snap` (video thumbnails, `components.css:220`) is a native, cheap CSS feature and not the page snapping. It stays unless the owner wants that removed as well.
6. **Docs:** record the decision change (2026-10-09: "no snapping on any device; Lenis removed") in `PROGRESS.md` §9 and `DESIGN_V2_PLAN.md` §16, and update the "strict snap" lines in `IMPLEMENTATION_PLAN.md`, `PROGRESS.md` §2/§4, `DESIGN_SYSTEM.md` and `MIGRATION.md`. The Lenis pin in hard rule 9 becomes "no longer used".

**Check:** wheel, trackpad, keyboard (Space / PgDn / Home / End), nav links, deep link `#discography`, the phone menu, lightbox open/close, calm mode. Scrolling must never lock or glide on its own.

### Phase 2: Replace the frosted-glass blur with an equivalent cheap surface

`.paper` is 90% opaque cream, so only 10% of the artwork shows through, and the blur on that 10% is hardly visible.

1. Remove `backdrop-filter` / `-webkit-backdrop-filter` from `.paper` and raise the fill slightly (e.g. `rgb(var(--paper-rgb) / 0.93)`) so it reads the same over the busiest artworks (News and Discography).
2. **A/B check with screenshots** (Phase 0 references) on all five artworks. If a panel looks noticeably different, use a fallback that still costs nothing per frame: a static, pre-blurred tint layer for that one panel, or keep `backdrop-filter` **only** on that stationary panel and never on anything that moves (`.reveal`, `.lean`, list items).
3. Remove the `--paper-blur` token if nothing uses it any more. The lightbox's `::backdrop` blur stays (it only exists while the lightbox is open, over a still page).

### Phase 3: Make the scroll "lean" local instead of page-wide

Keep the effect exactly as it looks (cards tilt slightly with scroll speed and settle back), but stop invalidating the whole document.

1. In `scroll-life.js`, stop writing `--lean` on `<html>`. Instead keep a set of the **`.lean` elements currently on screen** (one `IntersectionObserver`, updated as lists and the gallery add items) and write `el.style.rotate` (rest rotation + lean) only on those, usually 4–12 elements.
2. Skip the write when the value changed by less than ~0.02°, and stop the loop when settled (it already does).
3. Change the CSS rule `.lean { rotate: calc(... var(--lean) ...) }` to just the resting rotation, so hover states and calm mode keep working.
4. With `backdrop-filter` gone (Phase 2), rotating a card only re-composites it instead of re-blurring it.

### Phase 4: One shared animation loop; no layout reads while animating

1. **One ticker:** extend `scroll-life.js` into the single `requestAnimationFrame` loop for scroll-linked JS work. The marquee and the nav progress clover subscribe to it (`onScrollVelocity` already exists) instead of running their own loops. The loop runs only while scrolling or settling.
2. **Marquee:** drive the drift with a CSS / Web Animations `translate` animation (runs on the compositor) and only change its `playbackRate` from the scroll velocity (faster when scrolling, negative = reversed when scrolling up). Same look, almost no main-thread work. Cache the track width with a `ResizeObserver` instead of measuring every frame. Pause it when off screen (already does).
3. **Nav progress clover:** update `--fill` from the shared loop, and replace the `clip-path` transition with a `transform: scaleY()` on an inner fill element (compositor-only), or at least drop the 0.2 s transition so it doesn't animate on top of per-frame updates.
4. **Cursor sparkles:** build one pool element per shape/colour up front (no `href` swapping on every spawn), put the sparkle layer in its own `position: fixed; contain: strict` box, and keep the current spawn rate.

### Phase 5: Stop rendering what is off screen

1. **`content-visibility: auto` on each `.scene`** with `contain-intrinsic-size: auto 100svh`. Scenes already use `overflow: clip`, so the paint containment this adds changes nothing visually. The browser then skips style, layout and paint for sections far off screen, which also pauses their infinite decorations (twinkles, floats, bob, drift, wave, badge, ticket pulse) for free.
   - Verify: anchor jumps and deep links land exactly; the active-section `IntersectionObserver` and the backdrop crossfade still trigger; find-in-page still finds text in hidden sections (it does with `auto`); the gallery's infinite loading sentinel still fires.
2. **Backdrop artworks:** run the `scroll(root)` pan only on `.backdrop__art.is-active` (and the one fading out). After the 0.9 s crossfade, inactive artworks get `visibility: hidden` (with a delayed `visibility` transition), so the browser stops compositing four invisible full-screen layers. Keep pre-decoding them during the loader as today, so the crossfade itself never stutters.
3. **Infinite decorations as a fallback:** if Phase 5.1 can't be used somewhere, pause decorations whose section is off screen with a class from the active-section observer (`animation-play-state: paused`).

### Phase 6: Cheaper paint for big text and clovers

Only if Phase 0/after-Phase-5 traces still show large *Paint* blocks around titles and decorations.

1. **Clover drop-shadows:** bake the small shadow into the `#cl-leaf` / `#cl-round` sprite symbols (an offset darker copy of the shape) instead of `filter: drop-shadow()` on each of ~30 SVGs. It looks identical and no longer counts as a filter.
2. **Section titles / `.bg-word` / `.v-text`:** give the animated title block (`.reveal-pop`) its own layer only while it animates (`will-change: transform` added at the start and removed on `animationend`), so a reveal moves a cached bitmap instead of repainting 86 px stroked, shadowed text. Leave the stroke and shadow values unchanged.
3. Check that `.deco-parallax` items (2) and `.reveal` cards don't share a layer with a big title; if they do, isolate them (`isolation: isolate` or a layer hint on the moving element only).

### Phase 7: Loading and network (smaller wins)

1. Lenis removal (Phase 1) saves one CDN request during the loader.
2. Load `canvas-confetti` on first use (logo click / pose tap / special day) instead of during the loader; same effect, one less file before Home appears. The special-day check can import it right after the loader closes.
3. Make sure the four non-Home backdrop images use `fetchpriority="low"` so Home's art and the logo always win the bandwidth race (they are still preloaded in tier 2 as today).
4. Confirm the response headers in `vercel.json` give `/assets/**`, `/css/**` and `/js/**` long cache lifetimes (immutable for hashed or versioned files, revalidate otherwise).

### Phase 8 (only if still needed, owner decision): automatic "lite rendering" on weak devices

If a low-end phone or laptop still misses the targets after Phases 1–7, add a third rendering tier beside `full` and `calm`, picked automatically (e.g. `navigator.hardwareConcurrency <= 4`, `navigator.deviceMemory <= 4`, or measured frame times during the loader). **Lite keeps every element and every animation**; it only swaps in cheaper versions: no lean, the static sprite shadows from Phase 6, and shorter crossfades. Ask the owner before building this, because it changes how the effects look on those devices.

---

## 4. What does not change

- All content and all decorative elements listed in `DESIGN_SYSTEM.md`.
- The loader (art, clover pair, petals, facts, iris exit), the home intro, the title letter pops, the wave text, confetti, sparkles, the marquee, the backdrop crossfade, reveals, parallax, the countdown flip, hover/tap micro-interactions and the lightbox grow.
- Calm mode and `prefers-reduced-motion` behaviour (calm already turns most motion off; it simply gets cheaper as well).
- Analytics events (`section_dwell` uses the active-section observer, which stays).

## 5. Risks and how to check them

| Risk | Check |
|---|---|
| Anchor jumps land under the nav after Lenis is gone | `scroll-padding-top`; test every nav link + deep links at 1920 / 1366 / 390 |
| `content-visibility` changes section heights while scrolling (scrollbar jumps) | `contain-intrinsic-size: auto …` remembers real sizes; scroll the page top→bottom→top and watch the scrollbar |
| Paper cards look flatter without the blur | Screenshot A/B per artwork (Phase 2.2) |
| Lean feels different after the change | Side-by-side recording before/after at the same scroll speed |
| Marquee speed/direction feels different | Compare with the recording; tune the `playbackRate` factor |
| Docs still describe the snap | Phase 1.6 doc pass; grep for `snap`, `Lenis`, `lenis` afterwards |

## 6. Checklist and results log

- [x] Phase 0: baseline numbers + screenshots recorded (§7)
- [x] Phase 1: snap + Lenis removed, native scrolling, docs updated
- [x] Phase 2: `.paper` blur replaced, A/B screenshots checked
- [x] Phase 3: lean scoped to visible cards
- [x] Phase 4: one ticker, compositor marquee, meter, sparkles pool
- [x] Phase 5: off-screen sections + backdrop (**changed**: `.is-far` instead of `content-visibility`, see §7.2)
- [x] Phase 6: measured; no gain, nothing changed (§7.2)
- [x] Phase 7: confetti after the loader, fetch priorities (cache headers deliberately unchanged, §7.2)
- [ ] Phase 8: lite tier — **not approved by the owner**, not built
- [~] Final: big gains on slow CPUs; the 60 fps target is not reached on the weakest GPU at 1920×1080 without removing effects (§7.3). Owner to try it on their own devices.

Results: see §7.3.

---

## 7. Execution report (2026-10-09)

### 7.1 What changed

| Phase | Change | Files |
|---|---|---|
| 1 | Snap, Lenis (script + stylesheet), `data-lenis-prevent`, `refreshScroll`, `onSectionSnap` removed. `scroll.js` now only does in-page jumps (`scrollIntoView`, smooth in full motion / instant in calm) and the menu/lightbox scroll lock. `html { scrollbar-gutter: stable }` so locking doesn't shift the page. No `scroll-padding-top`: sections already start under the nav by design | `scroll.js`, `main.js`, `index.html`, `prepaint.js`, `layout.css` |
| 2 | `.paper` has no `backdrop-filter`; fill 0.90 → 0.94 opacity. `--paper-blur` token removed | `components.css`, `tokens.css` |
| 3 | `--lean` is written only on `.lean` cards that are on screen (IntersectionObserver + MutationObserver for cards added later), never on `<html>`. The video polaroid leans through `transform`, so the lean no longer restarts its hover `rotate` transition every frame | `scroll-life.js`, `motion.css` |
| 4 | `scroll-life.js` is the one scroll ticker: velocity, lean, and subscribers. Velocity is measured from the last settled position and the loop keeps running 150 ms after the last scroll event (the old loop could stop on its first frame and miss native scroll jumps). Marquee = one looping Web Animation; scroll speed only changes its `playbackRate` (negative = reversed). Nav clover reads a cached page height and lost its per-frame `clip-path` transition. Sparkles: 4 ready-made sprites per shape in a `contain: strict` layer | `scroll-life.js`, `marquee.js`, `main.js`, `sparkles.js`, `components.css` |
| 5 | Backdrop: one `.backdrop__pan` layer carries the scroll pan and the veil (was five pan animations + a separate full-screen veil layer); faded-out artworks become `visibility: hidden`. Sections more than one screen away get `.is-far` → `animation: none` (no compositing of their reveals, parallax and loops) | `index.html`, `sections.css`, `motion.css`, `layout.css`, `main.js`, `backdrop.js` |
| 7 | canvas-confetti is injected (with SRI) when the browser is idle after the loader, or on the first burst. Non-Home backdrop images `fetchpriority="low"` | `fx.js`, `main.js`, `index.html` |

### 7.2 Deviations from the plan

- **No `content-visibility` (Phase 5.1).** It was the single biggest CPU win (1366×768 at 4× CPU: 23 → 37 fps), but in Chrome 154 starting **any** View Transition while a rendered-but-off-screen section has `content-visibility: auto` hangs the page. Reproduced on the original build too, and on a section-by-section basis; workarounds (pinning sections visible, switching it off before the transition) did not hold. The lightbox grow uses a View Transition, so this was replaced by `.is-far` (≈ 30–35 fps in the same test). Revisit when Chrome fixes it.
- **No `scroll-padding-top` and no `overscroll-behavior: contain`.** Sections are designed to start at the very top under the nav; containing the inner lists would make the page feel stuck when the wheel is over a tall list.
- **Phase 6 not applied.** Turning off all filters, text strokes/shadows or box-shadows (GPU and software runs) changed nothing measurable, so the clover shadows and titles were left exactly as they were.
- **Phase 7.4 cache headers unchanged.** CSS/JS file names are not versioned; longer caching could serve an old module next to a new one after a deploy (e.g. `main.js` importing an export that no longer exists).
- **Nav clover** keeps its `clip-path` fill (no `scaleY` swap, which would look different); only the per-frame transition was removed.

### 7.3 Measurements

Headless Chrome 154 over the DevTools protocol, on this machine's **AMD Radeon Vega 3** (a weak integrated GPU; `--use-angle=gl`). Test: wheel down the whole page (110 × 100 px every 70 ms) then up (30 notches), with mouse moves; frames timed with `requestAnimationFrame`. Same API data for both builds (production public API proxied, analytics beacons swallowed). Back-to-back runs vary by about ±2 fps.

| Run | Build | fps | p95 frame | frames > 33 ms | frames > 50 ms | Layerize (ms) |
|---|---|---|---|---|---|---|
| 1920×1080 | before | 35.3 | 83 ms | 196 | 140 | 3026 |
| 1920×1080 | after | 38.3 | 83 ms | 118 | 100 | 1764 |
| 1366×768, CPU 4× slower | before | 22.2 | 117 ms | 419 | 180 | 8397 |
| 1366×768, CPU 4× slower | after | 35.2 | 100 ms | 174 | 125 | 3798 |
| Phone 390×844, CPU 4× slower | before | 54.7 | 33 ms | 55 | 21 | 814 |
| Phone 390×844, CPU 4× slower | after | 56.8 | 17 ms | 28 | 16 | 858 |

Software rendering (no GPU), 1920×1080: 26 → 37–40 fps, long tasks 13 → 3, composite/draw time halved.

**What still limits 1920×1080 on the Vega 3:** the GPU itself. The same harness scrolls a plain text page at a steady 60 fps, and switching off *all* CSS animations and transitions gets the site to ≈ 50 fps, so the remaining cost is the visible effects themselves (scroll-linked reveals, the backdrop pan + crossfade, the looping decorations), which the owner chose to keep. The optional lite tier (Phase 8) was the planned answer for such devices and was not approved.

**Visual check:** before/after screenshots of every section at 1920×1080 and 390×844 look the same; the only differences are random content (fan art of the moment, countdown) and, in headless screenshots, the 15 px scrollbar gutter that a real scrollbar occupies.

**Behaviour check (≈ 35 automated checks, all passing):** a wheel notch moves freely (no glide back); nav links and deep links land exactly on the section; the backdrop shows only the current artwork; the marquee runs, reverses when scrolling up and settles back to its drift; lean is written on on-screen cards only; the nav clover fills; confetti is not loaded during the loader, arrives afterwards and fires on the logo; sparkles animate; the lightbox opens with its grow, locks scrolling and closes with Escape; PageDown scrolls; the motion toggle switches to calm (marquee stops, jumps are instant) and back; the polaroid keeps its resting tilt; the phone menu locks scrolling and its links work; reduced-motion devices get calm mode; no console errors or CSP violations. (Headless touch swipes are unreliable on both builds, as noted in `MIGRATION.md`; the owner should try a real phone.)

