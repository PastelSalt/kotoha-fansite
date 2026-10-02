# Kotoha Fan Site — Design Update v2 (visuals + motion)

| | |
|---|---|
| **Status** | **Executing. D1–D4 + D6 are built and MERGED INTO `main` (2026-10-02, `c7b6975`) at the owner's explicit request, so the new design is on the production domain. Remaining: verify production, ✋2 owner review, D5 phones, D7 motion, D8 extras, D9 QA.** Design system reference: `docs/DESIGN_SYSTEM.md`; handoff: `../MIGRATION.md` |
| **Branch** | `designupdatev2` (created from `main` @ `eef577f`; merged into `main` 2026-10-02 — continue each remaining phase on a fresh branch from `main`, merge only with the owner's OK) |
| **Scope** | How the public site looks and moves. Content, database, API, admin panel, analytics, i18n and security stay as they are |
| **Clarity** | **90%** (v0.2.2: 88%) — every design question is answered; the rest is taste, settled at the D1 style tile |
| **Technical confidence** | **91%** (v0.2: 88%) — no WebGL recommended any more; everything is standard GSAP/CSS |
| **Resume file** | This file (§14 has the checklist). `docs/PROGRESS.md` on `main` stays the source of truth for everything that is not design |

---

## 0. Owner answers so far

### Round 1 (2026-09-26)

| Q | Answer | Effect on the plan |
|---|---|---|
| 1 Direction | **Clover Scrapbook** | §3 |
| 2 Admin panel | **Keep the current admin look** | Admin out of scope |
| 3 Layout freedom | **Full freedom** — rearrange, add things that help | New compositions (§6) + optional extras (§8) |
| 4 Dashed borders | Claude decides | "Stitch" only on featured items (§4.3) |
| 5 Libraries | Claude decides | GSAP 3.13 (free SplitText/Flip), drop Anime.js + Animate.css (§7.7) |
| 6 Motion | **"Music-video-ish"** — *clarified below* | §5, §7 |
| 7 Cursor sparkle trail | **Yes** | Desktop only, subtle |
| 8 Phone scrolling | Claude's opinion wanted | Recommend free scrolling on phones (§7.6) — confirm in Q7 |
| 9 Fonts | Fredoka stays main; extra font OK if it helps | Optional handwritten accent, tested in the style tile |
| 10 Section accent colours | Yes | §4.1 |
| 11 "Most latest" | Claude decides | → **"Latest" / 「最新」** |
| 12 Review style | Yes | Screenshots in chat + protected Vercel preview link |
| New | **Remove the "art by …" labels from the artworks** (they break the illusion); credit those artworks in the gallery | Labels removed (sections + loader); gallery + footer credits (§6) |
| Note | Cloudinary key/secret in Vercel = known loose end on `main` | Tracked in `docs/PROGRESS.md` §8 |

### Clarification (2026-09-26, before round 2)

> "MV-like only for the **movements** (animations and transitions) — it's still a **proper website**. Also make the page **more alive**: subtle animations/transitions when the user **scrolls up and down**."

### Loader notes (2026-09-26, before round 2)

> "The **2 overlapping clovers** are meant to **rotate indefinitely as long as the loading page is in view** — the clover is the simulated loading indicator." · "Improve the loading screen the way you want."

- **v1 miss acknowledged:** the live loader's two clovers (white-filled clover + outlined clover) are currently **static**. Rotation is now a hard requirement (§7.4a). A quick fix on `main` is offered in Q L4.
- The loader redesign is delegated to Claude → proposal in §7.4a.

So the v0.2 idea of "the page *is* a music video" (opening title card, "Thanks for watching" end card, giant drifting words) is **dropped as the default**. The site is a normal website with normal sections and a normal footer; the **quality of movement** is what borrows from anime MVs, and the page reacts **gently to scrolling in both directions**.

---

## 1. Goal

A **polished, hand-made fan site** in the Clover Scrapbook look, with **MV-quality motion**: smooth, rhythmic, stylish transitions and a page that feels **alive while you scroll** — subtle, never distracting, always readable.

**Not changing:** data shown, admin panel, API, database, JP/EN, analytics, CSP/SRI rules.

---

## 2. Honest audit of the current UI (measured)

Compared at 1366×768 and 360×800 against your references.

**Keep:** art-first composition, logo, green sticker headings, pink nav words, scallop divider, clovers, Fredoka, section structure, JP/EN.

| # | Problem | Evidence |
|---|---|---|
| A1 | Text too small | Desktop body 11.6–13.7 px; on phones **146 of 267** text elements are under 12 px |
| A2 | Dashed borders everywhere | **29** visible at once on desktop, **51** on phones |
| A3 | Cards fight the artwork | Flat 74% white, no blur, no shadow |
| A4 | No hierarchy | Everything green bold at similar sizes |
| A5 | Inconsistent spacing | Gaps vary per section |
| A6 | About crowded | Tiny dashed "pills", small green text on the art |
| A7 | Discography looks empty | Big clover placeholders when there's no video |
| A8 | Gallery squeezed | 2 small columns in a narrow panel under a huge banner |
| A9 | Footer generic | Default-looking columns |
| A10 | Motion basic | Fades/slides; the page doesn't react to scrolling |
| A11 | Credits break the illusion | "art by …" labels on every artwork |

---

## 3. Visual direction: **Clover Scrapbook** (chosen)

Kotoha's fan scrapbook: artworks are the photos, content sits on **paper notes** taped onto them, headings are **die-cut stickers**, the dashed line becomes a **stitch** for special items only.

| Keep | Evolve |
|---|---|
| Pink base, green brand | Full colour scale + one accent per section (from its artwork) |
| Green sticker headings | Die-cut stickers (white outline, slight tilt, shadow) |
| Dashed cards | Paper cards (cream, blur, soft shadow); stitch only on featured items |
| Full-screen art | Art gets gentle **scroll-linked movement** and a **scrim** behind the text side |
| Fredoka | Bigger type scale; optional handwritten accent for tiny doodles |
| Clovers, scallops | A consistent decoration system (tape, pins, scallops, sparkles) |

---

## 4. Design system v2

### 4.1 Colours

| Token | Value | Use |
|---|---|---|
| `pink-50/100/300/500/700` | `#fff5f8` `#ffe2eb` **`#fe9fb9`** `#ef5f8d` `#b8325f` | base, highlights, pink text (700 = AA) |
| `green-50/100/300/500/700/900` | `#f2f9ec` `#dcefcb` `#a3d37f` **`#63a23d`** `#2f7a1f` `#1f4f15` | stickers, buttons, headings (700 = AA) |
| `paper` | `#fffaf2` | cards (translucent + blur) |
| `ink` / `ink-soft` | `#2b3326` / `#56614f` | body / meta text |
| Section accents | Home lavender `#c9b6f4` · About sky `#bfe4ff` · News rose `#ffb3c7` · Discography peach `#ffd3b0` · Gallery mint `#c8ecd9` | tape, transition colours, scrollbars, small details |

All text pairs checked for WCAG AA.

### 4.2 Typography

| Role | Desktop → phone | Font |
|---|---|---|
| Section sticker heading | 28–44 → 24–30 px | Fredoka 700 |
| Card title | 18–22 → 17–19 px | Fredoka 600 / M PLUS Rounded 1c 800 |
| Body | 15–17 → 15–16 px, line-height 1.6 (JA 1.75) | Fredoka 500 / M PLUS Rounded 1c 500 |
| Meta | 13–14 px minimum | 600, `ink-soft` |
| *Doodle accent (trial)* | tiny notes ("new!", arrows) | handwritten Google Font, kept only if it looks better |

Body text = dark ink; green = headings, links, accents.

### 4.3 Shape, depth, surfaces

Spacing 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px; corners 12/20/28 px/pill; depth *paper → lifted → modal* with tinted shadows. Surfaces: **paper card** (cream ~88% + blur + soft shadow), **stitch** (inset dashed line, featured items only: next-stream ticket, latest video, profile card, "coming soon" — ≈4–6 per screen instead of 29–51), **sticker**, **washi tape**, **scrim**, light **paper grain**.

---

## 5. Motion concept: **MV-quality movement on a proper website**

What "MV-like" means here (only the *movement*):

- **Rhythm** — all timings come from one internal tempo (a "beat"), so things arrive in a pleasing, musical order instead of randomly. Visitors don't hear or see a beat; it just feels coordinated.
- **Camera feel** — the artworks move a little as you scroll (slow zoom/pan), like a camera gliding over an illustration.
- **Stylish transitions** — moving between sections uses a short, clean, colourful transition (a soft wipe or zoom), not a plain jump.
- **Snappy, springy arrivals** — stickers pop, notes get "taped", cards settle with a tiny bounce.
- **Restraint** — motion happens *around* the content; text is readable within a fraction of a second and never moves while you read it.

---

## 6. Section layouts (new compositions, normal website)

Desktop keeps "art full-screen + content on top", rearranged for balance and room for the character; phones are one column.

```
DESKTOP · Home                                  PHONE · Home
┌───────────────────────────────────────────┐   ┌──────────────┐
│ [LOGO sticker]  home about news disco gal │   │ [LOGO]  ☰    │
│ (x)(yt)(tw)(tc)                   JP|EN   │   │ (x)(yt)(tw)… │
│ ┌ticket: next stream┐   (character stays  │   │ ┌ticket────┐ │
│ └───────────────────┘    bright on this   │   │ └──────────┘ │
│ ┌polaroid─────┐ ┌note┐   side)            │   │ ┌polaroid──┐ │
│ │     ▶       │ ├note┤                    │   │ │   ▶      │ │
│ └─────────────┘ └────┘                    │   │ └──────────┘ │
│            scroll ⌄                       │   │ [note][note] │
└───────────────────────────────────────────┘   └──────────────┘
```

| Section | Desktop | Phone |
|---|---|---|
| Home | content in the left ~55% with a scrim, character right | logo → socials → ticket → polaroid → notes |
| About | profile card (avatar, name, facts grid) + bio note left; pose in clover frame right | card → bio → pose |
| News | notes column (scrolls inside) + latest-video polaroid + film strip of other videos | notes → polaroid → strip |
| Discography | release sleeves (designed covers when no video) + achievements timeline | sleeves 2-up → timeline |
| Gallery | full-width masonry (4–5 columns), small sticker heading | 2 columns |
| Footer | proper footer on a paper panel: Moesoft, disclaimer, contact, links, **artwork credits list** | stacked |
| Nav (after Home) | floating paper pill: logo · links · clover progress · JP/EN | logo · clover progress · menu |

**Credits:** "art by …" labels removed from all sections and the loader. Every artwork used on the site gets a **gallery entry with its credit** (missing today: About background, loader "pajamas" and "green cardigan" arts — artist unknown), and the footer keeps a tidy **artwork credits** list. Avatar + About pose → Q6.

---

## 7. Motion system

### 7.1 Timing tokens (from the internal beat: 128 BPM → 1 beat = 469 ms)

| Name | Duration | Feel | Used for |
|---|---|---|---|
| *tap* | ~120 ms | instant | press, toggles |
| *pop* | 230–470 ms | springy | stickers, badges, tiles |
| *transition* | 470–700 ms | quick in/out | section changes |
| *glide* | 700–940 ms | smooth | snap between sections, big panels |
| *drift* | 8–20 s loop | very slow | ambient decorations |

Only `transform` / `opacity` / `clip-path` are animated (smooth on phones).

### 7.2 Page "alive" while scrolling — both directions (new)

| Effect | What you'd notice | Up / down behaviour |
|---|---|---|
| **Parallax depth** | artwork moves slightly slower than the content; small decorations (clovers, sparkles) a bit faster | follows the scroll exactly both ways (like scrubbing) |
| **Art "camera"** | each artwork slowly zooms/pans a few % as its section passes by | reverses when you scroll back up |
| **Scroll-driven reveals** | cards, notes and stickers slide/fade in as they enter the screen, from the direction you're scrolling from | play when entering from below *or* above; content stays visible once shown (no disappearing while reading) |
| **Velocity touch** | when you scroll fast, cards lean very slightly (1–2°) and settle back when you stop | direction-aware (lean follows the scroll direction) |
| **Direction-aware nav** (phones) | the top bar tucks away while scrolling down, slides back when scrolling up | both |
| **Clover progress** | the clover in the nav fills as you move down the page, empties going up | both |
| **Heading stickers** | small rotate/scale settle as the section arrives | both |
| **Marquee ribbon** *(if chosen)* | runs slowly; speeds up with scroll and **reverses direction when you scroll up** | both |

All of this is subtle by default (Q4 sets the strength) and switches off in calm mode.

### 7.3 Section transitions (desktop snap)

During the glide to the next section: a short clean transition in the next section's accent colour (soft diagonal wipe or clover-shaped reveal), the artwork settles from a tiny zoom, the sticker heading pops, and the content arrives in rhythm. Scrolling back up plays the same transition in reverse direction. Strength → Q3.

### 7.4 Moments & micro-interactions

- **Loader:** see §7.4a.
- **Hover / tap:** buttons squish; cards lift (desktop: tiny tilt toward the cursor); latest-video polaroid gets a shine sweep + play-button pop; gallery tiles lift and the credit slides up; JP/EN highlight slides.
- **Gallery → lightbox:** the tapped artwork grows from its tile into the viewer (and back).
- **Mobile menu:** opens as a circle growing from the menu button; links drop in one by one.
- **Cursor sparkle trail** (desktop, subtle).
- **Ambient:** a few floating clovers, soft light glows (very slow, pause off-screen).
- **Special days** (June 10, July 8 JST): confetti (kept) + small themed decorations.

### 7.4a Loader v2 (requirement + proposal)

**Requirement (owner):** the **two overlapping clovers rotate continuously for as long as the loading screen is visible** — they are the loading indicator.

**Composition** — kept from your references, polished:

| | Desktop (your loadingscreen 1–3) | Phone (your mobile loading) |
|---|---|---|
| Artwork | one of the 3 loader artworks at random, full-screen | same, portrait crop |
| Logo | bottom-left, as a sticker | top |
| Spinner + "Loading…" | right-middle | centre |
| Moesoft line | bottom ("This is a fan-project made by: Moeko Software and Technologies") | bottom |
| Credit label | **removed** (art credited in the gallery + footer) | removed |
| Legibility | soft pink gradient at the bottom behind the text | same |

**Motion timeline**

| Phase | What happens |
|---|---|
| **Enter** (≈0.5 s) | pink veil lifts off the artwork; logo pops in as a sticker; the clover pair scales in |
| **Loading loop** (until ready, min 3 s as agreed) | **outer clover rotates clockwise (~1 turn / 4 s), inner clover counter-clockwise (~1 turn / 2.5 s)** + a soft "breathing" pulse on the beat · the inner clover's **4 petals fill with green one by one as assets load** (25% each — real progress) · "Loading…" letters bounce in a gentle wave (JA 「ロード中…」 per character) · artwork slowly pushes in (1.00 → 1.06) · a few tiny clovers/sparkles float up · optional **"Did you know?"** line with a real fact from the About info (fan name ことリス, fan mark 🍀, birthday June 10, stream days…) — Q L3 |
| **Ready → exit** (≈0.9 s) | clovers do one quick fast spin ("whoosh"), then the white clover **grows into a circular iris that opens onto Home**; logo and text slide away; Home content arrives in rhythm |
| **Calm mode** (reduced motion) | clovers keep rotating (it's the loading indicator) but slower; no push-in, particles or wave; simple fade exit |

Unchanged: tiers (min 3 s / soft 6 s / cap 10 s), CSS failsafe (never traps visitors), preloading, JP/EN.

### 7.5 Comfort & safety (non-negotiable)

- **No flashing** (never > 3 flashes/second).
- Device **reduced-motion** setting → calm mode (no parallax, camera, tilt, trails, particles; only short fades).
- **"Motion ✿ on/off" toggle** (needed for accessibility when things loop/move automatically) — Q9.
- Animations pause off-screen / in hidden tabs; nothing blocks reading or tapping.

### 7.6 Scrolling (recommendation, confirm in Q7)

- **Desktop:** keep snap + glide (it gives the transitions their moment).
- **Phones:** **free natural scrolling** with the scroll effects above. Snap on touch fights the phone's momentum, long lists are awkward when snapped, and it removes most risk from the pending real-phone test.

### 7.7 Libraries

| Library | Plan |
|---|---|
| **GSAP 3.13** + ScrollTrigger, SplitText, Flip | One engine for everything (plugins now free) |
| **Lenis** | Desktop smooth scroll + snap (phones native) |
| canvas-confetti, Lucide | Keep |
| Anime.js, Animate.css | Removed (~90 KB less) |
| WebGL (liquid/ripple effects) | **Not recommended any more** — too "video" for a proper website, heavier (Q5) |

All CDN files pinned + SRI + allowed by the CSP.

---

## 8. Optional extras (owner picks in Q8)

| # | Extra | Data |
|---|---|---|
| a | **Marquee ribbon** between sections ("KOTOHA ✿ ことは ✿ HaKoniwalily ✿ HoneyWorks ✿ …"), reacts to scroll speed/direction | decorative |
| b | **"Coming soon" card** with countdown for future-dated releases (e.g. the 2026-10-07 tie-in in the database) | real |
| c | **Mascot cameo**: the mascot peeks from an edge in a couple of sections, reacts on hover/tap | existing art |
| d | **LIVE badge** on the stream ticket during stream hours | real (schedule) |
| e | **Scroll-progress clover** in the nav | — |
| f | **Special-day themes** (birthday/debut decorations with the confetti) | real (dates) |
| g | **"Fan art of the moment"** on Home: one gallery artwork (with credit), changes per visit | real (gallery) |
| h | **Short opening title card** after the loader (KOTOHA letters pop in, ~2 s, skippable) | decorative |
| i | **Easter egg**: tap the logo 5× → clover rain | decorative |

No invented facts or numbers.

---

## 9. Technical approach

- **No build step.** CSS in ordered layers: `tokens` → `base` → `components` → `sections` → `motion`.
- **JS modules:** `motion/beat.js` (timings), `motion/scroll-life.js` (parallax, camera, reveals, velocity, nav, progress), `motion/transitions.js` (section transitions), `motion/moments.js` (loader exit, lightbox, menu, cursor trail, ambient, motion toggle); `fx.js` retired; loader/scroll logic kept (phones native scroll).
- **HTML:** restructured per section; all `data-track` analytics attributes, i18n keys, ARIA and CSP rules kept; `art-credit` labels removed.
- **Data:** gallery seed extended with the missing artworks (shared database, same script).
- **Checks per phase:** screenshot matrix (1366, 1920, 768, 360/390; JP/EN), before/after sheets, CSP/SRI, calm mode + toggle, contrast, frame-rate trace (60 fps desktop, ≥ 50 fps mid-range phone), scroll up/down behaviour, no-flash.

Review: screenshots in chat + protected Vercel preview of `designupdatev2`. Nothing reaches the live site before you approve the merge.

---

## 10. Phases

*Execution order and checkpoints: see §15.3 (D6 Loader v2 runs right after D2).*

| Phase | Work | You check |
|---|---|---|
| D0 | Plan + answers | approve |
| **D1** | **Style tile + motion sample**: one stand-alone page with the look (colours, type, cards, sticker, tape, stitch) and a short scrolling demo (parallax, reveals both directions, one section transition) | **adjust look + motion strength** (cheap to change here) |
| D2 | Foundations (tokens, type, surfaces, CSS layers, credit labels removed) | screenshots |
| D3 | Components (ticket, polaroid, notes, profile card, sleeves, timeline, masonry, nav, footer) | screenshots |
| D4 | Sections — desktop | preview link |
| D5 | Phones/tablet + native scroll on phones + mobile menu | preview on your phone (replaces the pending swipe test) |
| D6 | Loader v2 (§7.4a): rotating clover pair, petal progress, wave text, iris exit | preview |
| D7 | Motion: scroll life, transitions, micro-interactions, cursor trail, toggle, calm mode | **preview review** |
| D8 | Chosen extras + gallery seed update | preview |
| D9 | QA: contrast, keyboard, screen reader, calm mode, performance, CSP/SRI, JP line breaks | final review |
| D10 | Merge `designupdatev2` → `main` → production | **your go-ahead** |

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Motion distracts from reading | Content settles fast and stays still; effects on art/decoration layers; strength chosen by you (Q4) |
| Heavy on phones | transform/opacity only, fewer effects on small screens, pause off-screen, frame-rate checks |
| Motion sickness | Small movements, no flashing, calm mode, motion toggle |
| Not the feel you imagined | D1 motion sample before the big build |
| Big rewrite | Phased, screenshots each step, `main` untouched until merge |

---

## 12. Round 2.2 questions — **answered 2026-09-26: "all recommended"**

Resulting decisions: L1 counter-rotating clovers · L2 petal progress · L3 "Did you know?" line · L4 fix rotation on `main` now (**done**, `c58bfbc`, verified on production) · 1 no specific MV (bouncy, clean, colourful) · 2 clover iris into Home, no title card · 3 short stylish colour wipe · 4 subtle scroll effects · 5 no WebGL · 6 avatar + pose also in the gallery · 7 free scrolling on phones, snap on desktop · 8 extras a–g · 9 motion toggle.

<details><summary>Original questions (for reference)</summary>

*Everything still open, in one place. Reply **"all recommended"** and only mention the ones you want different.*

**Loader**

- **L1 · Clover rotation style:** **(a) outer clockwise slow + inner counter-clockwise faster** (recommended — looks like little gears, lively) · (b) both turn together the same way · (c) same direction, different speeds.
- **L2 · Show loading progress:** **(a) inner clover's petals fill green one by one while rotating** (recommended) · (b) rotation only · (c) also a small % number.
- **L3 · "Did you know?" line** under Loading… with a random real fact from the About info: **(a) yes** (recommended) · (b) no.
- **L4 · Fix the non-rotating clover on the live site now** (tiny change on `main`, ahead of v2): **(a) yes** (recommended) · (b) wait for v2.

**Motion & layout**

1. **MV reference (optional):** an MV whose *movement* you like? Otherwise: bouncy, clean, colourful.
2. **After the loader:** **(a) straight into Home through the clover iris** (recommended) · (b) add a short KOTOHA title card.
3. **Section transitions on desktop:** (a) simple fade · **(b) short stylish colour wipe + content arriving in rhythm** (recommended) · (c) bolder.
4. **Scroll "alive" strength (§7.2):** **(a) subtle** (recommended) · (b) medium · (c) strong.
5. **WebGL effects:** **(a) no** (recommended) · (b) yes.
6. **Credits:** also add the profile avatar and the About pose to the gallery (every image credited in one place)? **(a) yes** (recommended) · (b) backgrounds only.
7. **Phones:** free natural scrolling, desktop keeps snap? **(a) yes** (recommended) · (b) keep snap on phones.
8. **Extras (§8):** **(a) a–g** (recommended) · (b) all · (c) your own pick of letters.
9. **Motion toggle** ("motion ✿ on/off", small, nav + footer): **(a) yes** (recommended) · (b) no.

</details>

---

## 13. Confidence

- **Clarity: 90%.** Every question is answered; the remaining 10% is taste (exact colours, sizes, motion feel), which the D1 style tile + motion sample settles before the big build.
- **Technical: 91%.** All planned effects are standard GSAP/CSS with fallbacks; the main risks (phone frame rate, the iris mask in older browsers) have measured checks and fallbacks (§15).

---

## 14. Resume protocol & progress

1. `git checkout designupdatev2` — confirm with `git branch --show-current`.
2. Read this file, then `docs/PROGRESS.md` §1 (hard rules: secret scan before every commit, no secrets in files, commit author/trailer, never force-push, SRI/CSP on CDN files).
3. Continue from the first unchecked box. Commit + push after each verified step (push = protected Vercel preview only). **Never merge into `main` without the owner's approval.**

- [x] D0.1 Branch `designupdatev2` from `main` @ `eef577f`
- [x] D0.2 Audit + plan v0.1
- [x] D0.3 Round 1 answers → plan v0.2
- [x] D0.3a Owner clarification ("proper website, MV-like movement, alive on scroll") → plan v0.2.1
- [x] D0.3b Loader requirement (rotating clover pair) + loader v2 proposal → plan v0.2.2
- [x] D0.4 Round 2.2 answers (all recommended) → plan v0.3 with execution plan (§15)
- [x] L4 Loader clover rotation fixed on `main` (`c58bfbc`), verified on production; merged into this branch
- [x] D0.5 Owner go-ahead ("execute the plan", 2026-09-27); E1–E3 → recommended options
- [x] D1 Style tile + motion sample — `public/design-v2/` (page) + real v2 system: `public/css/v2/*`, `public/js/motion-boot.js`, `public/js/public/motion/*`; documented in `docs/DESIGN_SYSTEM.md`
- [x] ✋1 round 1 — owner feedback (2026-09-28): "too many empty spaces", "feels incomplete / bland like Western minimalism", "Japanese sites are dense with info + visuals", "clover insides must not be hollow", "avoid empty areas especially Home"; question about snapping
- [x] D1.1 Density pass on the style tile (see §16) — illustrated filled clovers (sprite), JP-site vocabulary, Home filled on both sides, crossfading artwork backdrop
- [x] ✋1 round 2 — owner replied "start applying the update" (2026-10-02) → recommended defaults kept (the five D1.1 questions were not answered one by one)
- [x] D2 Foundations (+ credit labels removed) — built together with D3/D4/D6 (see §16 · 2026-10-02)
- [x] D3 Components — real site uses the v2 components with live data + i18n
- [x] D4 Sections (desktop) — built and merged; **✋2 owner review of the live site is next**
- [ ] D5 Phones/tablet + native scroll + mobile menu
- [x] D6 Loader v2 (rotating clover pair, petal progress, iris exit)
- [ ] D7 Motion system
- [ ] D8 Extras + gallery seed update
- [ ] D9 QA
- [x] D10 Merge to `main` — done **early** on 2026-10-02 with the owner's explicit go-ahead (`c7b6975`); `/design-v2/` deleted first. D5/D7/D8/D9 continue after the merge
- [ ] D10b Verify the production deploy (unconfirmed: the Vercel status call was blocked) · ✋2 owner review of the live desktop design

### Decision log

| Date | Decision | By |
|---|---|---|
| 2026-09-26 | Design work on branch `designupdatev2`; plan first, no code until approval | Owner |
| 2026-09-26 | Direction: Clover Scrapbook | Owner |
| 2026-09-26 | Admin panel keeps its current look | Owner |
| 2026-09-26 | Full layout freedom + additions allowed | Owner |
| 2026-09-26 | Desktop cursor sparkle trail: yes | Owner |
| 2026-09-26 | Libraries, dashed usage, section accents, badge copy delegated (GSAP 3.13, drop Anime.js/Animate.css, stitch on featured items, "Latest"/「最新」) | Owner → Claude |
| 2026-09-26 | Fredoka stays the main font; accent font allowed if it helps | Owner |
| 2026-09-26 | Remove "art by …" labels from the artworks; credit them in the gallery | Owner |
| 2026-09-26 | Cloudinary key/secret in Vercel: loose end on `main`, owner will handle | Owner |
| 2026-09-26 | **Clarified: proper website; "MV-like" = quality of movement only; page should feel alive when scrolling up and down.** v0.2 "page is an MV" concept (title card, end card, giant words) dropped as default | Owner |
| 2026-09-26 | **Loader: the two overlapping clovers must rotate continuously while the loader is visible** (v1 had them static — Claude's miss); loader redesign delegated to Claude (§7.4a) | Owner |
| 2026-09-26 | Round 2.2: **all recommended** (see §12); "start planning the execution" → §15 | Owner |
| 2026-09-26 | L4 done on `main`: clovers rotate (outer CW 4 s, inner CCW 2.5 s; reduced motion 12 s / 8 s) | Claude |
| 2026-09-27 | **"Execute the plan"** — E1 style tile at `/design-v2/` on the preview only · E2 gallery additions during D2 · E3 continue between checkpoints (recommended options) | Owner |
| 2026-09-27 | GSAP pinned to **3.15.0** (latest; plan said 3.13+) from jsdelivr with SRI (hashes verified against served bytes) | Claude |
| 2026-09-27 | Scroll reveals / art camera / parallax use **native CSS scroll-driven animations** (progressive enhancement, per the modern-web guidance) instead of ScrollTrigger; GSAP is for choreography (letters, section entrances), velocity lean is a tiny rAF module | Claude |
| 2026-09-27 | Lightbox: native `<dialog>` with `@starting-style` open/close; artwork grows from its tile via View Transitions where supported | Claude |
| 2026-09-28 | **Owner feedback on D1:** avoid minimalism/empty areas (esp. Home); creative-heavy JP-style density; clovers never hollow | Owner |
| 2026-09-28 | Snapping: **desktop keeps strict snap** (one section per screen, glide + wipe hides the art change); **phones: free scroll with a crossfading fixed artwork backdrop** so there's never a hard art edge (owner to confirm after trying) | Claude (answer to owner's question) |
| 2026-09-28 | Clover icons are an illustrated SVG sprite (`/assets/svg/v2-sprite.svg`); CSS-mask flat clovers removed from components | Claude |
| 2026-10-02 | **"Start applying the update"** → real public page rebuilt on v2 (D2+D3+D4+D6 together) on the branch | Owner |
| 2026-10-02 | **"Apply the changes to the vercel main domain"** → `designupdatev2` merged into `main` (`c7b6975`), style tile deleted first | Owner |
| 2026-10-02 | Desktop-only strict snap (mouse + full motion); phones/tablets/calm = native free scroll (answer to the snapping question, now live) | Claude |
| 2026-10-02 | Short laptops (≥1100 px wide, ≤960 px tall): Home keeps brand/socials/ticket/week + news + video and hides the 2nd note, coming-soon and fan-art cards | Claude |

---

## 15. Execution plan

### 15.1 What changes where

| Area | New | Changed | Removed (by the end) |
|---|---|---|---|
| **CSS** | `public/css/v2/` — `tokens.css` (declares the layer order), `base.css`, `components.css`, `sections.css`, `motion.css` | `site.css` wrapped in a lowest-priority `legacy` layer during the migration, emptied section by section | `site.css` (after D4) |
| **JS** | `public/js/public/motion/`: `beat.js` (tempo + timing tokens), `prefs.js` (motion toggle + reduced motion), `scroll-life.js` (parallax, art camera, reveals, velocity lean, clover progress, nav tuck), `transitions.js` (desktop section wipes), `moments.js` (lightbox grow, menu reveal, cursor sparkles, ambient, special days) | `scroll.js` (snap on desktop only, native scroll on touch; emits "section change" events), `loader.js` (v2 + real progress), `render.js` / `gallery.js` / `main.js` (new components) | `fx.js`, all Anime.js / Animate.css usage on the public page |
| **HTML** | inline SVG clover pair (4 separate petals) for the loader; motion toggle; marquee; mascot cameo; "coming soon"; footer credits list | `index.html` restructured per section (IDs, `data-section`, `data-track`, i18n keys, ARIA kept) | `.art-credit` labels + loader credit; credits dialog (replaced by the footer list) |
| **Libraries** | GSAP **3.15.0** + ScrollTrigger, SplitText, Flip, CustomEase (jsdelivr, pinned + SRI) | Lenis kept (desktop only) | Anime.js + Animate.css from the public page (the admin keeps Animate.css — its look stays as is) |
| **Assets** | mascot "peek" crops (generated by `optimize-images.js` from the existing mascot sheet); paper grain + decoration SVGs inline (no new downloads) | — | — |
| **Text** | new EN/JA keys (loader facts label, motion toggle, "coming soon", LIVE, "fan art of the moment", credits heading, "Latest"/「最新」) → Japanese added to `JA_REVIEW_LIST.md` | — | — |
| **Data** | `seed-gallery.js`: + About background, loader "pajamas" + "green cardigan" arts, profile avatar, About pose (all credited; unknown artist → "Artist unknown (作者不明)") | — | — |
| **Unchanged** | API, database schema, admin panel, analytics (`data-track`), CSP rules (only new SRI hashes), i18n system | | |

### 15.2 Phases in detail

**D1 · Style tile + motion sample** — stand-alone page `public/design-v2/` (not linked, `noindex`, deleted before the merge)
- Look: colour scale + section accents, type scale EN/JA, paper card, sticker heading, washi tape, stitch "ticket", polaroid, news note, profile card sample, sleeve cover placeholder, buttons/chips, JP/EN sliding pill, doodle-font trial (kept only if it looks better).
- Motion sample: loader spinner (counter-rotating clovers + petal progress + iris exit); a 3-block scroll demo with parallax, reveals from both directions, velocity lean and one desktop section wipe; hover/tap micro-interactions; calm mode + motion toggle.
- ✔ Done when: renders at 1366 and 390, 0 CSP errors, reduced motion works → **checkpoint ✋1: you adjust the look and the motion strength here.**

**D2 · Foundations**
- Layered CSS + tokens; typography + paper surfaces applied site-wide (layout still the old one); `site.css` → `legacy` layer.
- Remove "art by" labels + loader credit; "Most latest" → "Latest"/「最新」.
- GSAP 3.15 swap (+ SRI); replace the Anime.js/Animate.css effects with GSAP/CSS.
- Gallery seed additions (5 artworks, credited) — timing per §15.8 E2.
- ✔ Done when: every existing function still works (admin, tracker, gallery, i18n tests), no text under 13 px, CSP/SRI clean.

**D6 · Loader v2** (§7.4a; moved up right after D2 because it only needs the tokens) — inline SVG clovers (CSS rotation keeps turning even while scripts load), petals fill from real loading progress, wave "Loading…", "Did you know?" facts from the About data, iris exit into Home (plain-fade fallback for older browsers), calm mode. Tiers (3 s / 6 s / 10 s) + 12 s failsafe unchanged.
- ✔ Done when: rotation verified (spin check), all 4 petals fill, exit ≤ 1 s, failsafe still works with scripts blocked.

**D3 · Components** — ticket (countdown + LIVE), polaroid, news note, film strip, profile card + facts grid, sleeves (+ designed placeholder covers), achievements timeline, masonry tile, lightbox, floating nav pill + clover progress, JP/EN pill, buttons/chips, footer (credits list, Moesoft, disclaimer, contact), empty/error notes, scrollbars.
- ✔ Done when: each component renders with real data in EN/JA; contrast AA; ≤ 6 stitched (dashed) items per screen.

**D4 · Sections — desktop (1024–1920 px)** — new compositions (§6), scrims, section accents.
- ✔ Done when: screenshot matrix clean (no overflow/overlap), character art visible → **checkpoint ✋2: preview link review.**

**D5 · Phones + tablet** — native scroll on touch devices, one-column compositions, direction-aware top bar, mobile menu circle reveal, landscape phones.
- ✔ Done when: 360/390/768/800×360 matrix clean, no sideways scrolling → **checkpoint ✋3: you try it on your phone** (replaces the pending swipe test).

**D7 · Motion system** — beat timings, scroll life (§7.2), desktop section transitions synced with the snap glide (reverse direction when scrolling up), micro-interactions, lightbox grow (View Transitions → GSAP Flip fallback), cursor sparkles, ambient clovers, motion toggle + calm mode.
- ✔ Done when: ≥ 55 fps desktop and ≥ 50 fps with 4× CPU slowdown on a phone-sized screen; no layout shifts; toggle/calm mode stop every loop; no flashing → **checkpoint ✋4: motion review on the preview link.**

**D8 · Extras a–g** — marquee (reacts to scroll speed/direction), "coming soon" countdown (future-dated discography), mascot cameo, LIVE badge, clover progress, special-day decorations, "fan art of the moment".
- ✔ Done when: each uses real data or is purely decorative, and respects calm mode.

**D9 · QA** — keyboard path + visible focus, screen-reader labels, contrast, calm mode, JP line breaks (`word-break: auto-phrase`), performance, CSP/SRI, analytics events still fire (tracker test), admin unaffected (admin tests), Edge/Chrome + your devices.

**D10 · Merge** — your go-ahead → delete the style tile → merge `designupdatev2` into `main` → production checks (screens, loader spin, gallery, CSP) → update `docs/PROGRESS.md`.

### 15.3 Order & checkpoints

```
D1 ─▶ ✋1 ─▶ D2 ─▶ D6 ─▶ D3 ─▶ D4 ─▶ ✋2 ─▶ D5 ─▶ ✋3 ─▶ D7 ─▶ ✋4 ─▶ D8 ─▶ D9 ─▶ ✋ merge (D10)
```
✋ = I stop and wait for your review.

### 15.4 How each step is verified (tools built during v1, extended)

| Check | Tool |
|---|---|
| Screens at 1366, 1920, 1024, 768, 390, 360, 800×360; JP + EN; before/after sheets | headless Edge screenshot scripts |
| Text sizes, dashed-border count, surfaces, contrast pairs | audit script (+ a contrast sampler) |
| CSP violations + SRI integrity | CSP check script |
| Loader rotation (normal + reduced motion) | spin check |
| Frame rate while scrolling (normal + 4× CPU slowdown) | new fps check (scroll automation + frame counting) |
| Calm mode / motion toggle | reduced-motion emulation + toggle test |
| Nothing else broke | admin UI test, gallery test, tracker test, public-page smoke test |

### 15.5 Budgets

- Own CSS ≤ 70 KB, own JS added ≤ 35 KB (unminified, no build step).
- Third-party: GSAP core + 4 plugins ≈ 155 KB vs today's GSAP + ScrollTrigger + Anime.js + Animate.css ≈ 205 KB → **lighter overall**.
- Frame rate: ≥ 55 fps desktop, ≥ 50 fps slowed-down phone emulation; animations only on transform/opacity/clip-path.

### 15.6 Safety net

- `main` (the live site) is untouched until the merge; every push to `designupdatev2` only creates a protected preview.
- After the merge, if anything is wrong: instant rollback to the previous Vercel deployment + `git revert` of the merge commit.
- Commit + push after every verified task; this checklist is updated each time (cut-off safe).
- Hard rules unchanged: secret scan before every commit, no secrets in files, commit author/trailer, never force-push.

### 15.7 What I need from you during execution

Only the 4 checkpoint reviews (✋1–✋4) and the merge go-ahead. Between checkpoints I continue on my own.

### 15.8 Last execution questions (my recommendation first — reply "go" to accept all)

- **E1 · Style tile location:** a stand-alone page at `/design-v2/` on the **preview link only**, deleted before the merge. **(a) OK** (recommended) · (b) other.
- **E2 · Gallery additions timing:** add the 5 extra artworks (About background, 2 loader arts, avatar, pose — all credited) **(a) during D2, which makes them visible in the live gallery right away** (shared database; harmless — it only adds credited entries; recommended) · (b) only at the merge.
- **E3 · Working rhythm:** **(a) I continue on my own between checkpoints and only stop at ✋1–✋4 + the merge** (recommended) · (b) stop after every phase.

---

## 16. Work log

### 2026-09-27 · D1 style tile + motion sample (done)
- **Design system files (real, reused in D2+):** `public/css/v2/tokens.css` (layer order, tokens, `@property --iris/--fill`), `base.css`, `components.css`, `sections.css`, `motion.css`; `public/js/motion-boot.js`; `public/js/public/motion/` → `prefs.js`, `beat.js`, `scroll-life.js`, `marquee.js`, `sparkles.js`, `wipe.js`, `spinner.js`, `text.js`.
- **Style tile page:** `public/design-v2/index.html` + `tile.css` + `tile.js` — real data (news, videos, releases incl. "coming soon" for the 2026-10-07 tie-in, achievements, gallery, About facts EN/JA), previews of Home/About/News/Discography/Gallery pieces over their artworks, the new loader, a section-change stage, and a footer sample.
- **Verified (headless Edge):** 0 CSP violations, 0 exceptions, no sideways scroll at 1366 and 390; spinner outer CW 4 s / inner CCW 2.5 s (calm 12 s / 8 s); native scroll-driven reveal + camera active; lean rises to ~2° while scrolling fast and settles to 0; wipe down/up swaps scenes; iris opens (`--iris` → 2049 px); petals refill on replay; lightbox opens with credit and closes; motion toggle → calm + remembered; device reduced motion → calm + toggle disabled.
- **Fixes during D1:** type-specimen selector hit the sticker; phone nav wrapped (motion toggle icon-only < 600 px); Home notes too narrow; About clover frame too faint + pose too small; phone gallery 1 column → 2; hero now counts as Home for the nav dot.
- **Next:** ✋1 owner review → adjustments → D2 foundations.

### 2026-09-28 · D1.1 density pass (after ✋1 feedback)
- **Clovers:** new `public/assets/svg/v2-sprite.svg` — `#cl-leaf` (4 heart leaves, inner leaf, veins, gloss, stem, white die-cut edge), `#cl-round` (filled brand clover), `#spark`, `#heart`; colour variants `.cl--pink/gold/mint/sky/lav/white`. All flat CSS-mask clovers replaced (sticker, pins, timeline, nav dot, toggle, meter, sleeve watermark, cursor sparkles). Loader spinner: both clovers filled (no hollow outline).
- **Density:** numbered EN/JA section titles, giant outlined background words, vertical JA text, rotating badge, bubbles, PICK UP/NEW stamps, grid/lined/lace paper, gingham boards, weekly stream strip, social badges, "coming soon" (Home mini + Discography wide with days-to-go), fan art of the moment, hashtag chips, 2-column news, 2-column sleeves, 5-column gallery, 4-column footer with official links + credits.
- **Home:** content on both sides of the character (left: logo, unit chips, socials, ticket, week, latest video; right: latest news ×2, coming soon, fan art), decorations around the character, badge + scroll cue; no text over the face.
- **Artwork changes:** fixed crossfading backdrop (`motion/backdrop.js`) — no hard edges between section artworks.
- **Bug found:** the sprite didn't render at first — XML comments may not contain double hyphens (`--c1`); fixed + documented.
- **Verified:** 0 CSP violations, 0 exceptions, no sideways scroll at 1366 and 390; all content renders.

### 2026-10-02 · D2 + D3 + D4 + D6 — the real public page now runs on design v2 (branch only)
Owner asked to "start applying the update": the style tile's compositions became the real site on `designupdatev2` (nothing is on `main`/production; the merge stays a separate go-ahead).
- **Page:** `public/index.html` rebuilt (floating nav pill, fixed crossfading backdrop, Home / About / News / Discography / Gallery scenes, footer, lightbox, mobile menu, static loader markup). IDs, `data-section`, `data-track*`, i18n keys and ARIA kept; "art by" labels, the loader credit and the credits dialog are gone (artists are credited on gallery tiles + in the viewer + in the footer list).
- **CSS:** `public/css/v2/layout.css` (new: nav, scenes, Home/About/News/Discography/Gallery compositions, loader, footer, menu, short-laptop rules). Legacy `public/css/site.css` deleted. `[hidden]` now always hides (base.css). JA line-height is applied to text blocks, not to every element (it was stretching display titles in Japanese).
- **JS:** `main.js` (boot, nav, menu, credits), `render.js` (v2 builders), `lists.js` (render may return several nodes; horizontal lists), `gallery.js` (JS masonry, 2–5 columns, lightbox grows from its tile via View Transitions), `home.js` (week strip, coming-soon cards, fan art, NEW logic), `countdown.js` (flip-digit ticket), `loader.js` (petal progress from real task progress, wave text, "Did you know?" facts, iris-open exit), `scroll.js` (Lenis + strict snap **only for a desktop mouse in full-motion mode**; phones/tablets/calm mode scroll natively), `fx.js` (confetti kept; Anime.js removed; GSAP home intro + title letters). `scrollbars.js` deleted (native thin scrollbars).
- **Libraries (public page):** GSAP 3.15.0 + SplitText + Lenis 1.1.18 + canvas-confetti (all SRI-pinned). Removed from the public page: GSAP 3.12.5, ScrollTrigger, Anime.js, Animate.css (login/admin keep Animate.css; `prepaint.js` loads it only when `html[data-site]` is not `public`).
- **Loader:** the artwork is a pure-CSS background keyed by `html[data-loader-art]` (starts downloading with the stylesheet); the two clovers are static inline SVG so they turn before any script; failsafe fade at 12 s unchanged.
- **Home on short laptops (≤ 960 px tall):** keeps brand, socials, ticket, week | news + video; the second note, coming-soon and fan-art cards are hidden there (they live in the sections below). At taller screens everything shows.
- **Verified (headless Edge, dev server):** 0 CSP violations, 0 exceptions, no horizontal overflow (1366, 1920, 390); loader clovers turn (also with reduced motion), petals light with progress, loader exits; wheel snap Home→About→Home; nav/anchor glide; backdrop crossfade per section; EN↔JA switch (nav, facts, lists, week, credits); video click-to-load + film strip; gallery lightbox (arrows, Escape, scroll unlock); footer credits; motion toggle + Lenis stop/start; analytics beacons (page_view, loader_timing, section_dwell, gallery_open, video_play, language_switch); deep link `#discography`; phone menu circle reveal; reduced motion.
- **Not yet done:** D5 phone/tablet polish (works, not designed yet), D7 section wipe on snap + deeper motion, D8 extras (mascot cameo, special-day decoration, LIVE badge on nav), gallery seed additions (5 extra credited artworks), D9 QA (contrast sampler, fps, screen reader pass), delete `/design-v2/` before the merge.

### 2026-10-02 · Merged to `main` (D10, early) + docs refresh
- Removed the preview-only `/design-v2/` page (`2c8f181`), merged `designupdatev2` into `main` with `--no-ff` (`c7b6975`) and pushed → production deploy triggered. (A first merge command failed on a bad flag and changed nothing; the push right after only re-sent the unchanged `main`.)
- **Unverified:** the production deployment status — Vercel's list-deployments call was blocked by the permission classifier and was not worked around. Next session: hard-refresh kotoha-fansite.vercel.app and run the headless-Edge checks against it (`BASE=https://kotoha-fansite.vercel.app`).
- `MIGRATION.md` (repo root, `ab773d3`) holds the full handoff; `docs/PROGRESS.md`, this plan, `docs/DESIGN_SYSTEM.md`, `docs/JA_REVIEW_LIST.md`, `README.md` and `docs/IMPLEMENTATION_PLAN.md` were refreshed.
- **Still to do:** D5 phones/tablet design (✋3), D7 motion (wire `wipe.js` to the snap; fps checks; ✋4), D8 extras + 5 gallery artworks, D9 QA, owner review of the desktop design (✋2).
