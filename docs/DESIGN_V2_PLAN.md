# Kotoha Fan Site — Design Update v2 (visuals + motion)

| | |
|---|---|
| **Status** | **Draft v0.1 — waiting for the owner's answers and approval. NO CODE on this branch until approved.** |
| **Branch** | `designupdatev2` (created from `main` @ `eef577f`) |
| **Scope** | How the public site looks and moves. Content, database, API, admin features, analytics, i18n and security stay as they are |
| **Clarity (my confidence I understand what you want)** | **78%** — the open questions in §11 decide the rest |
| **Resume file** | This file (§13 has the checklist). `docs/PROGRESS.md` on `main` stays the source of truth for everything that is not design |

---

## 1. Goal

Make the site **look like a polished, hand-made fan project** instead of a working prototype — while staying clearly *your* design: pink `#fe9fb9` base, green sticker headings, fan-art backgrounds with credits, dashed "stitched" cards, clovers, Fredoka. Then give it **motion that feels cute and alive** without getting in the way of reading.

**Not changing:** sections and their order (Loader → Home → About → News → Discography → Gallery → Footer), what data is shown, the snap-scrolling behaviour, JP/EN, the admin panel's features, the API, the database.

---

## 2. Honest audit of the current UI (measured, not guessed)

Screenshots of your references and the current site were compared at 1366×768 (desktop) and 360×800 (phone).

### 2.1 What already works (keep)

- The **art-first composition** from your references: each section is framed by a full-screen fan artwork with its credit top-right.
- **Identity pieces:** Kotoha logo, green sticker headings on translucent banners, pink nav words, scalloped divider, clover shapes, Fredoka.
- **Structure:** hero header only on Home, compact bar elsewhere, strict snap, JP/EN everywhere.

### 2.2 What looks rough (fix)

| # | Problem | Evidence | Why it looks "rough" |
|---|---|---|---|
| A1 | **Text is too small** | Desktop body text 11.6–13.7 px; on phones **146 of 267** text elements are under 12 px | Feels cramped and "prototype"; hard to read on phones |
| A2 | **Dashed borders everywhere** | **29** visible dashed boxes at once on desktop, **51** on phones | The dashed style is your signature, but used on *everything* it becomes noise, not a highlight |
| A3 | **Cards fight the artwork** | Cards are flat 74% white, no blur, no shadow | Busy art shows through the text; cards look like stickers of the same weight as the background |
| A4 | **No visual hierarchy** | Headline, body and meta text differ only slightly in size/weight; everything is green bold | The eye doesn't know where to look first |
| A5 | **Inconsistent spacing** | Gaps between cards, banners and edges vary per section | Layout feels "placed by hand" rather than designed |
| A6 | **About section is crowded** | Profile "pills" are a column of tiny dashed boxes; bio is small green bold text on the art | Most important personal info is the hardest to read |
| A7 | **Discography looks empty** | Releases without a YouTube video show a big clover placeholder | Looks unfinished |
| A8 | **Gallery is squeezed** | Masonry sits in a narrow panel (2 small columns) under a huge banner | The actual artworks — the point of the section — are tiny |
| A9 | **Footer is generic** | Plain pink-white block with default-looking columns | Doesn't match the charm of the rest |
| A10 | **Motion is basic** | Fade/slide-ins, a clover bloom on the loader, a little bounce | Fine, but nothing that feels special or "Kotoha" |
| A11 | **Copy nit** | Video badge says "Most latest" (placeholder text from the reference) | → "Latest" / 「最新」 |

---

## 3. Design direction: **"Clover Scrapbook"** (recommended)

Think of the site as **Kotoha's fan scrapbook**: artworks are the photos, content lives on **paper notes** taped onto them, headings are **die-cut stickers**, and the dashed line becomes a **stitch** used only on the special items. It is a direct evolution of your references (they already had stickers + dashed cards), just more refined and consistent.

| Keep from your design | Change |
|---|---|
| Pink `#fe9fb9` page base, green brand | Add a proper **colour scale** (light→dark) + one soft accent per section taken from its artwork |
| Green sticker headings | Real **die-cut sticker** look: white outline, slight tilt, soft shadow |
| Dashed cards | **Paper cards** (cream, soft blur, shadow). Dashed "stitch" only on featured items (latest video, next stream, profile card) |
| Full-screen artwork per section | Artwork gets a **soft gradient "scrim"** only behind the text side, so the character stays bright on the other side |
| Fredoka / M PLUS Rounded 1c | Bigger, clearer **type scale** (body never under 14 px, 15–16 px normal) |
| Clovers, scallops | Used as **decoration system** (washi-tape strips, clover pins, scallop edges) — consistent, not random |

