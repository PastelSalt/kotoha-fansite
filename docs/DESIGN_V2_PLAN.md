# Kotoha Fan Site — Design Update v2 (visuals + motion)

| | |
|---|---|
| **Status** | **Draft v0.2 — round 1 answered; round 2 questions open (§12). NO CODE on this branch until the owner approves.** |
| **Branch** | `designupdatev2` (created from `main` @ `eef577f`) |
| **Scope** | How the public site looks and moves. Content, database, API, admin panel, analytics, i18n and security stay as they are |
| **Clarity** | **84%** (v0.1: 78%) — the remaining gap is the exact "music video" feel (§12 Q1–Q4) |
| **Technical confidence** | **88%** (v0.1: 92%) — the MV style adds heavier effects; optional WebGL (Q4) is the main risk |
| **Resume file** | This file (§14 has the checklist). `docs/PROGRESS.md` on `main` stays the source of truth for everything that is not design |

---

## 0. Round 1 answers (2026-09-26)

| Q | Owner's answer | What it means for the plan |
|---|---|---|
| 1 Direction | **Clover Scrapbook** | §3 |
| 2 Admin panel | **Keep the current admin look** | Admin is out of scope (old phase D8 removed) |
| 3 Layout freedom | **Full freedom** — rearrange almost everything, add things that make it more appealing | New compositions + additions (§6, §8); still recognisably your design |
| 4 Dashed borders | Claude decides | "Stitch" used only on featured items (§4.3) |
| 5 Libraries | Claude decides | GSAP 3.13 (free SplitText/Flip), drop Anime.js + Animate.css; optional WebGL → Q4 |
| 6 Motion level | **"Music-video-ish, but still a website"** | New core concept: **the page is an MV told in scenes** (§5) |
| 7 Cursor sparkle trail | **Yes** | Desktop only, subtle, off on touch/reduced motion (§7.2) |
| 8 Phone scrolling | Claude's opinion wanted | **Recommendation: free scroll on phones, snap-glide on desktop** — confirm in Q7 (§7.5) |
| 9 Fonts | Fredoka stays the main font; an extra font is OK if it helps | Trial of a small handwritten accent font for scrapbook doodles only, decided in the style tile (§4.2) |
| 10 Section accent colours | Yes | §4.1 |
| 11 "Most latest" | Claude decides | → **"Latest" / 「最新」** |
| 12 Review style | Yes | Screenshots in chat + protected Vercel preview link per phase |
| New | **Remove the "art by …" labels from the sections** (they break the illusion); credit those artworks in the gallery instead | On-art labels removed everywhere (sections + loader); every artwork used on the site gets a gallery entry; plus an MV-style **ending credits roll** (§5, §6.7). Details → Q5 |
| Note | Cloudinary key/secret in Vercel is a known loose end on `main` | Tracked in `docs/PROGRESS.md` §8 (owner action), not part of this branch |

---

## 1. Goal

Turn the site into a **polished, hand-made fan project that plays like an anime music video**: every section is a "scene" with camera moves over the artwork, big kinetic text, pop shapes and quick stylish cuts — but it is still a website (readable, clickable, fast, accessible). Identity stays yours: pink `#fe9fb9` base, green stickers, full-screen fan art, clovers, Fredoka.

**Not changing:** the data shown, the admin panel, API, database, JP/EN, analytics, CSP/SRI rules.
**Changing freely:** layout inside each section, order of elements, decorations, extra (real-data or decorative) features listed in §8.

---

## 2. Honest audit of the current UI (measured)

Compared at 1366×768 and 360×800 against your references.

**Keep:** the art-first composition (full-screen fan art per section), logo, green sticker headings, pink nav words, scallop divider, clovers, Fredoka, section structure, JP/EN.

| # | Problem | Evidence |
|---|---|---|
| A1 | Text too small | Desktop body 11.6–13.7 px; on phones **146 of 267** text elements are under 12 px |
| A2 | Dashed borders everywhere | **29** visible at once on desktop, **51** on phones — signature turned into noise |
| A3 | Cards fight the artwork | Flat 74% white, no blur, no shadow |
| A4 | No hierarchy | Everything is green bold at similar sizes |
| A5 | Inconsistent spacing | Gaps vary per section |
| A6 | About crowded | Tiny dashed "pills", small green text on the art |
| A7 | Discography looks empty | Big clover placeholders when there's no video |
| A8 | Gallery squeezed | 2 small columns in a narrow panel under a huge banner |
| A9 | Footer generic | Default-looking columns |
| A10 | Motion basic | Fades/slides, nothing that feels special |
| A11 | Credits break the illusion | "art by …" labels on every artwork *(owner, round 1)* |

