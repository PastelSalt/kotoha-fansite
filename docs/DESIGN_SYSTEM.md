# Kotoha Fan Site — Design System v2 ("Clover Scrapbook")

Reference for the redesign on branch `designupdatev2` (plan: `docs/DESIGN_V2_PLAN.md`).
**Live on the production site since 2026-10-02** (merged into `main`, `c7b6975`). The stand-alone style tile `/design-v2/` that demonstrated these pieces was deleted before the merge; the real page uses them (see §10 for the page modules).

> **Owner direction (2026-09-28, after the first style tile):** this is a *creative-heavy Japanese fan site* — **dense and layered, never Western minimalism**. No large empty areas (especially Home), plenty of components and decoration, and **clovers are always illustrated and filled — never hollow outlines**.

> **Idea:** Kotoha's fan scrapbook. Fan artworks are the photos; content sits on **paper notes** taped onto them; headings are **die-cut stickers**; a dashed **stitch** marks only the special items. Motion has music-video quality — rhythmic, springy, alive while scrolling — but the site stays a normal, readable website.

---

## 1. Files & cascade layers

| File | Layer | Contents |
|---|---|---|
| `public/css/v2/tokens.css` | `tokens` | **Load first** — declares the layer order `legacy, tokens, base, components, sections, motion`; colours, type, spacing, shape, depth, motion tokens; `@property --iris`, `--fill` |
| `public/css/v2/base.css` | `base` | element defaults, typography (EN/JA), links, focus ring, `.visually-hidden`, `.grain`, `.clover-pattern`, `.doodle` |
| `public/css/v2/components.css` | `components` | every reusable piece (§4) |
| `public/css/v2/sections.css` | `sections` | section accents (`data-accent`), artwork layer (`.art`), scrims; section compositions (D4) |
| `public/css/v2/motion.css` | `motion` | keyframes, scroll-driven effects, lean, iris, lightbox transitions, calm mode |
| `public/css/v2/layout.css` | `sections` | the real page: nav pill, mobile menu, scenes (Home / About / News / Discography / Gallery), loader, footer, short-laptop rules |
| `public/assets/svg/v2-sprite.svg` | — | SVG sprite: `#cl-leaf` (illustrated four-leaf clover), `#cl-round` (filled brand clover), `#spark`, `#heart`. Referenced by URL. **XML comments must never contain two hyphens in a row** (it breaks the whole file) |
| `public/css/site.css` (v1) | `legacy` (during migration) | emptied section by section, deleted after D4 |

Later layers win regardless of selector specificity, so motion rules can safely override component rules.

## 2. Tokens (`:root`)

**Colour**

| Token | Value | Use |
|---|---|---|
| `--pink-300` | `#fe9fb9` | brand base (page background) |
| `--pink-50/100/200/500/700` | `#fff5f8` `#ffe2eb` `#ffc6d6` `#ef5f8d` `#b8325f` | highlights; **700** = pink text / white-on-pink (AA) |
| `--green-500` | `#63a23d` | brand green (stickers, clovers) |
| `--green-50/100/200/300/600/700/900` | … `#2f7a1f` (700) … `#1f4f15` (900) | **700** = buttons, links, white-on-green (AA 5.4:1) |
| `--paper` / `--paper-rgb` | `#fffaf2` / `255 250 242` | cards (`rgb(var(--paper-rgb) / .94)`) |
| `--ink` / `--ink-soft` | `#2b3326` / `#56614f` | body / meta text (AA on paper) |
| `--accent-home/about/news/disco/gallery` | lavender `#c9b6f4` · sky `#bfe4ff` · rose `#ffb3c7` · peach `#ffd3b0` · mint `#c8ecd9` | set `--accent` per section via `data-accent="…"` |

**Type:** `--font` (Fredoka + M PLUS Rounded 1c), `--font-ja`, `--font-doodle` (Yomogi, tiny notes only). Fluid sizes: `--fs-meta` 13–14 · `--fs-body` 15–17 · `--fs-lead` 16–20 · `--fs-title` 17–22 · `--fs-h3` 20–28 · `--fs-h2` 26–44 · `--fs-display` 40–92 px. **Nothing smaller than 13 px.** Line-height 1.6 (JA 1.75).

