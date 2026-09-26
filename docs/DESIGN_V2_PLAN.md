# Kotoha Fan Site — Design Update v2 (visuals + motion)

| | |
|---|---|
| **Status** | **Draft v0.2.2 — round 1 answered + clarified; loader requirements added; consolidated round 2.2 questions open (§12). NO CODE on this branch until the owner approves.** |
| **Branch** | `designupdatev2` (created from `main` @ `eef577f`) |
| **Scope** | How the public site looks and moves. Content, database, API, admin panel, analytics, i18n and security stay as they are |
| **Clarity** | **88%** (v0.2.1: 87%) — loader requirements are now explicit; open points are *how much* motion and the loader details (§12) |
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

## 12. Round 2.2 questions — consolidated (my recommendation first)

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

---

## 13. Confidence

- **Clarity: 88%.** Confirmed: proper website, MV-quality movement, alive on scroll, rotating clover loader. Q3/Q4 and L1–L2 set strength and loader details; the D1 sample lets you feel it before the big build.
- **Technical: 91%.** All planned effects are standard GSAP/CSS with fallbacks; phone performance is checked every phase.

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
- [ ] D0.4 Round 2.2 answers → plan v0.3 → owner approval
- [ ] D1 Style tile + motion sample
- [ ] D2 Foundations (+ credit labels removed)
- [ ] D3 Components
- [ ] D4 Sections (desktop)
- [ ] D5 Phones/tablet + native scroll + mobile menu
- [ ] D6 Loader v2 (rotating clover pair, petal progress, iris exit)
- [ ] D7 Motion system
- [ ] D8 Extras + gallery seed update
- [ ] D9 QA
- [ ] D10 Merge to `main` (owner go-ahead)

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