---

## 3. Visual direction: **Clover Scrapbook** (chosen)

Kotoha's fan scrapbook: artworks are the photos, content sits on **paper notes** taped onto them, headings are **die-cut stickers**, the dashed line becomes a **stitch** for special items only. In the MV concept, the scrapbook pieces are the "props" that the camera and the cuts play with.

| Keep | Evolve |
|---|---|
| Pink base, green brand | Full colour scale + one accent per section (from its artwork) |
| Green sticker headings | Die-cut stickers (white outline, tilt, shadow) + big kinetic "title words" behind them |
| Dashed cards | Paper cards (cream, blur, soft shadow); stitch only on featured items |
| Full-screen art | Art gets **camera moves** and a **scrim** only behind the text side |
| Fredoka | Bigger type scale; optional handwritten accent for doodles |
| Clovers, scallops | A consistent decoration system (tape, pins, scallops, sparkles, speed lines) |

---

## 4. Design system v2

### 4.1 Colours

| Token | Value | Use |
|---|---|---|
| `pink-50/100/300/500/700` | `#fff5f8` `#ffe2eb` **`#fe9fb9`** `#ef5f8d` `#b8325f` | base, highlights, pink text (700 = AA) |
| `green-50/100/300/500/700/900` | `#f2f9ec` `#dcefcb` `#a3d37f` **`#63a23d`** `#2f7a1f` `#1f4f15` | stickers, buttons, headings (700 = AA text) |
| `paper` | `#fffaf2` | cards (translucent + blur) |
| `ink` / `ink-soft` | `#2b3326` / `#56614f` | body / meta text (AA on paper) |
| Section accents | Home lavender `#c9b6f4` · About sky `#bfe4ff` · News rose `#ffb3c7` · Discography peach `#ffd3b0` · Gallery mint `#c8ecd9` | tape, wipes, scene colour flashes, scrollbar |

Every text pair checked for WCAG AA.

### 4.2 Typography