*Alternatives, if you prefer:* **"Soft Glass"** (cleaner, frosted panels, fewer craft details — more "modern app") or **"Pixel Cute"** (leans into the pixel frame of the Home art — retro game menus). I recommend Clover Scrapbook because it is closest to your references and to Kotoha's image.

---

## 4. Design system v2 (the building blocks)

### 4.1 Colours

| Token | Value | Use |
|---|---|---|
| `pink-50 / 100 / 300 / 500 / 700` | `#fff5f8` / `#ffe2eb` / **`#fe9fb9`** (brand base) / `#ef5f8d` / `#b8325f` | page base, highlights, pink text on light (700 passes AA) |
| `green-50 / 100 / 300 / 500 / 700 / 900` | `#f2f9ec` / `#dcefcb` / `#a3d37f` / **`#63a23d`** (brand) / `#2f7a1f` (AA text) / `#1f4f15` | stickers, buttons, text |
| `paper` | `#fffaf2` | cards (with transparency + blur) |
| `ink` / `ink-soft` | `#2b3326` / `#56614f` | body text / meta text (both AA on paper) |
| Section accents | Home lavender `#c9b6f4`, About sky `#bfe4ff`, News rose `#ffb3c7`, Discography peach `#ffd3b0`, Gallery mint `#c8ecd9` | tape, pins, small details — picked from each artwork |

All text/background pairs will be checked for **WCAG AA** (4.5:1 normal text, 3:1 large text).

### 4.2 Typography

| Role | Size (desktop → phone) | Font / weight |
|---|---|---|
| Display (logo line, big headings) | 44–72 px → 32–40 px (fluid) | Fredoka 700 |
| Section sticker heading | 28–44 px → 24–30 px | Fredoka 700 |
| Card title | 18–22 px → 17–19 px | Fredoka 600 (JA: M PLUS Rounded 1c 800) |
| Body | 15–17 px → 15–16 px | Fredoka 500 / M PLUS Rounded 1c 500, line-height 1.6 (JA 1.75) |
| Meta (dates, labels) | 13–14 px (never smaller) | 600, `ink-soft` |

Body text becomes **dark ink instead of green bold** — green is reserved for headings, links and accents (fixes A4).

### 4.3 Spacing, shape, depth

- **Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px — every gap uses these (fixes A5).
- **Corners:** 12 px (chips) · 20 px (cards) · 28 px (panels) · pill.
- **Depth (3 levels):** *paper* (soft 1-layer shadow) → *lifted* (hover / featured) → *modal* (lightbox, menu). Shadows are tinted pink/green, never grey-black.
- **Surfaces:**
  - **Paper card** — cream at ~88% + 12 px background blur + soft shadow + thin white inner edge (fixes A3).
  - **Stitch** — dashed 2 px line *inset* inside a card, only for featured items (fixes A2: from ~30–50 dashed boxes to ~4–6 per screen).
  - **Sticker** — white die-cut outline, −2°…+2° tilt, drop shadow.
  - **Washi tape** — small translucent strips (pure CSS) on card corners, in the section accent colour.
  - **Scrim** — gradient that softens the artwork only behind the content side.
- **Texture:** very light paper grain + faint clover pattern on plain areas (tiny inline SVG, no image downloads).

### 4.4 Icons & decoration

Existing Lucide icons + our clover SVGs. New small decorations (clover pin, tape, scallop edge, sparkle) drawn in SVG/CSS — no new image files needed.

---

## 5. Components (now → v2)