**Space:** `--s-1…9` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 px; `--gutter` 16–40 px.
**Shape:** `--r-chip` 12 · `--r-card` 20 · `--r-panel` 28 · `--r-pill`.
**Depth:** `--shadow-paper` → `--shadow-lift` → `--shadow-modal`; `--shadow-sticker` (green-tinted). Never grey-black shadows.
**Motion:** `--beat` 469 ms (128 BPM) · `--t-tap` 120 · `--t-pop` 350 · `--t-move` 560 · `--t-glide` 820 ms · `--ease-pop` (springy) · `--ease-out` · `--ease-in-out` · `--ease-in`.

## 3. Surfaces (the scrapbook vocabulary)

| Class | What | Rule |
|---|---|---|
| `.paper` (+ `.paper--panel`) | cream note (94 % opaque, **no blur** since 2026-10-09 for performance), soft shadow | default container for content over artwork |
| `.stitch` | inset dashed line | **featured items only** (next-stream ticket, latest video, profile card, "coming soon") — ≈4–6 per screen |
| `.tape` (`--right`, `--center`) | washi tape strip in `--accent` | 1 per card at most |
| `.sticker` (`--sm`, `--pink`) + `.sticker__clover` | die-cut heading, slight tilt (`--sticker-rot`) | section headings; white text on green (large text AA) |
| `.scrim--left/right/bottom/soft` | gradient over the artwork | only behind the content side, so the character stays bright |
| `.grain`, `.clover-pattern` | paper texture / faint clovers | plain pink areas |

## 4. Components

| Component | Markup / classes | Notes |
|---|---|---|
| Buttons | `.btn`, `.btn--ghost`, `.btn--sm` | squish on press (`:active` scale .96), lift on hover |
| Chips | `.chips > .chip`; `.date-chip` | links on cards; dates |
| JP/EN pill | `.lang-pill[data-active="ja\|en"] > button[aria-pressed]` ×2 | highlight slides (`::before` translate) |
| Motion toggle | `button.motion-toggle[data-motion-toggle] > .motion-toggle__icon + [data-motion-label]` | wired by `mountMotionToggles()`; disabled when the device asks for reduced motion |
| Next-stream ticket | `.paper.ticket.stitch > .ticket__stub + .ticket__body > .flip > .flip__unit > .flip__num` ; `.ticket__live` | notched ticket; digits flip (`.is-flipping`); `.is-live` shows the LIVE badge |
| Polaroid (video) | `figure.polaroid > .ribbon + button.polaroid__photo > img + .play` + `figcaption` | `--polaroid-rot` resting tilt; shine sweep + play pop on hover; replaced by the YouTube iframe on click |
| News note | `article.paper.note > .pin + .stamp? + time.date-chip + h3.note__title + p.note__text + .chips` | newest gets the "NEW" stamp |
| Film strip | `.film > button.film__frame[aria-current] > img` | horizontal scroll-snap row of video thumbnails |
| Profile card | `article.paper.profile.stitch > .profile__head (.profile__avatar, .profile__name, .profile__role) + dl.facts` | facts from `about.pills` in the locale files |
| Release sleeve | `article.sleeve > .sleeve__art (.sleeve__disc + img \| .sleeve__cover) + .sleeve__meta` | designed cover when there's no YouTube thumbnail; vinyl slides out on hover |
| Coming soon | `.paper.soon.stitch` | nearest future-dated release, days-left counter |
| Timeline | `ol.timeline > li.timeline__year + li.timeline__item (time + p)` | stitched line, clover markers |
| Gallery tile | `button.tile > img + .tile__credit` | credit slides up on hover/focus (always visible on touch) |
| Lightbox | `dialog.lightbox > .lightbox__close + img + .lightbox__caption` | open/close via `@starting-style`; artwork grows from its tile with View Transitions (§5.4) |
| Nav pill | `nav.nav-pill.paper > .nav-pill__logo + ul.nav-pill__links (a[aria-current] …, .nav-pill__dot) + .clover-progress + .lang-pill + .motion-toggle` | dot position via `--dot-x`; clover fill via `--fill` (0…1) |
| Marquee | `.marquee > .marquee__track > span ×2` (identical) | driven by `startMarquee()`; `aria-hidden` |
| Clover spinner | `.clover-spinner` (filled by `mountSpinner()`) | see §6 |
| Mascot cameo | `img.mascot-peek` | decorative, `alt=""` |
| Empty / error | `.state-note` | mascot + text |

### 4.1 Density vocabulary (Japanese fan-site style)