| Role | Desktop → phone | Font |
|---|---|---|
| Kinetic title words (big, behind/over scenes) | 96–200 px → 56–96 px | Fredoka 700, outline + fill layers |
| Section sticker heading | 28–44 → 24–30 px | Fredoka 700 |
| Card title | 18–22 → 17–19 px | Fredoka 600 / M PLUS Rounded 1c 800 |
| Body | 15–17 → 15–16 px, line-height 1.6 (JA 1.75) | Fredoka 500 / M PLUS Rounded 1c 500 |
| Meta | 13–14 px (minimum) | 600, `ink-soft` |
| *Doodle accent (trial)* | small notes like "new!", arrows, "♡ fan art" | a handwritten Google Font (EN + JA candidates compared in the style tile; dropped if it doesn't look better) |

Body text becomes dark ink; green is for headings, links, accents.

### 4.3 Shape, depth, surfaces

- Spacing scale 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px; corners 12/20/28 px/pill.
- Depth: *paper* → *lifted* → *modal*, tinted shadows.
- **Paper card** (cream ~88% + 12 px blur + soft shadow), **stitch** (inset dashed line — only on featured items: next-stream ticket, latest video, profile card, "coming soon"; ≈4–6 per screen instead of 29–51), **sticker**, **washi tape**, **scrim**, light **paper grain**.

### 4.4 MV visual vocabulary (new)

Speed lines · halftone dots · sparkle stars · clover/heart/star shape bursts · light-leak glows · film grain · outlined giant words · diagonal colour stripes (wipes) · "lyric" text lines · ribbon marquees. All drawn with CSS/SVG (no new image downloads) in the section accent colours.

---

## 5. The core concept: **the page is a music video**

Each section is a **scene**. Inside a scene the camera moves over the artwork and the props (stickers, notes, cards) enter on a **beat**. Between scenes there are stylish **cuts**. No sound, no autoplaying video — the "music" is the rhythm of the motion.

**Beat grid:** all timings follow one tempo (**128 BPM → 1 beat = 469 ms**, ½ = 234 ms, ¼ = 117 ms). Staggers, pops and cuts land on these units, which is what makes motion feel "musical" instead of random.

| Scene | Section | What happens |
|---|---|---|
| **0 · Opening** | Loader → title card | Artwork + clover drawing itself as assets load (real progress) → **title card**: "KOTOHA / ことは" letters slam in on the beat, tagline types out ("HaKoniwalily ✿ HoneyWorks"), sparkle burst → clover iris opens onto Home. **Skip button**; plays once per visit (Q2) |
| **1 · Hook** | Home | Slow camera push-in on the art; giant outlined "KOTOHA" word drifts behind; logo sticker pops; next-stream **ticket** and latest-video **polaroid** land on beats; news notes get pinned; marquee ribbon runs along the bottom |
| **2 · Verse** | About | Camera pans across the room art; **profile trading card flips in** (3D); facts appear like **lyric lines** one by one; pose in the clover frame with a sparkle burst |
| **3 · Verse 2** | News | Notes get **taped on** one by one (tape strips "stick"); "Latest works" polaroid + **film strip** slides in like film frames |
| **4 · Chorus** (most energetic) | Discography | Big kinetic "DISCOGRAPHY" word, speed lines; release **sleeves slide out of a record crate**; achievements **timeline draws itself** with year markers popping; "**Coming soon**" countdown for any future-dated release |
| **5 · Bridge** | Gallery | **Fan-art montage**: tiles fly in from different directions with small rotations and settle into the masonry; hover spotlight; tap → artwork **grows into the lightbox** |
| **6 · Ending credits** | Footer | **MV credits roll**: every artist whose art appears on the site (with links), "Site design & code — Moeko Software and Technologies", disclaimer, contact; ends on a **"Thanks for watching ✿"** card with a **replay** (back-to-top) button |

**Cuts between scenes (desktop):** during the snap glide, a quick **wipe** in the next scene's accent colour (diagonal stripes, clover mask or halftone sweep — varied per scene) + the new scene's kinetic title. **Phones:** scroll-linked reveals instead (see §7.5).

---

## 6. Section layouts (new compositions)

Desktop keeps "art full-screen + props on top"; the props are re-arranged for balance and room for the character. Phones are one column.

```
DESKTOP · Scene 1 Home                           PHONE · Scene 1 Home
┌───────────────────────────────────────────┐    ┌──────────────┐
│ ●KOTOHA●   home about news disco gallery  │    │ [LOGO]  ☰    │
│  (giant outlined "KOTOHA" drifting)       │    │ (x)(yt)(tw)… │
│ [LOGO sticker]            (character      │    │ ┌ticket────┐ │
│ (x)(yt)(tw)(tc)            stays bright   │    │ └──────────┘ │
│ ┌ticket: next stream┐      on this side)  │    │ ┌polaroid──┐ │
│ └───────────────────┘                     │    │ │   ▶      │ │
│ ┌polaroid─────┐ ┌note┐┌note┐              │    │ └──────────┘ │
│ │     ▶       │ └────┘└────┘   JP|EN      │    │ [note][note] │
│ └─────────────┘                           │    │ ~~marquee~~  │
│ ~~~~ KOTOHA ✿ ことは ✿ HaKoniwalily ~~~~~ │    └──────────────┘
└───────────────────────────────────────────┘
```

| Scene | Desktop | Phone |
|---|---|---|
| 1 Home | props in the left 55%, scrim left, character right; marquee at bottom | logo → socials → ticket → polaroid → notes |
| 2 About | trading card (avatar, name, facts grid) left; bio note under it; pose in clover frame right | card → bio → pose |
| 3 News | pinned notes column (scrolls inside) + polaroid & film strip | notes → polaroid → strip |
| 4 Discography | record crate of sleeves (designed covers when no video) + "Coming soon" + timeline | sleeves 2-up → timeline |
| 5 Gallery | full-width masonry (4–5 columns), small sticker heading | 2 columns |
| 6 Ending credits | credits roll centre, links/socials sides, "Thanks for watching" card | stacked roll |
| Nav (after Home) | floating paper pill: logo · links · clover progress · JP/EN | logo · clover progress · menu |

**Credits (owner request):** the "art by …" labels are removed from all scenes and the loader. Every artwork used on the site gets a **gallery entry with its credit** (missing today: About background, loader "pajamas" and "green cardigan" arts — all artist unknown) and appears in the **ending credits roll**. Profile avatar + About pose → Q5.

---

## 7. Motion system

### 7.1 Tokens

| Name | Duration | Feel | Used for |
|---|---|---|---|
| *tap* | 117 ms (¼ beat) | instant | press, toggles |
| *pop* | 234–469 ms (½–1 beat) | springy overshoot | stickers, badges, tiles |
| *cut* | 469–700 ms | fast in, fast out | scene wipes |
| *glide* | 700–940 ms (1½–2 beats) | smooth | snap between scenes, camera settles |
| *drift* | 8–20 s loop | very slow | camera push-ins, giant words, ambient |

Only `transform`/`opacity`/`clip-path`/`filter` (light) are animated.

### 7.2 Effects catalogue

| Effect | Where |
|---|---|
| **Camera moves** on artworks (push-in, pan, slight rotate) — scroll-linked on desktop, time-based on phones | every scene |
| **Kinetic typography** (letters/characters slam, outline echo, giant drifting words) — GSAP SplitText; JA split per character | titles, title card, headings |
| **Scene cuts** (stripe / clover-mask / halftone wipes) | desktop snaps |
| **Prop entrances** on the beat (pop, tape stick, card flip, film slide, crate slide, montage fly-in) | per scene (§5) |
| **Shape bursts** (clovers, stars, hearts) | sticker arrival, special moments |
| **Parallax layers** (art slower, props normal, decorations faster) | desktop |
| **Micro-interactions**: squish buttons, lift + 4° tilt cards, shine sweep on the polaroid, credit slide-up on tiles, JP/EN sliding pill, nav clover dot | everywhere |
| **Lightbox grow** (View Transitions API where supported, GSAP Flip fallback) | gallery |
| **Mobile menu**: circle reveal from the menu button, links drop in | phones |
| **Cursor sparkle trail** (desktop, subtle, ≤ 12 sparkles, fades fast) | desktop only *(owner: yes)* |
| **Ambient**: floating clovers, light leaks, film grain, marquee | Home, Ending credits |
| **Special days** (June 10 birthday, July 8 debut, JST): confetti + themed decorations | kept + extended |

### 7.3 Opening sequence (Scene 0)

1. Pink veil + random loader artwork; clover **draws its outline**, petals fill **with real loading progress**.
2. Title card (~2.5 s): KOTOHA letters slam in (one per ¼ beat), ことは underneath, tagline types, sparkle burst.
3. Clover **iris** opens onto Home; Home props enter on the beat.
Total stays within the agreed ~3–4 s on a first visit, **skippable**, shorter on later visits in the same session (Q2).

### 7.4 Safety & comfort (non-negotiable)

- **No rapid flashing** (never more than 3 flashes per second) — photosensitivity safety.
- **Reduced-motion** device setting → "calm mode": no opening title card, no camera moves, wipes, tilt, particles, sparkles or letter animations — only short fades.
- **Pause control**: a small **"motion ✿ on/off"** toggle (nav + footer) that stops all looping/ambient motion (web accessibility rule for moving content > 5 s); remembered in the browser.
- Animations pause when off-screen or when the tab is hidden; nothing blocks reading or tapping.

### 7.5 Scrolling (Q8 — my recommendation, confirm in Q7)

- **Desktop: keep snap + glide.** It is what makes the scene "cuts" feel like an MV.
- **Phones: switch to free (natural) scrolling.** Reasons: (1) snap on touch fights the phone's own momentum and often feels sticky or jumpy; (2) sections with long lists (news, achievements, gallery) are awkward when snapped; (3) MV scenes work beautifully on phones as **scroll-driven reveals** (props and titles animate as you scroll into them); (4) your pending real-phone test becomes much less risky.

### 7.6 Libraries

| Library | Plan |
|---|---|
| **GSAP 3.13** (+ ScrollTrigger, **SplitText**, **Flip**, CustomEase) | Main animation engine (all plugins are now free) |
| **Lenis** | Desktop smooth scroll + snap (phones: native) |
| **canvas-confetti**, **Lucide** | Keep |
| **Anime.js**, **Animate.css** | **Removed** (GSAP + CSS replace them; ~90 KB less) |
| **Optional WebGL layer** (OGL, ~30 KB) | Liquid / ripple / RGB-split transitions on the artworks — only if Q4 = yes; automatic fallback to CSS on weak devices |

All CDN files: pinned versions + **SRI** + allowed by the **CSP** (verified like before).

---

## 8. Additions (Claude's proposals — owner picks in Q6)

| # | Addition | Data |
|---|---|---|
| a | **Opening title card** (Scene 0) | decorative |
| b | **Marquee ribbons** between scenes ("KOTOHA ✿ ことは ✿ HaKoniwalily ✿ HoneyWorks ✿ …") | decorative |
| c | **"Coming soon" card** with countdown for future-dated releases (e.g. the 2026-10-07 tie-in already in the database) | real (discography dates) |
| d | **Mascot cameos**: the mascot peeks from screen edges in some scenes and reacts on hover/tap | existing mascot art |
| e | **Ending credits roll** footer + "Thanks for watching" + replay | real (credits) |
| f | **LIVE badge** on the ticket during stream hours (Tue/Fri ~21:00 JST window, as the countdown already knows) | real (schedule) |
| g | **Scroll progress clover** in the nav | — |
| h | **Easter egg**: tap the logo 5× → clover rain | decorative |
| i | **Special-day themes** (birthday/debut decorations on top of the confetti) | real (dates) |
| j | **"Fan art of the moment"** spotlight: one gallery artwork highlighted on Home, rotating per visit, with credit | real (gallery) |

No invented facts or numbers — additions use existing data or are purely decorative.

---

## 9. Technical approach

- **No build step.** CSS split into ordered layers: `tokens` → `base` → `components` → `scenes` → `motion`.
- **JS:** new `motion/` modules — `beat.js` (tempo + timings), `scenes.js` (per-scene timelines), `cuts.js` (wipes), `camera.js` (art moves), `ambient.js` (sparkles, clovers, cursor trail, pause toggle); `fx.js` retired. Loader/scroll logic kept, phones switch to native scroll.
- **HTML:** restructured per scene; **all `data-track` analytics attributes, i18n keys, ARIA and CSP rules kept.** `art-credit` elements removed; credits move to gallery + ending credits.
- **Data:** gallery seed extended with the 3 missing background artworks (and avatar/pose if Q5 says so). This writes to the shared database — done at implementation time, same script as before.
- **Checks per phase:** screenshot matrix (1366, 1920, 768 tablet, 360/390 phones; JP/EN), before/after sheets, CSP/SRI, reduced-motion + pause toggle, contrast, frame-rate trace (target 60 fps desktop, ≥ 50 fps mid-range phone), no-flash check.

### 9.1 Review

Screenshots in chat after each phase + **protected Vercel preview link** of `designupdatev2` (open while logged in to Vercel). Nothing reaches the live site until you approve the merge.

---

## 10. Phases

| Phase | Work | You check |
|---|---|---|
| D0 | Plan + answers | approve |
| **D1** | **Style tile + motion sample**: one stand-alone page showing colours, type, paper card, sticker, tape, stitch, *and* a short MV sample (title card + one scene cut + one scene entrance) | **pick/adjust the look and the MV feel** (cheap to change here) |
| D2 | Foundations: tokens, typography, surfaces, CSS layers, credits removed | screenshots |
| D3 | Components (ticket, polaroid, notes, trading card, sleeves, timeline, masonry, nav, footer roll…) | screenshots |
| D4 | Scenes — desktop layouts | preview link |
| D5 | Phones/tablet + native scroll on phones + mobile menu | preview on your phone (replaces the pending swipe test) |
| D6 | Opening sequence (loader + title card) | preview |
| D7 | Motion: beat grid, camera, cuts, entrances, micro-interactions, ambient, cursor trail, pause toggle, calm mode | **preview review** |
| D8 | Additions chosen in Q6 + gallery seed update | preview |
| D9 | QA: contrast, keyboard, screen reader, calm mode, no-flash, performance, CSP/SRI, JP line breaks | final review |
| D10 | Merge `designupdatev2` → `main` → production | **your go-ahead** |

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| MV effects hurt readability | Motion happens *around* content; text settles within ~1 beat; calm mode + pause toggle |
| Heavy on phones | transform/opacity only, fewer effects on small/slow devices, pause off-screen, frame-rate checks; WebGL only on capable devices |
| Motion sickness / photosensitivity | Small camera moves, no flashing, reduced-motion respected |
| "MV feel" not what you imagined | D1 motion sample before building everything |
| Big rewrite | Phased, screenshots each step, `main` untouched until merge |

---

## 12. Round 2 questions (my recommendation first)

1. **Which MVs do you picture?** My interpretation is the **HoneyWorks / HaKoniwalily anime-MV style** (illustration camera moves, big bouncy lyric typography, pop shapes, quick colour cuts). Is that right? If you have 1–3 favourite MVs (titles or links), I'll match their feel.
2. **Opening title card** (Scene 0 after the loader, ~2.5 s, skippable): **(a) yes, full on the first visit, short on later visits in the same session** (recommended) · (b) every time · (c) no title card, loader only.
3. **Cut intensity between scenes (desktop):** (a) soft (fades + reveals) · **(b) MV cuts — quick coloured wipes + kinetic title on each scene change** (recommended) · (c) maximal (plus screen shake / zoom punches, still no flashing).
4. **WebGL artwork effects** (liquid/ripple dissolves, RGB-split on cuts — the most "MV" look, ~30 KB extra, automatic fallback on weak devices): **(a) yes** (recommended) · (b) no, CSS/GSAP only (lighter, simpler).
5. **Credits:** on-art labels are removed as you asked. Also: **(a) add the profile avatar and the About pose to the gallery too, so every image on the site is credited in one place** (recommended) · (b) backgrounds only. *(Keeping credits in the gallery + ending-credits roll still honours the artists and your takedown-by-email promise.)*
6. **Additions (§8):** which ones? **Recommended: all except (h) easter egg** — say "all", "all but …", or list letters.
7. **Phones:** free natural scrolling with scroll-driven scene reveals (desktop keeps snap)? **Recommended: yes** (§7.5).
8. **Motion toggle** ("motion ✿ on/off" in nav + footer, needed for accessibility with looping motion): OK to show it? **Recommended: yes**, small and cute.
9. **Tempo:** 128 BPM (lively J-pop feel) as the site's rhythm? **Recommended: yes** — or tell me a song and I'll use its tempo.

---

## 13. Confidence

- **Clarity: 84%.** Answers to Q1–Q4 settle the MV feel; the D1 motion sample then closes the rest before the big build.
- **Technical: 88%.** All effects are standard GSAP/CSS; WebGL (Q4) and phone performance are the main risks, both with fallbacks and measured checks.

---

## 14. Resume protocol & progress

1. `git checkout designupdatev2` — confirm with `git branch --show-current`.
2. Read this file, then `docs/PROGRESS.md` §1 (hard rules: secret scan before every commit, no secrets in files, commit author/trailer, never force-push, SRI/CSP on CDN files).
3. Continue from the first unchecked box. Commit + push after each verified step (push = protected Vercel preview only). **Never merge into `main` without the owner's approval.**

- [x] D0.1 Branch `designupdatev2` from `main` @ `eef577f`
- [x] D0.2 Audit + plan v0.1
- [x] D0.3 Round 1 answers recorded → plan v0.2
- [ ] D0.4 Round 2 answers → plan v0.3 → owner approval
- [ ] D1 Style tile + motion sample
- [ ] D2 Foundations (+ credits removed)
- [ ] D3 Components
- [ ] D4 Scenes (desktop)
- [ ] D5 Phones/tablet + native scroll + mobile menu
- [ ] D6 Opening sequence
- [ ] D7 Motion system
- [ ] D8 Additions + gallery seed update
- [ ] D9 QA
- [ ] D10 Merge to `main` (owner go-ahead)

### Decision log

| Date | Decision | By |
|---|---|---|
| 2026-09-26 | Design work on branch `designupdatev2`; plan first, no code until approval | Owner |
| 2026-09-26 | Direction: Clover Scrapbook | Owner |
| 2026-09-26 | Admin panel keeps its current look | Owner |
| 2026-09-26 | Full layout freedom + additions allowed | Owner |
| 2026-09-26 | Motion: "music-video-ish but still a website" → MV-in-scenes concept | Owner / Claude |
| 2026-09-26 | Desktop cursor sparkle trail: yes | Owner |
| 2026-09-26 | Libraries, dashed usage, section accents, badge copy: delegated to Claude (GSAP 3.13, drop Anime.js/Animate.css, stitch on featured items, "Latest"/「最新」) | Owner → Claude |
| 2026-09-26 | Fredoka stays the main font; accent font allowed if it helps | Owner |
| 2026-09-26 | Remove "art by …" labels from sections/loader; credit those artworks in the gallery | Owner |
| 2026-09-26 | Cloudinary key/secret in Vercel: known loose end on `main`, owner will handle | Owner |