| Component | v2 design |
|---|---|
| **Hero header (Home)** | Bigger logo with a gentle sticker outline; nav words as pink "pill" stickers with an active clover dot; socials as round icon badges with the handle on hover/focus (phones: under the logo) |
| **Scrolled nav** | Floating **paper pill bar** (not full-width green block), logo left, links centre, JP/EN right; **clover scroll-progress** indicator; active item marked with a moving clover dot |
| **Section heading** | Die-cut sticker with the section accent tape behind it; JP/EN titles |
| **Next stream countdown** | "Ticket" card with stitch border, big flip-style digits, a pulsing **LIVE** badge when it's stream time |
| **Latest video** | **Polaroid** card: thumbnail with play button, title on the white "photo" border, "Latest / 最新" ribbon |
| **News card** | Paper note: date chip, title (dark), 2–3-line summary, link chips; newest has a small "NEW" stamp |
| **Video list (News)** | Horizontal **film strip** of thumbnails (scroll/drag), selected one outlined |
| **About** | **Trading-card profile**: avatar + name + key facts in a clean 2-column grid (label / value), bio as readable paragraph on a paper panel; pose art stays inside the clover frame |
| **Discography** | Release cards with a **CD/vinyl-sleeve** look; when there's no YouTube thumbnail, a designed **cover placeholder** (logo + release type + date on a coloured sleeve) instead of an empty clover (fixes A7) |
| **Achievements** | **Timeline** (year markers on a stitched line) instead of a dense list |
| **Gallery** | **Full-width masonry** (3–5 columns desktop, 2 phone) directly on the section, small sticker heading (fixes A8); hover: lift + credit slides up |
| **Lightbox** | Dark blurred backdrop, image in a polaroid frame, credit + "view original post" button, swipe on phones |
| **Buttons / chips** | Pill buttons with a soft "press" (squish) state; link chips with platform icon |
| **JP/EN switch** | Sliding pill (the highlight moves between JP and EN) |
| **Footer** | **Scrapbook back page**: scallop edge on top, Moesoft sticker, disclaimer on a paper note, links as tidy columns, credits button, back-to-top clover (fixes A9) |
| **Loader** | Same idea (art + logo + "Loading…" + Moesoft credit) but polished — see §7.3 |
| **Mobile menu** | Full-screen art with a paper panel of big nav stickers + socials; opens with a circle reveal from the menu button |
| **Empty / error states** | Keep the mascot; put it on a paper note with a friendlier layout |
| **Custom scrollbars** | Keep the dashed idea, but thinner and in the section accent colour |

---

## 6. Section layouts

Desktop keeps your reference compositions (art full-screen, content blocks in the same areas) — only cleaned up. Phones keep the one-column flow of your mobile references.

```
DESKTOP HOME                                   PHONE HOME
┌──────────────────────────────────────────┐   ┌──────────────┐
│ [LOGO sticker]      home about news … ● │   │   [LOGO]     │
│                     (x)(yt)(tw)(tc)  JP|EN│   │ (socials) JP │
│ ┌ticket: next stream┐   ┌latest news──┐  │   │ [ticket]  ☰ │
│ └───────────────────┘   │ note        │  │   │ [polaroid]   │
│ ┌polaroid: latest   ┐   │ note        │  │   │ [note][note] │
│ │  video  ▶         │   └─────────────┘  │   │  scroll ⌄    │
│ └───────────────────┘      (art stays      │   └──────────────┘
│           scroll ⌄          visible here)  │
└──────────────────────────────────────────┘
```

| Section | Desktop | Tablet (600–899 px) | Phone |
|---|---|---|---|
| Home | as above; scrim on the left half only | phone layout, wider cards | logo → socials → ticket → polaroid → 2 news notes |
| About | sticker heading + trading card left, clover pose frame right, bio panel under the card | stacked, pose beside the card | card → bio → pose |
| News | notes list left (scroll inside), "Latest works" polaroid + film strip right | stacked | notes → polaroid → strip |
| Discography | sleeves grid left, achievements timeline right | stacked | sleeves (2 per row) → timeline |
| Gallery | full-width masonry, 4–5 columns | 3 columns | 2 columns |
| Footer | 4 columns on a paper panel | 2 columns | stacked |

---

## 7. Motion design (explained simply)

**Idea:** motion should feel like **stickers and paper being placed on a scrapbook** — quick, bouncy, never slow. Every animation has a job: show where to look, confirm a tap, or add a little joy. Nothing blocks reading, and everything turns off for people who ask their device for less motion.

### 7.1 Motion rules ("tokens")

| Name | Duration | Feel | Used for |
|---|---|---|---|
| *tap* | 120 ms | instant | button press, toggles |
| *pop* | 350–450 ms | springy overshoot | stickers, badges, tiles appearing |
| *glide* | 600–800 ms | smooth slow-down | section snap, panels, menu |
| *float* | 4–8 s loop | very gentle | idle decorations |

Only `transform` and `opacity` are animated (smooth on phones). Cards appear **in a stagger** (one after another, 40–60 ms apart).

### 7.2 What moves where