Every section should feel full: a numbered title block, content on **both** sides where there's room, and a decoration layer.

| Piece | Markup / classes | Notes |
|---|---|---|
| Clover icon | `<svg class="cl [cl--pink\|gold\|mint\|sky\|lav\|white]"><use href="/assets/svg/v2-sprite.svg#cl-leaf"/></svg>` | illustrated: 4 heart leaves, lighter inner leaf, veins, gloss, stem, white die-cut edge. `#cl-round` = filled brand clover. Colours via `--c1…--c4` |
| Sparkle / heart | `svg.spark(.spark--pink\|gold)` / `svg.heart` with `#spark` / `#heart` | `.twinkle`, `.float` idle loops (full motion only) |
| Section title | `header.sec-title > .sec-title__num + h2.sec-title__en (+ .cl) + p.sec-title__ja + .sec-title__line` | big EN word with white sticker outline, JA subtitle pill, round number badge "NO. 01" |
| Mini title | `.mini-title > .cl + .mini-title__en + .mini-title__ja` | sub-headings inside sections ("LATEST NEWS 最新情報") |
| Background word | `span.bg-word[aria-hidden]` | giant outlined word behind content (KOTOHA, PROFILE, NEWS, MUSIC, FAN ART) |
| Vertical text | `p.v-text(.v-text--green)[lang=ja][aria-hidden]` | vertical Japanese tagline at a section edge — **never over the character's face** |
| Rotating badge | `.badge-round > svg.badge-round__text (textPath) + .cl` | circular "KOTOHA ✿ FAN SITE ✿ ことは" text; the path must be inline (textPath can't use the external sprite) |
| Speech bubble | `span.bubble(.bubble--left)` | site voice only ("new cover ♡", "thank you, artists!") — never words attributed to Kotoha |
| Stamps & labels | `.stamp`, `.stamp--pickup` ("PICK UP!"), `.label-chip` | "NEW" stamp on the newest item |
| Paper textures | `.paper--grid` (grid paper), `.paper--lined` (notebook), `.lace` (scalloped bottom edge) | mix them so notes don't all look the same |
| Weekly schedule | `ol.week > li.week__day(.is-stream .is-today)` | this week in JST (Mon-start); stream days pink with a clover |
| Social badges | `ul.socials > li > a.social > img + span` | official icons + handles, up front on Home |
| Fan art of the moment | `.paper.paper--grid.fanart` | one credited gallery artwork, random per visit |
| Gingham background | `.board--pattern` | plain pink areas are never flat |

### 4.2 Artworks: fixed crossfading backdrop
All section artworks sit in one fixed `.backdrop` (`.backdrop__art[data-art]`); sections carry `data-art`. `startBackdrop()` (`motion/backdrop.js`) fades to the artwork of the section crossing the middle of the screen, so there is **never a hard edge between two artworks** (important with free scrolling on phones). The current art settles from a slight zoom and pans a little with page scroll (one `scroll(root)` animation on `.backdrop__pan`, which also carries the pink veil); an artwork that has faded out is `visibility: hidden` so it isn't composited. Calm mode: quick fade only.

## 5. Motion system

### 5.1 Principles
1. **One tempo** — 128 BPM; durations/staggers in beats (`beats(n)` in `motion/beat.js`).
2. **Motion around content** — text settles within ~1 beat and never moves while being read.
3. **Only cheap properties** — transform / opacity / clip-path / mask.
4. **Progressive enhancement** — scroll-linked effects use native CSS scroll-driven animations inside `@supports ((animation-timeline: view()) and (animation-range: entry))`; browsers without support simply show the content still.
5. **Calm mode** — `html[data-motion="calm"]` when the device asks for reduced motion **or** the visitor switches motion off. Only short fades remain. **Exception:** the loader clovers keep turning (slower) — they are the loading indicator.
6. **No flashing** — never more than 3 flashes per second.

### 5.2 Property ownership (so effects never fight)
| Property | Owned by |
|---|---|
| `transform` | scroll-driven reveal / camera / parallax keyframes |
| `translate`, `scale` | hover & tap micro-interactions |
| `rotate` | resting tilt + velocity lean: `.lean { rotate: calc(var(--rest-rot) + var(--lean) * 1deg) }` (the polaroid leans via `transform` so its hover `rotate` transition isn't restarted every frame) |

### 5.3 CSS classes (motion.css)
| Class | Effect |
|---|---|
| `.reveal` | rises in while entering (from below *or* above), eases back slightly while leaving |
| `.reveal-pop` | pop + tilt settle as it arrives (sticker headings) |
| `.art-camera > img` | slow pan + zoom across its section (reverses when scrolling up) |
| `.deco-parallax` | decorations drift faster than content (depth) |
| `.lean` | follows the scroll-speed lean (±2°) |
| `.wave > span` | bouncing letters (built by `waveText()`) |
| `.bob`, `.drift`, `.push-in` | idle loops (full motion only) |
| `.iris-out` / `.is-open` | circular iris reveal (registered `--iris`); `.fade-out` fallback |

### 5.4 JS modules (`public/js/public/motion/`)
| Module | API |
|---|---|
| `../../motion-boot.js` (classic, in `<head>`) | sets `data-motion` before first paint |
| `prefs.js` | `motionMode()`, `isCalm()`, `onMotionChange(cb)`, `setMotionOff(bool)`, `mountMotionToggles()` — stores the choice in `localStorage.kf_motion` |
| `beat.js` | `BPM`, `BEAT`, `beats(n)`, `beatsMs(n)`, `EASE`, `whenGsap(ms)` |
| `scroll-life.js` | the single scroll ticker: `startScrollLife()` (velocity → `--lean` on the on-screen `.lean` cards only, never on `<html>`), `scrollVelocity()`, `onScrollVelocity(cb)` (marquee + nav clover subscribe), `pageProgress()` (cached page height) |
| `marquee.js` | `startMarquee(el, { speed })` — one looping Web Animation (compositor); scroll speed sets its `playbackRate` (faster, negative = reversed on scroll-up); pauses off-screen |
| `sparkles.js` | `startSparkles()` — desktop mouse only, pooled; mixes sprite sparkles, hearts and clovers |
| `wipe.js` | `playWipe({ direction, accent, onCovered })` → Promise — striped accent panel sweeps across |
| `spinner.js` | `mountSpinner(host)` → `{ setProgress(0…1), complete(), reset() }` — both clovers filled (outer white with inner shade; inner pale green whose petals turn green) |
| `backdrop.js` | `startBackdrop(backdropEl, sections, { onChange })` — crossfading artwork backdrop (§4.2) |
| `text.js` | `waveText(el, text)`, `popLetters(el, gsap)` (SplitText, accessible) |

Lightbox growth uses `document.startViewTransition()` with a temporary `view-transition-name` on the tile image and the viewer image (removed after `finished`); without support it opens normally. The dialog's own fade is disabled (`.no-anim`) during the transition.

### 5.5 Libraries
GSAP **3.15.0** (+ SplitText, Flip, ScrollTrigger, CustomEase as needed) from jsdelivr, pinned with SRI:

| File | SRI |
|---|---|
| `gsap.min.js` | `sha256-krualkdvmD0hKivE9UyIkDnBaW3URh1ApzaGCThXD7s=` |
| `ScrollTrigger.min.js` | `sha256-sLFNZ7VbDEPHVqwLEGz8sJ0IeZRfbq1kRRBlsGcpFqI=` |
| `SplitText.min.js` | `sha256-QZ9wJ6XwhqEst5iHNtj906btIgAilmHeJbZijKfO00Q=` |
| `Flip.min.js` | `sha256-y+PKcmNQ+NIw2jihTOI4Tndy4FpFzuYUTdf+bd6GjC8=` |
| `CustomEase.min.js` | `sha256-Rm5CalxgwhyUsVowo9/6ysm7Oc6PTgfQcdfUuxvkM5A=` |

(Hashes verified against the served bytes, 2026-09-27.) Anime.js and Animate.css are **not** used by v2 (the admin panel keeps Animate.css).

## 6. Loader (v2)

- Two overlapping clovers: **outer turns clockwise (4 s/turn), inner counter-clockwise (2.5 s/turn)** for as long as the loader is visible (CSS animation → keeps running while scripts load). Calm mode: 12 s / 8 s.
- Inner clover's 4 petals (quadrants of `CLOVER_PATH`, clipped) fill clockwise from top-left as loading progresses (`setProgress`).
- "Loading…" as a gentle wave; optional "Did you know?" line from `about.pills`.
- Exit: one fast spin (`.is-whoosh`), then the iris opens from the spinner's centre onto Home (`--iris-x/y`). Without `@property` support → fade.

## 7. Accessibility rules
- Text contrast AA (checked per pair); body never under 13 px; visible focus ring (`--focus-ring`).
- Decorative motion elements are `aria-hidden`; split text keeps a readable copy for screen readers (`waveText`, SplitText `aria: 'auto'`).
- Motion toggle in nav + footer; device reduced-motion always respected.
- Lightbox is a native `<dialog>` (focus trap, Esc to close).

## 8. Adding something new
1. Use tokens only (no raw hex/px outside `tokens.css`, except one-off decoration geometry).
2. Put it in the right layer file; name blocks `.thing`, parts `.thing__part`, variants `.thing--variant`.
3. Decide its motion: which property it owns (§5.2), what calm mode does.
4. Use it on the real page (`public/index.html` + `public/css/v2/layout.css` for placement) and document it here.

## 9. Checks (scratchpad scripts used during the redesign)
Scripts live in Claude's temporary scratchpad, **not in the repo** (re-create or commit cleaned copies; harness gotchas are in `MIGRATION.md` §8): `site-shot.mjs` (per-section screenshots at several sizes + CSP/console/network issues), `site-behavior.mjs` (~50 checks: loader spin, petals, wheel snap, nav/anchors, EN↔JA, video, lightbox, motion toggle, tracking beacons, deep link, phone menu, reduced motion), the older `tile-shot.mjs` / `tile-motion-test.mjs` / `lean-debug.mjs`, plus the v1 suite (admin/gallery/tracker/CSP/spin checks).

## 10. Public page modules (real site, since 2026-10-02)

| Module (`public/js/public/`) | Role |
|---|---|
| `main.js` | boot order: tracking → language → lists → gallery → tiered loader tasks → motion/scroll/backdrop/menu/countdown → deep link → hide loader → home intro |
| `render.js` | builders: `sprite()`, `icon()`, `videoPolaroid()`, `filmFrame()`, `newsNote()`, `releaseSleeve()`, `achievementRows()`, `galleryTile()`, `socialBadge()`, `stateNote()` (all text via `textContent`) |
| `lists.js` | `getJson()`, `pagedList()` — `render(item, index, all)` may return several nodes (timeline year pills); `axis: 'x'` for the film strip |
| `gallery.js` | JS masonry (2–5 columns by width), infinite load, lightbox that grows from its tile (View Transitions; plain open in calm mode) |
| `home.js` | `renderWeek()` (this week's Tue/Fri streams, JST), `renderSoon()` (nearest future release, mini + wide), `renderFanArt()`, `isRecent()` (NEW stamp only for items ≤ 45 days old) |
| `countdown.js` | `nextStream()` + flip-digit ticket, LIVE state, once-a-minute screen-reader text |
| `loader.js` | petal progress from real task completion, wave text + "Did you know?" facts, iris/fade exit |
| `scroll.js` | native free scrolling everywhere (no snap, no Lenis); `scrollToEl()` for in-page jumps (smooth in full motion, instant in calm), `lockScroll()` / `unlockScroll()` |
| `fx.js` | confetti, `boing()` (Web Animations), `homeIntro()`, `popTitlesOnArrival()` (GSAP SplitText) |

Page CSS placement lives in `public/css/v2/layout.css` (layer `sections`): `.site-nav`, `.mobile-menu`, `.scene` + per-section compositions, `.loader`, `.foot`, and the short-laptop Home rules (`@media (min-width: 1100px) and (max-height: 960px)`).

## Performance rules (2026-10-09, see `PERFORMANCE_PLAN.md`)

- No `backdrop-filter` on surfaces over the moving backdrop or on anything that animates (`.paper` uses a 94 % fill instead).
- Never write per-frame custom properties on `<html>`: it restyles the whole document. Write them on the few elements that need them.
- One scroll ticker (`motion/scroll-life.js`); subscribe with `onScrollVelocity()` instead of adding `requestAnimationFrame` loops. No layout reads (`getBoundingClientRect`, `scrollHeight`) inside frames — cache them with a `ResizeObserver`.
- No CSS transition on a property that JS changes every frame (it restarts each frame).
- Sections more than a screen away get `.is-far` (`animation: none`). **Don't use `content-visibility` on `.scene`**: in Chrome 154 it makes the lightbox's View Transition hang the page.