| Moment | Animation |
|---|---|
| **Arriving at a section** (after the snap glide) | Artwork settles from a slight zoom (1.06 → 1); the **sticker heading pops in** with a small tilt; **tape strips "stick"** (grow from 0); cards **rise and fade in** one after another |
| **Scrolling between sections** | **Parallax**: artwork moves a little slower than the content, decorations a little faster → depth. The clover in the nav **fills up** as you scroll the page |
| **Home, idle** | Countdown digits **flip** each second; LIVE badge **pulses** when streaming; "scroll for more" chevron **bobs** |
| **Hover / tap** | Buttons **squish** on press; cards **lift** (and tilt slightly toward the cursor on desktop, max 4°); video polaroid gets a **shine sweep** and the play button **pops**; gallery tiles lift and the **credit slides up** |
| **Headings** | Section titles **bounce in letter by letter** (JA by character) — once per visit |
| **Gallery → lightbox** | The tapped artwork **grows from its tile into the lightbox** (shared-element transition), and shrinks back on close |
| **JP/EN switch** | Highlight **slides** to the chosen language; text crossfades |
| **Mobile menu** | Opens as a **circle growing from the menu button**; links drop in one by one |
| **Ambient** | A few **floating clovers** (max ~10, very slow, pause when off-screen) on Home and the Footer |
| **Special days** | Existing confetti (birthday June 10, debut July 8, JST) — kept |

### 7.3 Loader sequence (~3 s, as agreed)

1. Artwork fades in behind a soft pink veil; **the clover draws its outline**, then fills (petal by petal) **as assets load** (real progress).
2. "Loading…" letters **bounce** gently; Moesoft credit fades in.
3. When ready: the clover **grows into a circle "iris" that opens** onto the Home section, then the Home stickers and cards pop in.

### 7.4 Comfort & performance

- **Reduced motion** (device setting): no parallax, tilt, letters, particles or zoom — only quick fades; snap stays but without the glide.
- Animations pause when the tab is hidden or the element is off-screen.
- Budget: smooth 60 fps on a mid-range phone; no animation runs longer than needed; nothing waits for an animation to finish before you can read or tap.

### 7.5 Tools (libraries)

| Library | Plan |
|---|---|
| **GSAP** (animation engine) | Upgrade **3.12.5 → 3.13** (now 100% free including **SplitText** for letter animations and **Flip** for the gallery grow-into-lightbox effect). One engine for everything |
| **ScrollTrigger** (GSAP) | Parallax + scroll progress |
| **Lenis** | Keep (smooth scroll + our snap) |
| **Anime.js**, **Animate.css** | **Recommend removing** — GSAP + a few CSS keyframes do the same, so visitors download ~90 KB less and animations stay consistent (your brief listed them, so this needs your OK — Q5) |
| **canvas-confetti**, **Lucide** | Keep |
| View Transitions (built into modern browsers) | Used for the lightbox where supported; GSAP Flip as fallback |

All new/updated CDN files keep **Subresource Integrity** hashes and pass the **Content-Security-Policy** (checked like before).

---

## 8. Technical approach (how it will be built)

- **No build step** (same as now). CSS reorganised into layers: `tokens` → `base` → `components` → `sections` → `motion` (one file per layer, loaded in order). Easier to maintain than the current single 1,000+ line file.
- **JS:** a new `motion.js` (all choreography in one place, driven by the existing section-change events) replacing scattered effects in `fx.js`; the loader and scroll code keep their logic.
- **HTML:** mostly the same structure; some wrappers added for tape/scrims. **All `data-track` analytics attributes, i18n keys, ARIA and CSP rules kept.**
- **No database/API changes.** Preview deployments use the same database, so the design branch never writes content (only the page's own visitor stats, which are tagged `preview` and not counted).
- **Checks after each phase:** screenshot matrix (desktop 1366 & 1920, tablet 768, phones 360 & 390, JP & EN), before/after comparison sheets, CSP/SRI check, reduced-motion check, text-contrast check, frame-rate check of the animations (Chrome DevTools trace).

### 8.1 How you review

- I post **before/after screenshots** in chat after each phase.
- Every push to `designupdatev2` also creates a **Vercel preview link** (protected — open it while logged in to Vercel; it's the same site, just the new design).
- Nothing reaches `kotoha-fansite.vercel.app` until you approve the **merge into `main`**.

---

## 9. Phases & checklist

| Phase | Work | You check |
|---|---|---|
| **D0** Setup | Branch, this plan, answers to §11 | approve plan |
| **D1** Style tile | One stand-alone page (not wired to the site) showing colours, type, card, sticker, button, tape — the "look" in one screen, desktop + phone | **pick / adjust the look** (cheap to change here) |
| **D2** Foundations | Tokens, typography, surfaces, CSS layers; site uses them (layout unchanged) | screenshots |
| **D3** Components | Stickers, cards, polaroid, ticket, notes, sleeves, timeline, nav, JP/EN, buttons, footer | screenshots |
| **D4** Sections — desktop | Home, About, News, Discography, Gallery, Footer | **preview link review** |
| **D5** Responsive | Tablet, phones, landscape phones, mobile menu | preview on your phone (+ the pending swipe test) |
| **D6** Loader | New sequence (§7.3) | preview |
| **D7** Motion | Tokens, section choreography, parallax, micro-interactions, lightbox transition, ambient, reduced motion | **preview review** |
| **D8** Admin polish *(only if Q2 = yes)* | Apply the new tokens to the admin panel (same layout) | screenshots |
| **D9** QA | Contrast, keyboard, screen reader labels, reduced motion, performance, CSP/SRI, JP line breaks | final review |
| **D10** Merge | Merge `designupdatev2` → `main` → production | **your go-ahead** |

---

## 10. Risks & how they're handled

| Risk | Mitigation |
|---|---|
| Busy artworks vs readable text | Scrims + paper cards with blur; contrast checked per section |
| Motion too much / motion sickness | Short durations, no large movements, full reduced-motion mode, "playful" level by default (Q6) |
| Slower phones | transform/opacity only, few particles, pause off-screen, frame-rate check |
| Design drifts from your identity | Style tile (D1) first; your references stay the layout guide |
| Big change at once | Phased with screenshots; merge only after your approval; `main` keeps working meanwhile |
| Library change breaks something | CSP/SRI + headless checks after the switch (same tests as before) |

---

## 11. Questions for you (my recommendation first)

1. **Direction:** **(a) Clover Scrapbook** (recommended) · (b) Soft Glass · (c) Pixel Cute — see §3.
2. **Admin panel:** also refresh its look with the new colours/type (same layout, D8)? **Recommended: yes, light touch**, after the public site.
3. **How faithful to the reference layouts?** **(a) Keep the same compositions, refine everything inside them** (recommended) · (b) allow bigger re-arrangements where it clearly looks better (I'd show you first).
4. **Dashed borders:** **(a) Keep as the "stitch" signature on featured items only** (recommended) · (b) keep on all cards · (c) remove.
5. **Libraries:** upgrade **GSAP to 3.13** and **remove Anime.js + Animate.css** (one engine, lighter site)? **Recommended: yes.**
6. **Motion level:** (a) calm · **(b) playful** (recommended — everything in §7) · (c) extra (more particles, bigger moves).
7. **Desktop cursor effect** (a small clover-sparkle trail following the mouse): **(a) no** (recommended — can get annoying) · (b) yes, subtle.
8. **Snapping on phones:** keep strict snap as now (and you'll test on a real phone later), or switch phones to **free scrolling with section reveal animations**? **Recommended: keep snap for now, decide after your phone test.**
9. **Fonts:** **keep Fredoka + M PLUS Rounded 1c** (recommended) or add a separate display font for big headings?
10. **Section accent colours** taken from each artwork (§4.1): **yes** (recommended) or strictly pink/green only?
11. **"Most latest" badge →** "Latest" / 「最新」? **Recommended: yes.**
12. **Review style:** screenshots in chat after each phase + the Vercel preview link — OK?

---

## 12. Confidence

- **Clarity of what you want: 78%.** Remaining uncertainty is taste (Q1, Q3, Q6) — the style tile (D1) is designed to close that gap cheaply before the big work.
- **Technical confidence: 92%.** Everything uses tools already in the project (plus GSAP's now-free plugins); the risky parts (performance, contrast) have checks planned.

---

## 13. Resume protocol & progress (for cut-offs)

1. `git checkout designupdatev2` — confirm with `git branch --show-current`.
2. Read this file, then `docs/PROGRESS.md` §1 (hard rules still apply: secret scan before every commit, no secrets in files, commit author/trailer, never force-push, SRI/CSP on CDN files).
3. Continue from the first unchecked box below. Commit + push after each verified step (push = Vercel preview only; **never merge into `main` without the owner's approval**).

- [x] D0.1 Branch `designupdatev2` created from `main` @ `eef577f`
- [x] D0.2 Audit (§2) + this plan written
- [ ] D0.3 Owner answers §11 and approves → set Status to "Approved vX"
- [ ] D1 Style tile
- [ ] D2 Foundations
- [ ] D3 Components
- [ ] D4 Sections (desktop)
- [ ] D5 Responsive + mobile menu
- [ ] D6 Loader
- [ ] D7 Motion
- [ ] D8 Admin polish (if approved)
- [ ] D9 QA
- [ ] D10 Merge to `main` (owner go-ahead)

### Decision log

| Date | Decision | By |
|---|---|---|
| 2026-09-26 | Design work happens on branch `designupdatev2`; plan first, no code until approval | Owner |
| 2026-09-26 | Motion/animation choices delegated to Claude ("I'll let you do what you recommend") — proposals in §7, confirmed via Q5–Q7 | Owner |
