# FORHANON.md — building the Hanon fan site (sister site of the Kotoha fan site)

> **For Claude, in the new Hanon repo.** The owner (Moesoft) wrote this guide with Claude inside `kotoha-fansite` and pasted it into the new repo.
> Read the whole file before doing anything. Then work through **§12 Open questions** with the owner (answers recorded there), then follow **§11 Build order**.
> **Version 1.2 — 2026-10-09** (owner answered Q1, Q2, Q3, Q6, then said "do all the recommended" → Q4, Q5, Q7, Q8 decided as recommended; only Q9 (art) is still open — see §12). Data was researched on 2026-10-09 and is marked ✅ verified / ⚠️ verify before seeding / ❓ unknown.
> **No secrets in this file, ever.** Credentials live only in `.env.local` (git-ignored) and Vercel env vars.

---

## 0. TL;DR

- Build an **unofficial, non-profit, bilingual (JA/EN) fan site for Hanon (はのん)**, Kotoha's partner in the duo **ハコニワリリィ (HaKoniwalily)**.
- It must **feel like a sibling of the Kotoha fan site** (same scrapbook atmosphere, same layout and sections, same fonts, same motion quality) while being **clearly Hanon's**: her colours (blue 🩵), her mark (🐧), her motifs (ripples, さざなみ, stars).
- **Same tech stack and architecture** as `kotoha-fansite`: vanilla HTML/CSS/JS (no build step), Vercel Functions, Neon Postgres, Cloudinary, Vercel hosting, admin panel. Best start: a copy of the `kotoha-fansite` code, then rebrand (§4).
- **Build it optimized from day one.** Everything learned in the Kotoha performance pass is in §9. Don't reintroduce snapping, Lenis, blurred cards, page-wide per-frame variables or `content-visibility` on sections.
- **Assets** (logo, backgrounds, loader art, model sheets, avatar, pose, mascot) **are provided by the owner**, mirroring the Kotoha set (§6.4). Don't download or generate artwork.
- Do **not** create GitHub repos, Vercel/Neon/Cloudinary projects or anything outward-facing without the owner's explicit OK. Never touch the Kotoha site's resources.

---

## 1. The two sites side by side

| | Kotoha fan site (exists) | Hanon fan site (to build) |
|---|---|---|
| Repo | private `PastelSalt/kotoha-fansite` | new repo (owner creates it) |
| URL | `kotoha-fansite.vercel.app` | `hanon-fansite.vercel.app` (✅ Q5) |
| Theme name | "Clover Scrapbook" | **"Sazanami Scrapbook"** (さざなみ = ripples, from her catchphrase) |
| Mark / motif | 🍀 illustrated filled clovers | 🐧 illustrated filled penguin + ripples, water drops, stars (✅ owner, Q2) |
| Page base colour | pink `#fe9fb9` | Hanon blue `#b7d7ef`, her official image colour (✅ owner, Q1, §5.2) |
| Sticker / button colour | green `#2f7a1f` | deep blue `#1f5e9e` + penguin-gold accents (✅ Q1) |
| Fonts | Fredoka · M PLUS Rounded 1c · Yomogi | **the same** (owner decision) |
| Sections | Home · About · News · Discography · Gallery · Footer | the same |
| Stream schedule | Tue & Fri 21:00 JST | **Mon & Thu 21:00 JST** (#はのらじ) |
| Special days | June 10 (birthday), July 8 (debut) | **March 6** (birthday) + **July 9** (VTuber debut anniversary) (✅ Q6) |

**Cross-links (✅ Q8):** each site links to the other in the footer ("Sister site: Kotoha fan site 🍀" / "Hanon fan site 🐧") **once both are live**. Adding the link to the Kotoha site is approved for that moment (it's a separate commit in the Kotoha repo).

---

## 2. Rules carried over from the Kotoha project (non-negotiable unless the owner changes them)

1. **No secrets in tracked files** (code, SQL, docs, commits, logs). Bootstrap admin credentials only in `.env.local` and Vercel env vars. Scan `git diff --cached` for secrets before every commit.
2. **No permanent deletion of DB content.** Deletes move to `archived_content` (copy + delete in one transaction). Exceptions: gallery image *files* are permanently destroyed in Cloudinary (record archived), the one-time pre-launch reset, and data retention (login attempts 30 d, raw analytics 90 d, expired sessions).
3. **Roles are `owner` and `admin`** (never "Super Admin"). Admin usernames are auto-numbered `<owner-username>2`, `3`, … from the DB. Numbers are never reused.
4. **Admin-entered DB text is single-field, shown as typed in both languages.** Only static UI, About and footer text is bilingual (locale files). Names/titles are entered once in their original form.
5. **Sections show ALL records** (paged loading inside lists); Home shows the newest video and the 2 newest news items. Newest first everywhere.
6. **No sound.** No Howler.
7. **Never fabricate content.** Seed only researched/official data (this file §7). Short summaries Claude writes in Japanese go into `docs/JA_REVIEW_LIST.md` for native review.
8. **Never put words in Hanon's mouth.** Speech bubbles are the *site's* voice ("new cover ♡", "thank you, artists!").
9. **Ask the owner first** before: downloading files, installing software that needs accepting terms, deleting/overwriting anything you didn't create, any outward-facing action (repos, deploys to a new domain, DB/Cloudinary project creation).
10. **Git:** `main` = production, every push deploys. Author = `Moesoft: Moeko Software and Technologies <214653345+PastelSalt@users.noreply.github.com>` (repo-local config; set it with `git config user.name/user.email` once, or pass `--author`). Never force-push, never skip hooks. Commit trailer as instructed by the session's system prompt. Design branches merge to `main` only with the owner's OK.
11. **Security:** parameterized SQL only; `textContent` for DB text (never `innerHTML` with data); server-side auth checks on every admin API; Owner-only checks on account APIs; CSP + SRI.
12. **Accessibility & motion:** respect `prefers-reduced-motion` (calm mode) and the site's motion toggle; keyboard reachable; visible focus; never disable zoom; nothing smaller than 13 px; AA contrast.
13. **Owner's style preference:** the owner is "bad at frontend design/animation" and gives Claude wide creative freedom, but wants a **dense, creative, Japanese-fan-site feel** (never Western minimalism, no empty areas, illustrated filled icons, never hollow outlines). When asking questions, give a recommendation and a confidence level. Continue between checkpoints on your own.

---

## 3. Tech stack & architecture (same as Kotoha)

| Layer | Choice | Notes |
|---|---|---|
| Front end | Plain HTML + CSS (cascade layers) + vanilla ES modules, **no build step** | `public/` is the web root |
| Fonts | Google Fonts: **Fredoka** 500/600/700, **M PLUS Rounded 1c** 500/700/800, **Yomogi** (tiny doodle notes only) | injected by `prepaint.js` so they never block first paint |
| Animation | **GSAP 3.15.0 + SplitText** (jsDelivr, SRI) for arrival choreography; **native CSS scroll-driven animations** for reveals/parallax; Web Animations API for micro-interactions | GSAP: `sha256-krualkdvmD0hKivE9UyIkDnBaW3URh1ApzaGCThXD7s=`, SplitText: `sha256-QZ9wJ6XwhqEst5iHNtj906btIgAilmHeJbZijKfO00Q=` (re-verify against the served bytes) |
| Confetti | **canvas-confetti 1.9.4**, injected after the loader by `fx.js` | `sha256-SfS8vFbnzrXD0l0T2x0NqWW2zRyKVKcHuwVb4GhbCpU=`; Hanon shape 🐧 instead of 🍀 |
| Icons | Lucide icons inlined as an SVG sprite on the public page (no Lucide runtime); full pinned Lucide only in the admin | |
| Scrolling | **native browser scrolling, no library, no snapping** | see §9 |
| API | Vercel Functions, plain Node `(req, res)`, ESM: `api/public.js`, `api/auth.js`, `api/admin.js`, `api/track.js` | rewrites pass `?__route=`; `cleanUrls` on |
| DB | **Neon Postgres** over HTTP (`@neondatabase/serverless`) | free compute sleeps ~5 min, wakes in ~10 s → edge `stale-while-revalidate`, loader waits max 4 s for home data, client timeout 15 s |
| Images | **Cloudinary** signed uploads (no SDK), `f_auto,q_auto` + `srcset` delivery | own folder + preset for Hanon (§10) |
| Auth | Argon2id (`@node-rs/argon2`), DB sessions in an `__Host-` cookie, 7 d / 2 h idle, forced password change, HIBP check, lockout 5 tries / 15 min | |
| Analytics | first-party, cookieless daily hash, JST days, Monday weeks, lazy rollup, 90-day raw retention, production events only | |
| Hosting | Vercel, region `sin1` | |
| Dev tooling | `scripts/dev-server.js` (local stand-in for `vercel dev`), `scripts/migrate.js`, `run-sql.js`, `admin-bootstrap.js`, `optimize-images.js` (sharp), `seed-gallery.js`, `prelaunch-reset.js` | Node ≥ 22 |

**Public page structure** (`public/index.html`): static loader markup (spins before any script) → fixed `.backdrop` (all section artworks, crossfading) → floating `.site-nav` pill → `#mobile-menu` (circle reveal) → scenes `#home #about #news #discography #gallery` (`data-section`, `data-art`, `data-accent`) → footer → `<dialog id="lightbox">`.

**Admin panel** keeps the plain admin look (`public/css/admin.css`, `public/js/admin/*`, `login.html`, `admin.html`). Only rebrand names, logo and colours there.

---

## 4. Starting the repo: copy, then rebrand

**Decided (✅ Q4):** start from a copy of `kotoha-fansite` at its latest `main` (it includes the performance pass and the 2026-10-09 data fixes). Ask the owner only *how* the code gets into the new repo (they may copy the folder, or give access). Then:

### 4.1 Don't copy

`docs/kotoha_*.md`, `docs/JA_REVIEW_LIST.md` content, `docs/PROGRESS.md` history (start a fresh one with the same structure), `previous_failed_attempt_*`, `.kilo/`, `references/` (owner supplies Hanon references), `assets/` and `public/assets/{bg,img}` artwork (owner supplies Hanon art), `.env.local`, `.vercel/`, `node_modules/`. `public/js/public/motion/wipe.js` is unused (the snap it served is gone); drop it unless the owner wants a wipe on nav jumps.

### 4.2 Rename / replace checklist (grep `kotoha|Kotoha|KOTOHA|ことは|ことリス|Kotorisu|kf_|clover|cl-leaf|🍀` and go through every hit)

| Where | Kotoha value | Hanon value |
|---|---|---|
| `package.json` | `kotoha-fansite`, description | `hanon-fansite`, "Unofficial bilingual fan site for Hanon — by Moeko Software and Technologies" |
| `lib/auth.js`, `api/track.js` | cookie `__Host-kf_session`, `kf_session_dev` | `__Host-hf_session`, `hf_session_dev` |
| `prepaint.js`, `i18n-core.js`, `admin/prepaint.js` | `localStorage kf_lang` | `hf_lang` |
| `motion-boot.js`, `motion/prefs.js` | `localStorage kf_motion` | `hf_motion` |
| `lib/cloudinary.js`, `.env.example`, `seed-gallery.js` | folder `kotoha-fansite/gallery`, preset `kotoha_gallery_signed`, tags `kotoha-gallery`, `kotoha-seed` | `hanon-fansite/gallery`, `hanon_gallery_signed`, `hanon-gallery`, `hanon-seed` |
| `lib/password.js` | site-word blocklist (kotoha, kotorisu, clover, lily, …), example `KotohaClover2026!` | hanon, hanomen, はのメン, penguin, pengin, sazanami, hakoniwa, lily, stella, … |
| `api/admin.js`, `scripts/prelaunch-reset.js` | `kotoha-fansite` strings | `hanon-fansite` |
| `scripts/optimize-images.js`, `seed-gallery.js` | `kotoha_logo`, `kotoha_pose`, `kotoha_profile_picture_square`, `kotoha_fullbody_model*`, `kotoha_mascot_*` | the owner's Hanon file names (§6.4) |
| `public/js/public/data.js` | SOCIALS, OFFICIAL_LINKS, CREDITS | Hanon values (§7.3, §7.9) |
| `public/js/public/countdown.js` | `STREAM_DAYS = [2, 5]` (Tue, Fri) | **`[1, 4]` (Mon, Thu)**, `START_UTC_HOUR = 12` (= 21:00 JST) |
| `public/js/public/home.js` week strip | hard-coded `i === 1 \|\| i === 4` (Tue/Fri in a Mon-start week) | `i === 0 \|\| i === 3` (Mon/Thu). **Better: export one schedule constant from `countdown.js` and use it in both** (the duplication is a Kotoha-site wart) |
| `public/js/public/fx.js` | special days `6-10`, `7-8`; confetti `🍀`, greens/pinks | **`3-6`, `7-9`** (JST); `🐧`, blues/white/gold |
| `public/locales/{en,ja}.json` | all Kotoha copy | Hanon copy (§7) |
| `public/index.html` | titles, meta, OG, hreflang URLs, marquee, bg words (KOTOHA…), vertical text, badge text, alt texts | Hanon equivalents |
| `public/css/v2/tokens.css` | pink/green scales, accents | Hanon palette (§5.2) |
| `public/assets/svg/v2-sprite.svg` | `#cl-leaf`, `#cl-round` (+ `#spark`, `#heart`) | new illustrated Hanon symbols (§5.3); keep `#spark`, `#heart` |
| `vercel.json` | CSP, headers | same CSP (check `img-src` hosts); same headers |
| `db/migrations/0001_init.sql` | comments mention Kotoha | text only |
| `db/seed.sql` | Kotoha data | §7 data |

Run the whole page in EN and JA afterwards and grep again: no Kotoha leftovers except intentional duo mentions (Hanon×Kotoha covers, sister-site link).

---

## 5. Visual identity — "same family, Hanon's own colours"

### 5.1 Keep (shared atmosphere)

The whole scrapbook vocabulary from `docs/DESIGN_SYSTEM.md` of the Kotoha repo: paper notes taped onto fan art, die-cut stickers, stitches only on featured items (≈4–6 per screen), washi tape, numbered EN/JA section titles (`NO. 01` badge + big outlined word + JA pill), giant outlined background words, vertical Japanese text at section edges (never over the character's face), rotating text badge, speech bubbles (site voice), stamps ("NEW", "PICK UP!"), grid/lined/lace paper textures, gingham, polaroid video, film strip, record sleeves, flip-digit stream ticket, weekly schedule strip, marquee ribbon, fan-art-of-the-moment card, masonry gallery with a lightbox that grows from the tile, fixed crossfading artwork backdrop, loader with spinning pair + petal-style progress + "Did you know?" facts + iris exit, motion toggle + calm mode, one tempo (128 BPM, `--beat` 469 ms), springy easing. **Same fonts, same spacing scale, same radii, same layout grid and section compositions.**

### 5.2 Change (Hanon's identity) — palette ✅ approved by the owner (Q1: "Blue + gold", cool-white cards)

Hanon's official image colour: **blue 🩵**, hex `#b7d7ef` (fan wiki also lists `#79b5ff`). Kotoha's site is pink background + green stickers; Hanon's mirrors it as **blue background + deep-blue stickers + penguin-gold accents**, with navy ink instead of green-grey ink. Contrast ratios below were computed (WCAG 2.x):

| Token (Hanon) | Value | Role (Kotoha equivalent) | Contrast check |
|---|---|---|---|
| `--sky-50` | `#f3f9fe` | lightest tint (`--pink-50`) | |
| `--sky-100` | `#e2f0fb` | footer / soft panels (`--pink-100`) | |
| `--sky-200` | `#cde4f6` | highlights (`--pink-200`) | |
| `--sky-300` | **`#b7d7ef`** | **page base / persistent background** (`--pink-300 #fe9fb9`) | navy ink on it 8.6 : 1 |
| `--sky-400` | `#79b5ff` | bright brand blue for fills, clover-equivalent icons | decorative only |
| `--sky-500` | `#4a90d9` | mid blue (shadows tints, borders) | decorative |
| `--sky-700` | **`#1f5e9e`** | buttons, links, stickers, white-on-blue (`--green-700`) | white on it **6.7 : 1**; as text on paper **6.4 : 1** |
| `--sky-900` | `#163f6b` | hover/darkest (`--green-900`) | white 10+ : 1 |
| `--gold-100` | `#fff3c4` | penguin-beak tint for chips/stamps | |
| `--gold-300` | `#ffd66b` | penguin-gold accent (stars, beak, sparkles) | decorative |
| `--gold-500` | `#f2b632` | stronger gold (stamps, ribbons) | decorative |
| `--gold-700` | `#a35f00` | white-on-gold labels (`--pink-700 #b8325f` role: "NEW" stamp, ribbons) | white on it **5.0 : 1** |
| `--paper` / `--paper-rgb` | **`#f7fbff`** / `247 251 255` (cool white; Kotoha uses cream `#fffaf2`) | cards (94 % opaque, no blur) | ink on it 12.4 : 1 |
| `--ink` / `--ink-soft` | `#22324a` / `#4a5b72` | body / meta text | 12.4 : 1 / 6.7 : 1 on paper |
| `--accent-home/about/news/disco/gallery` | pick from each Hanon artwork once the owner supplies it (Kotoha did the same). Placeholders: lilac `#cdc3f5`, aqua `#bdeef0`, lemon `#fff0a8`, coral `#ffc4b8`, mint `#c9efdc` | per-section tape/accent | decorative |

Shadows: tint them towards navy/blue (Kotoha tints towards pink/green), e.g. `rgb(31 63 107 / .4)`; never grey-black. The loader art and the backdrop `--veil` become a soft sky-white veil (`rgb(226 240 251 / .12 → .22)`).

**Duo touch:** wherever Hanon×Kotoha/HaKoniwalily items appear (covers, unit releases, events), show a tiny 🍀 next to the 🐧 or the unit's 🕊🤍; it ties the two sites together.

### 5.3 Motifs, icons, loader

- **Sprite** (`v2-sprite.svg`), same construction rules as the Kotoha clovers: **illustrated, filled, die-cut white edge, gloss, never a hollow outline**, colours via `--c1..--c4`:
  - `#pg-penguin` — round chibi penguin sticker (replaces `#cl-leaf` as the main icon: section titles, pins, week-strip stream days, mini titles, credits list bullets).
  - `#drop` — water drop; `#ripple` — 2–3 concentric ripple rings (さざなみ); `#star` — 4-point "stella" star (nod to StellaPhizz); keep `#spark` and `#heart`.
  - **XML comments in the SVG must never contain `--`** (it silently breaks the whole sprite — happened on Kotoha).
- **Loader spinner** ✅ (owner, Q2) — Kotoha's is two counter-rotating clovers whose 4 petals fill with real progress (the owner explicitly wanted them to keep turning). Hanon's: **two counter-rotating 4-point stars** (outer white with a blue edge, inner pale blue) whose **4 rays light up with real loading progress**, with a **small penguin in the centre** (the penguin itself doesn't rotate). Same static-inline-SVG + CSS-rotation technique so it spins before any script runs (and slower in calm mode); same iris exit.
- **Background words:** `HANON`, `PROFILE`, `NEWS`, `MUSIC`, `FAN ART`. Rotating badge: `HANON ✦ FAN SITE ✦ はのん ✦`. Vertical JP text examples: 「さざなみのように癒す歌声」, 「はのんの最新情報」, 「はのメン大集合」 (site voice; JA review list).
- **Marquee:** `HANON ✦ はのん ✦ HaKoniwalily ✦ StellaPhizz ✦ HoneyWorks ✦ はのメン 🐧 ✦ #はのらじ ✦ #はのうた ✦ #はのぴく ✦` (no AiceClass — see §7.1).
- **Confetti:** `shapeFromText('🐧')` + circles; colours `#79b5ff #b7d7ef #ffffff #ffd66b #1f5e9e`.
- **Mascot cameo / "tap Hanon" pose interaction:** same mechanics as Kotoha, with Hanon's pose and mascot art (owner supplies; ❓ whether Hanon has a mascot like Kotoha's).

---

## 6. Content model & sections (same as Kotoha)

### 6.1 Sections

| Section | Content | Source |
|---|---|---|
| Loader | random 1 of 3 loader artworks, spinner, "Did you know?" facts from About | static + locale |
| Home | name logo, unit/role tags, socials, next-stream ticket (Mon/Thu 21:00 JST), this week strip, fan-art-of-the-moment, coming-soon card, 2 newest news, newest video polaroid, badge, marquee | DB + static |
| About | profile card (avatar + facts pills), bio, hashtags, full-body pose on a ripple/penguin stage, bubble | locale files (hard-coded, bilingual) |
| News | all news (paged), latest-works player + film strip of all videos | DB |
| Discography | coming-soon wide card, release sleeves (YouTube thumbnail covers), achievements timeline | DB |
| Gallery | infinite masonry, credited fan art + official art, lightbox | DB + Cloudinary |
| Footer | Moesoft logo, disclaimer, obfuscated contact email (the owner's, not Hanon's), official links, credits, privacy note, sister-site link | static |

### 6.2 DB schema

Reuse `db/migrations/0001_init.sql` unchanged (tables: `admin_users`, `admin_sessions`, `login_attempts`, `videos`, `news`, `achievements`, `discography_items` with `release_type in (single, album, ep, tie_in, cover, collab, other)`, `gallery_images`, `archived_content`, `activity_log`, analytics tables). News `links` = up to 3 `{url, label_key}` with `label_key in (watch, listen, details, tickets, official, shop)`.

### 6.3 Analytics events (keep working)

`page_view`, `loader_timing`, `section_dwell` (home/about/news/discography/gallery/footer), `outbound_click`, `video_play`, `news_link_click`, `gallery_open`, `gallery_credit_click`, `language_switch` — wired by `data-track*` attributes.

### 6.4 Assets the owner will provide (mirror of the Kotoha set)

Run them through `npm run images:optimize` (sharp → WebP at these sizes):

| Kotoha file(s) | Hanon equivalent needed |
|---|---|
| `bg/home|about|news|discography|gallery-{1280,1920,(2560)}.webp` + portrait `-p720/-p1080` | 5 section artworks (credited fan art), landscape + portrait crops |
| `bg/loader{1,2,3}-…` | 3 loader artworks |
| `img/logo-{500,1000}.webp` | Hanon name logo (transparent) |
| `img/profile-{200,400}.webp` | avatar (square) |
| `img/pose-{450,900}.webp` | full-body pose (transparent) |
| `img/mascot-{300,600}.webp`, `mascot-front-240.webp` | mascot (if any) |
| `img/icon-{x,youtube,twitch,twitcasting}-96.webp` | **reuse as is** (platform icons) |
| `img/moesoft-{360,707}.webp` | **reuse as is** (Moesoft logo) |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.jpg` | Hanon versions (🐧 / blue) |
| `model/*fullbody_model*.png`, `*modelsheet.png` | official model sheets for the gallery seed (credit: as on the official reference) |

Credits for every artwork go into `CREDITS` in `data.js` (X handle + post URL; `null` → "Artist unknown (作者不明)").

---

## 7. Researched data for Hanon (seed + About + data.js)

Sources are listed in §13. "Shared" items are identical on the Kotoha site; reuse its wording where it exists.

### 7.1 Status notes (read first)

- ⚠️ **AiceClass appears to be dissolved.** **Owner decision (Q3): mention AiceClass only as history** (e.g. "VTuber debut in July 2023 with AiceClass"); never as her current agency. The Kotoha site was changed the same way on 2026-10-09 (role → "Singer · VTuber · HaKoniwalily", debut pill "July 8, 2023 (with AiceClass)", AiceClass chip → "Singer · VTuber", marquee without AiceClass; the non-affiliation disclaimer and the "© AiceClass" model credit stay). Copy that wording pattern. The Idol department was dissolved on **2025-10-31** (official AiceClass X post, 2025-10-14). Search results show an official notice 「AiceClass」解散のご報告に関するお知らせ dated **2026-06-18**, and **aiceclass.com now returns 404 on every page** (checked 2026-10-09). Hanon's lit.link no longer mentions AiceClass; her bio reads 「Hanonです！歌を歌ってます。2人組女性ボーカルユニット『ハコニワリリィ』、3人組音楽ユニット『StellaPhizz』としても活動しています！」. Wikipedia lists the unit's office as **MARUMOCHI** (HoneyWorks-related) and label **Pony Canyon**. → **Don't present AiceClass as her current agency.** (See the decision above.)
- Hanon is in **two units**: ハコニワリリィ (with Kotoha) and **StellaPhizz** (with keyboardist 宇都圭輝 and DJ/composer 早川博隆). She is also a **HoneyWorks guest/support vocalist** ("HoneyWorks feat. Hanon").
- Her **stream schedule differs from Kotoha's**: #はのらじ **Mondays & Thursdays 21:00** JST (lit.link). Recent streams are on YouTube (e.g. GTA V "#SURGETown" event, Sept 2026), plus TwitCasting/Twitch.

### 7.2 Profile (About section)

| Field | Value | Status |
|---|---|---|
| Name | Hanon (はのん) | ✅ |
| Role | Singer · VTuber/VSinger · vocalist of ハコニワリリィ · vocalist of StellaPhizz · HoneyWorks guest vocal | ✅ |
| Birthday | **March 6** (Pisces) | ✅ lit.link, hololist |
| Height | 152 cm (same as Kotoha) | ✅ fan wiki, hololist, AiceClass profile (via search) |
| Blood type | O | ⚠️ fan wiki only |
| Image colour | Blue 🩵 — `#b7d7ef` (fan wiki also: `#79b5ff`) | ✅ lit.link "Blue", hex from fan wiki |
| Fan name | **はのメン** (Hanomen) | ✅ lit.link |
| Fan mark | **🐧** | ✅ lit.link |
| Unit fan name | ハコニワリリィ fans: **ハコ船** 🕊🤍 | ✅ lit.link |
| Supporters credited in her covers | 「皇帝ペンギンたち」 (Emperor penguins — the Special Thanks list in her cover descriptions; likely FANBOX supporters) | ⚠️ meaning not confirmed |
| Catchphrase | 「さざなみのようにあなたを癒す✨」 | ⚠️ fan wiki |
| Favourite foods | からあげクン, dumplings (餃子?) ; きのこ派 (kinoko side) | ✅ lit.link (foods) / ⚠️ wiki (きのこ派) |
| Hobbies | singing, watching movies, eating delicious food, sleeping | ⚠️ from the old AiceClass profile via search |
| Activity start | 2018, as a HoneyWorks guest vocalist (fan wiki: 2018-08-28) | ⚠️ date |
| VTuber debut | announced **2023-07-02**, first stream **2023-07-09** (AiceClass Artist dept.) | ✅ hololist / fan wiki / news |
| Character design | はなあられ (@mg_rui1777) | ✅ hololist + fan wiki (same as Kotoha) |
| Live2D | 鍋公かお (@omaehadareda) | ✅ (same as Kotoha) |
| Regular stream | **#はのらじ — Mon & Thu 21:00 JST** | ✅ lit.link |
| YouTube | 33.6万 (336K) subscribers | ✅ 2026-10-09 |
| Unit description (official) | ハコニワリリィ: 「圧倒的な歌唱力で幅広いジャンルを歌いこなす『Hanon』と、透明感のある歌声で聴く人すべてを魅了する『Kotoha』」 (paraphrased from hakoniwalily.jp/profile & Wikipedia) | ⚠️ check exact wording |
| MARUMOCHI profile (official) | 「YouTubeや配信をメインに活動している女性ボーカリスト。Kotohaとのユニット『ハコニワリリィ』として2021年メジャーデビューを果たしている。」 | ✅ marumochi.net |

**Suggested About pills** (mirror Kotoha's 8): Birthday (March 6 · Pisces) · Height (152 cm) · Activities (ハコニワリリィ with Kotoha · StellaPhizz · HoneyWorks guest vocal) · Debut (singer 2018 · VTuber July 9, 2023) · Fans (はのメン · fan mark 🐧 · image colour blue) · Streams (Mon & Thu 21:00 JST · #はのらじ) · Hashtags (#はのらじ live · #はのうた songs · #はのぴく fan art) · Favourites (からあげクン, dumplings).
**"Did you know?" loader facts:** her fans are はのメン 🐧; she and Kotoha are both 152 cm; she also sings in the synth trio StellaPhizz; she sang the OP of 『29歳独身中堅冒険者の日常』 solo as "HoneyWorks feat.Hanon"; #はのぴく fan art may be used for her thumbnails.

### 7.3 Official links (data.js)

| Platform | URL | Status |
|---|---|---|
| X (main) | https://x.com/Hanon_moco | ✅ |
| X (sub) | https://x.com/Hanon_moco_sub | ✅ lit.link |
| YouTube | https://www.youtube.com/@Hanon_moco — channel ID `UCJB1hgmiAD4ysg0Ao7uS8Rw` (RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=UCJB1hgmiAD4ysg0Ao7uS8Rw`) | ✅ |
| YouTube (sub) | `@Hanon_sub` | ⚠️ fan wiki only |
| Twitch | https://www.twitch.tv/hanon_moco | ✅ |
| TwitCasting | https://twitcasting.tv/hanon_moco | ✅ |
| Instagram | https://www.instagram.com/hanon.moco/ | ✅ |
| TikTok (はのこと, shared with Kotoha) | https://www.tiktok.com/@hanon_kotoha | ✅ |
| Bluesky | https://bsky.app/profile/hanonmoco.bsky.social | ✅ hololist |
| pixiv FANBOX | https://hanon-moco.fanbox.cc/ | ✅ (plan names/prices ❓ — page needs JS) |
| Music streaming (TuneCore) | https://www.tunecore.co.jp/artists/Hanon_moco | ✅ |
| lit.link | https://lit.link/Hanonmoco | ✅ |
| ハコニワリリィ official | https://hakoniwalily.jp/ (contact form `/contact/`) | ✅ shared |
| ハコニワリリィ X | https://x.com/HaKoniwalily | ✅ shared |
| ハコニワリリィ YouTube | https://www.youtube.com/channel/UCYRSuz5cmJeSNnGB7jedITg (appears as "MARUMOCHI from HoneyWorks") | ✅ shared |
| ハコニワリリィ LINE | https://lin.ee/gnx2B3X | ✅ shared |
| Goods (BOOTH) | https://hanon-goods.booth.pm/ | ✅ shared (also on the Kotoha site) |
| StellaPhizz X / YouTube / Instagram / BOOTH | https://x.com/StellaPhizz · https://www.youtube.com/@StellaPhizz (`UCCv2mDzPFrmsIQrWTC17j9w`) · https://www.instagram.com/stellaphizz/ · https://stellaphizz.booth.pm/ | ✅ |
| CeVIO AI (Hanon & Kotoha voice library 「箱庭ハノ・コト」) | https://hakoniwa-hanokoto.jp/ | ✅ |

Home socials row (like Kotoha's 4 badges): X, YouTube, Twitch, TwitCasting — all `hanon_moco` / `@Hanon_moco`.
Business contact and the fan-letter address are public on lit.link (letters: 〒106-0044 東京都港区東麻布 3-1-2 Inxlab ハコニワリリィ(Hanon)宛). Don't put Hanon's business email on the site; link the official contact form if needed.

### 7.4 Hashtags

| Tag | Use | Status |
|---|---|---|
| #はのらじ | streams | ✅ |
| #はのうた | song posts | ✅ |
| #はのぴく | fan art (may be used for her thumbnails) | ✅ |
| #はのらじポスト | messages read on stream | ✅ |
| #はの日和 | fan activity / support | ✅ |
| #はのことうた | Hanon×Kotoha songs | ✅ lit.link |
| #見どころはのぴ | clips | ⚠️ fan wiki |

### 7.5 Videos seed (latest works; stream replays excluded) — all ✅ (dates = YouTube publish dates)

| youtube_id | title | posted_on | channel |
|---|---|---|---|
| `ev4W3pNB66k` | CLEAR／坂本真綾【Covered by Hanon】 | 2026-09-25 | Hanon |
| `FLH4EoRCgSQ` | 劇薬中毒 /＝LOVE（イコールラブ）【Covered by Hanon×Kotoha】 | 2026-09-24 | Kotoha (duo) |
| `-aZ5pArxNW0` | My Dearest／supercell【Covered by Hanon】 | 2026-09-07 | Hanon |
| `BUMqSPEQAuE` | only my railgun／fripSide【Hanon×Kotoha】 | 2026-08-25 | Hanon (duo) |
| `1ee-apkUVwo` | 星が瞬くこんな夜に／supercell【Hanon×Kotoha】 | 2026-08-16 | Hanon (duo) |
| `UN0pPZ_hXrA` | mosi mosi?／楽音【Covered by Hanon】 | 2026-07-26 | Hanon |
| `PTAGxi1Fmkc` | オトメノホンキ／Hanon solo ver. 【Music Video】 | 2026-07-24 | Hanon |
| `Hvzkn-E1mv0` | ふらすとれーしょん・がーる／Hanon【Music Video】 (Hanon original, ボカデュオ team with ENPITU) | 2026-07-20 | Hanon |

Kotoha's seed had 3 videos; seed **at least the newest 3** (CLEAR, 劇薬中毒, My Dearest), more if the owner wants the film strip full. Note: the オトメノホンキ solo MV title says "OPテーマ" but its description and the official news say **ED** theme of 『乙女怪獣キャラメリゼ』 — use **ED**.

**Most popular (for "Did you know?" / About):** 金曜日のおはよう -another story-／HoneyWorks【Covered by Hanon】 (`H0qsdnaWWTo`, 7.89M views) · W/X/Y／Tani Yuuki (`aZm92Iv4l1c`, 5.75M) · 猫／DISH// (`weELCo5vI4o`, 5.02M) · ベテルギウス／優里 (`kUQXIxK1fpI`, 4.39M) · 花の塔／さユり【Hanon×Kotoha】 (`u2qNfxs2nzc`, 4.21M) · 【MV】恋文／HoneyWorks feat. Hanon×Kotoha (`hGqCNzQ-DqQ`, 1.94M, 2020-04-11) · ワタシノミカタ／HoneyWorks feat. Hanon (`J_Fp3BIEpWM`, 2.24M, 2020-08-23). (View counts as of 2026-10-09.)

### 7.6 News seed (newest first; links verified unless marked)

| posted_on | headline (as shown) | summary (JA, Claude-written → JA review list) | links |
|---|---|---|---|
| 2026-10-06 | 「影響力∞アイドル」リリース記念キャンペーン、開催決定！ | HoneyWorks feat.ハコニワリリィ「影響力∞アイドル」のリリース記念キャンペーンが決定しました。 | details: https://hakoniwalily.jp/news/20261006-2000/ |
| 2026-09-25 | CLEAR／坂本真綾【Covered by Hanon】公開！ | Hanonの歌ってみた最新作がYouTubeで公開されました。 | watch: https://www.youtube.com/watch?v=ev4W3pNB66k |
| 2026-09-24 | 劇薬中毒 /＝LOVE【Covered by Hanon×Kotoha】公開！ | HanonとKotohaによるカバー動画がKotohaのチャンネルで公開されました。 | watch: https://www.youtube.com/watch?v=FLH4EoRCgSQ |
| 2026-09-15 | HoneyWorks feat.ハコニワリリィ、2nd EVENT「Wonder Greeting」チケット2次先行 申込開始！ | (reuse Kotoha seed) | tickets: https://hakoniwalily.jp/news/20260915-2000/ |
| 2026-09-07 | My Dearest／supercell【Covered by Hanon】公開！ | 大好きなアーティストの楽曲をカバーした新作が公開されました。 | watch: https://www.youtube.com/watch?v=-aZ5pArxNW0 |
| 2026-08-27 | TVアニメ「世界最強の魔女、始めました」のOP主題歌がHoneyWorks feat.ハコニワリリィ「影響力∞アイドル」に決定！10月7日デジタルリリース！ | (reuse Kotoha seed) | details: https://hakoniwalily.jp/news/20260827-1200/ |
| 2026-08-25 | only my railgun／fripSide【Hanon×Kotoha】公開！ | ハコリリの2人によるカバー動画が公開されました。 | watch: https://www.youtube.com/watch?v=BUMqSPEQAuE |
| 2026-08-15 | HoneyWorks feat.ハコニワリリィ、2nd EVENT「Wonder Greeting」開催決定！ | (reuse Kotoha seed) | details: https://hakoniwalily.jp/news/20260815-1615/ |
| 2026-07-24 | オトメノホンキ（Hanon solo ver.）Music Video公開！ | TVアニメ『乙女怪獣キャラメリゼ』EDテーマのHanon solo ver. MVが公開されました。 | watch: https://www.youtube.com/watch?v=PTAGxi1Fmkc |
| 2026-07-20 | Hanonオリジナル曲「ふらすとれーしょん・がーる」MV公開！ | ENPITUさんとのボカデュオ参加曲がMVとして公開されました。 | watch: https://www.youtube.com/watch?v=Hvzkn-E1mv0 |
| 2026-07-17 | StellaPhizz「エレクトリック・シティ」MV公開！ | HanonがボーカルをつとめるStellaPhizzの新曲MVが公開されました。 | watch: https://www.youtube.com/watch?v=ErJpQeiwzhw |
| 2026-07-03 | 「HoneyWorks Presents ハニフェス 2026 ～女子校文化祭 ハロウィンパーティ～」出演決定！ | (reuse Kotoha seed) | details: https://hakoniwalily.jp/news/post-0107/ |

More official items (2026-07-15 夏祭り CD campaign, 2026-07-06 オトメノホンキ campaign, 2026-06-07 ED decision, 2026-05-25 夏祭り key visual) are in the Kotoha seed — reuse.

### 7.7 Achievements (timeline) — compiled; Hanon has **no official 実績 list** on lit.link (Kotoha had one)

| Date | Text (JA) | Status |
|---|---|---|
| 2026-10-07 | TVアニメ「世界最強の魔女、始めました」OP主題歌「影響力∞アイドル」歌唱担当（HoneyWorks feat.ハコニワリリィ） | ✅ (released — publish) |
| 2026-09-01 | ハコニワリリィ メジャーデビュー5周年（記念配信） | ✅ unit channel |
| 2026-07-17 | StellaPhizz「エレクトリック・シティ」MV公開 | ✅ |
| 2026-07-08 | TVアニメ『乙女怪獣キャラメリゼ』EDテーマ「オトメノホンキ」歌唱担当（HoneyWorks feat.ハコニワリリィ） | ✅ |
| 2026-05 | TVアニメ『逃がした魚は大きかったが釣りあげた魚が大きすぎた件』OPテーマ「誓いはキュンと。」（HoneyWorks feat.ハコニワリリィ） | ⚠️ exact date/credit (unit cover posted 2026-05-06 on the MARUMOCHI channel; Hanon solo ver. MV 2026-05-09) |
| 2026-03-31 | 米津玄師, 宇多田ヒカル「JANE DOE」Hanon × Tani Yuuki カバー動画投稿 | ✅ |
| 2026-03-11 | ハコニワリリィ 1st ALBUM『フローライト』発売 | ✅ shared |
| 2026-01-07 | TVアニメ『29歳独身中堅冒険者の日常』OPテーマ「君が灯してくれた光を今」歌唱担当（**HoneyWorks feat.Hanon**） | ✅ official release page |
| 2025-10-06 | TVアニメ「笑顔のたえない職場です。」OPテーマ「絶対称賛！」歌唱担当（HoneyWorks feat.ハコニワリリィ） | ✅ shared |
| 2025-05-31 | ハコニワリリィ 1st EVENT「Floral Greeting」（竹芝ニューピアホール） | ✅ Wikipedia |
| 2025-02-22 | TVアニメ『忍者と殺し屋のふたりぐらし』ED主題歌「にんころダンス」歌唱担当 | ✅ shared |
| 2025-02-15 | StellaPhizz「Stella Symphony」MV公開 | ✅ |
| 2025-01-19 | CeVIO AI ボイスライブラリ「箱庭ハノ・コト」発売 | ✅ Wikipedia |
| 2025-01-16 | TVアニメ『男女の友情は成立する？（いや、しないっ!!）』OP主題歌「質問、恋って何でしょうか？」歌唱担当 | ✅ shared |
| 2024-08-16 | TVアニメ「結婚するって、本当ですか」OPテーマ「キラキラ」歌唱担当 | ✅ shared |
| 2024-08-09 | 3人組音楽ユニット StellaPhizz としてデビュー（「沈む世界の片隅で」配信） | ✅ news/interview |
| 2024-06-02 | 「ハニフェス～女子校文化祭」渋谷公演（LINE CUBE SHIBUYA）出演 | ✅ Wikipedia |
| 2024-04-29 | 「ハニフェス～女子校文化祭」日比谷公演（日比谷野外音楽堂）出演 | ✅ Wikipedia |
| 2023-07-09 | VTuberとして初配信（AiceClass アーティスト科） | ✅ |
| 2022-11 | 「Lily's Plage Tour」（名古屋・東京・神戸） | ✅ Wikipedia (exact dates 11/18–26) |
| 2022-09-28 | ハコニワリリィ 1st ALBUM『Lily's Plage』発売（オリコン最高20位） | ✅ |
| 2022-06-25 | ハコニワリリィ「Lily's Garden Party」（品川インターシティホール） | ✅ Wikipedia |
| 2022-06-01 | TVアニメ「阿波連さんははかれない」EDテーマ『キョリ感』歌唱担当 | ✅ shared |
| 2021-09-01 | TVアニメ「SDガンダムワールド ヒーローズ」EDテーマ『コガネゾラ』でメジャーデビュー（ハコニワリリィ） | ✅ shared |
| 2020-08-23 | 「ワタシノミカタ（ワタシノテンシ -another story-）／HoneyWorks feat. Hanon」公開 | ✅ YouTube |
| 2019-12-19 | HoneyWorks feat. Hanon×Kotoha 1st ALBUM『恋色同盟』発売 | ✅ official page says 2019.12.19 (the 恋文 MV description says 12/31 — use 12/19) |
| 2019-11-03 | ソロライブ「アイオライト」開催 | ⚠️ fan wiki/search only |
| 2018 | HoneyWorksのゲストボーカルとして活動開始 | ⚠️ exact date |

Also mentioned by Hanon (no date found): she appeared in the THE FIRST TAKE ver. of 「決戦スピリット」 (CHiCO with HoneyWorks). ⚠️ find the date before adding.

### 7.8 Discography (release sleeves)

| Title | release_type | Date | Note (credit/tie-in) | Status |
|---|---|---|---|---|
| 影響力∞アイドル | tie_in | 2026-10-07 | HoneyWorks feat.ハコニワリリィ / 「世界最強の魔女、始めました」OP | ✅ shared |
| エレクトリック・シティ | other (StellaPhizz) | 2026-07-17 (MV) | StellaPhizz | ✅ MV date; release date ⚠️ |
| ふらすとれーしょん・がーる | other | 2026-07-20 (MV) | Hanon original (Music: ENPITU), `Hvzkn-E1mv0` | ✅ |
| オトメノホンキ | tie_in | 2026-07-08 | HoneyWorks feat.ハコニワリリィ / 『乙女怪獣キャラメリゼ』ED; Hanon solo ver. MV `PTAGxi1Fmkc` | ✅ shared |
| 誓いはキュンと。 | tie_in | 2026-05 | HoneyWorks feat.ハコニワリリィ / 『逃がした魚は大きかったが…』OP; Hanon solo ver. `f-Ouq_OCbxU` | ⚠️ credit/date |
| フローライト | album | 2026-03-11 | ハコニワリリィ 1st ALBUM | ✅ shared |
| 君が灯してくれた光を今 | tie_in | 2026-01-07 | **HoneyWorks feat.Hanon** / 『29歳独身中堅冒険者の日常』OP | ✅ |
| 絶対称賛！ | tie_in | 2025-10-06 | 「笑顔のたえない職場です。」OP; Hanon solo ver. `gULXfNvUqyo` | ✅ shared |
| Stella Symphony | other (StellaPhizz) | 2025-02-15 (MV) | StellaPhizz, `myCfO_Akky0` | ✅ |
| にんころダンス | tie_in | 2025-02-22 | 『忍者と殺し屋のふたりぐらし』ED | ✅ shared |
| 質問、恋って何でしょうか？ | tie_in | 2025-01-16 | 『男女の友情は成立する？』OP | ✅ shared |
| 沈む世界の片隅で | single (StellaPhizz) | 2024-08-09 | StellaPhizz debut | ✅ |
| Autumn Vox | ep | 2024-08-12 | 同人 5th mini album (6 new songs) | ⚠️ date from Wikipedia |
| キラキラ | tie_in | 2024-08-16 | 「結婚するって、本当ですか」OP | ✅ shared |
| Spring Vox | ep | 2023-12-30 | 同人 4th mini album | ⚠️ sources say 12/22 or 12/30 |
| Winter Vox | ep | 2022-12-30 | 同人 2nd mini album | ⚠️ |
| Lily's Plage | album | 2022-09-28 | 1st major album | ✅ |
| Summer Vox | ep | 2022-08-13 | 同人 3rd mini album (incl. 決戦スピリット cover) | ⚠️ sources say 2022-08-13 or 2023-08-05 |
| キョリ感 | single | 2022-06-01 | 「阿波連さんははかれない」ED (Hanon盤 exists) | ✅ |
| コガネゾラ | single | 2021-09-01 | 「SDガンダムワールド ヒーローズ」ED, major debut (Hanon盤 exists) | ✅ |
| Mirage Vox | ep | 2021-06-19 | 同人 1st mini album | ✅ Wikipedia |
| 水声少女 | album | 2020-10-10 | 同人 2nd album (incl. ワタシノミカタ Hanon×Kotoha ver.) | ✅ |
| 恋色同盟 | album | 2019-12-19 | HoneyWorks feat. Hanon×Kotoha 同人 1st album (恋文 …) | ✅ |

**Don't include** 君の隣は空気が美味しい — it is **HoneyWorks feat.Kotoha** (Kotoha's solo ED for the same anime), unless the owner wants unit-adjacent items. (Until 2026-10-09 the Kotoha site wrongly listed both songs as ハコニワリリィ digital singles; its seed and live data are fixed now, so copying its seed rows is safe.) Covers from YouTube (e.g. 金曜日のおはよう -another story-) live in Videos, not Discography, like on the Kotoha site (`release_type = cover` exists if the owner wants a few).
For every "⚠️ date" item, open its hakoniwalily.jp release page (`/release/…`, list: `/release/` and `/release/page/2/`) or the streaming link before seeding.

### 7.9 Credits (data.js `CREDITS`) — ❓ the owner supplies artist handles + post URLs for each artwork they pick.

---

## 8. Things learned the hard way on the Kotoha site (avoid repeating them)

1. **`.vercelignore` patterns must start with `/`.** An unanchored `assets` also matched `public/assets` → no images were deployed for a while.
2. **SVG sprite comments must never contain `--`** (breaks the whole sprite silently).
3. **A `display: grid` author rule overrides the `hidden` attribute** → keep `[hidden] { display: none !important }` in `base.css`.
4. **JA line-height on every `:lang(ja)` element stretched display titles** → apply JA leading only to body/text blocks.
5. **Admin navigation race:** render each admin page into its own container with a `renderSeq` guard (a slow page must not overwrite the current one).
6. **Don't animate the same element with GSAP and a CSS scroll-driven `transform`** — animate wrapper columns instead.
7. **Neon sleeps:** retry only connection-open errors (`UND_ERR_CONNECT_TIMEOUT`, `ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN`); edge `stale-while-revalidate=86400` on public API; loader never waits more than 4 s for data.
8. **CSP:** no inline scripts (hence `prepaint.js`, `motion-boot.js`); inline styles allowed. Every CDN file SRI-pinned except Google Fonts CSS (varies per browser). SRI hashes must be verified against the served bytes.
9. **`textPath` can't use the external sprite** — the rotating badge path must be inline.
10. **The loader spinner must turn from first paint** (static inline SVG + CSS animation), and keep turning in calm mode (slower). It is the loading indicator.
11. **Short laptops (≥ 1100 px wide, ≤ 960 px tall):** Home must fit one screen — hide secondary cards there.
12. **lenis-snap** broke Lenis (UMD global clash) and snapped to the nearest point → irrelevant now (no Lenis), but don't bring it back.
13. **Testing in the built-in browser pane is unreliable** (`visibilityState: hidden` pauses rAF; the loader never ends). Test with headless Chrome/Edge over the DevTools protocol (§9.4).

---

## 9. Performance: build it like this from the start (results of the Kotoha performance pass, 2026-10-09)

The Kotoha site was "really laggy" before the pass. Measured with headless Chrome on a **Radeon Vega 3** (weak integrated GPU — the owner's machine class) while wheel-scrolling the whole page:

| Test | Before | After |
|---|---|---|
| Laptop 1366×768, CPU 4× slower | 22 fps, 419 frames > 33 ms, Layerize 8.4 s | **35 fps**, 174 frames > 33 ms, Layerize 3.8 s |
| Desktop 1920×1080 | 35 fps, 140 frames > 50 ms | **38 fps**, 100 frames > 50 ms |
| Phone 390×844, CPU 4× slower | p95 frame 33 ms | **p95 17 ms** |

A plain text page scrolls at 60 fps in the same harness; switching off *all* CSS animations gets the Kotoha site to ≈ 50 fps at 1920. The rest is the cost of the visible effects the owner chose to keep. **Design Hanon's page with the same number or fewer of always-running effects.**

### 9.1 Rules (do / don't)

| Do | Don't | Why |
|---|---|---|
| **Native scrolling.** `scroll.js` only does in-page jumps (`scrollIntoView`, smooth in full motion, instant in calm) and the scroll lock (`html.scroll-locked { overflow: hidden }` + `html { scrollbar-gutter: stable }`) | **No snapping** (owner: "a total mess"), no Lenis or any smooth-scroll library | native scroll runs on the compositor thread; JS scrolling stutters whenever the main thread is busy |
| `.paper` = solid fill `rgb(var(--paper-rgb) / .94)` | **no `backdrop-filter`** on cards or on anything over the moving backdrop or that animates | re-blurring the moving art behind every card each frame was the single most expensive effect |
| Per-frame values written **only on the elements that need them** (e.g. `--lean` on the on-screen `.lean` cards, tracked by IntersectionObserver + a MutationObserver for cards added later) | never write a per-frame custom property on `<html>`/`:root` | a root custom property restyles the whole document every frame |
| **One scroll ticker** (`motion/scroll-life.js`): one rAF loop while scrolling + 150 ms after the last scroll event; measures velocity from the last settled position; subscribers via `onScrollVelocity(cb)` (marquee, nav progress) | separate rAF loops per effect | fewer frames of JS, one place to reason about |
| Cache layout values with `ResizeObserver` (page height for the progress meter, marquee width) | `getBoundingClientRect` / `scrollHeight` inside animation frames | forced layout every frame (thrashing) |
| Marquee = **one looping Web Animation** (`translate3d(0) → translate3d(-width)`); scroll speed only calls `updatePlaybackRate()` (negative = reversed), pause when off screen | JS that sets `transform` every frame | compositor-driven, almost no main-thread work |
| No CSS transition on a property that JS changes every frame (the progress clover's `clip-path`; the polaroid leans via `transform` so its hover `rotate` transition isn't restarted) | `transition` + per-frame updates of the same property | the transition restarts every frame and forces repaints |
| Backdrop: **one `.backdrop__pan` layer** carries the `scroll(root)` pan **and** the veil (`::after`, `inset: -4% 0`); faded-out artworks get `visibility: hidden` after the 0.9 s crossfade (`transition: opacity .9s, visibility 0s .9s`) | a pan animation on every artwork; a separate full-screen veil layer | five full-screen layers + an extra full-screen blend every frame |
| Sections > 1 screen away get **`.is-far` → `animation: none !important`** (IntersectionObserver, `rootMargin: '100% 0px'`, set after the loader) | **`content-visibility: auto` on sections** | in Chrome 154 any View Transition (the lightbox grow) **hangs the page** while a rendered-but-off-screen section has `content-visibility: auto` — reproduced on the original Kotoha build too. Revisit only if Chrome fixes it |
| Sparkle trail: a fixed pool (4 per shape) inside one `position: fixed; contain: strict` layer | re-pointing `<use href>` on every spawn | |
| canvas-confetti injected (with SRI) on `requestIdleCallback` after the loader, or on the first burst | loading it during the loader | one less file competing with the art |
| Non-Home backdrop images `fetchpriority="low"` (still pre-decoded in loader tier 2 so crossfades never hitch) | | |
| Keep CSS/JS `Cache-Control` as default revalidation | long `max-age` on un-versioned CSS/JS | a stale module next to a new one can break imports after a deploy |
| Animate only `transform`, `opacity`, `clip-path`, `mask` (and individual `translate/rotate/scale`) | animating layout properties, box-shadow, filters | |

Measured and found **not** worth changing (leave as designed): `filter: drop-shadow` on the small SVG icons, text strokes/shadows on titles, box-shadows on cards.

### 9.2 Effects budget (keep at or below the Kotoha page)

Per screen: ≈ 20–25 `.reveal` scroll animations, ≤ 7 twinkles, ≤ 6 floats, 1 marquee, 1 rotating badge, 1 drift, 1 bob, the backdrop pan, one-shot GSAP arrivals (home intro, title letter pops). Every extra looping or scroll-linked effect should replace one, not add to the total. Gallery tiles carry `reveal lean` — fine because far sections drop animations.

### 9.3 Targets

≥ 58 fps desktop scroll on a normal machine; ≥ 35 fps with 4× CPU slowdown at 1366×768 on a weak GPU (Kotoha's current level — try to beat it); no long tasks > 50 ms while scrolling on a normal machine; INP < 200 ms; CLS < 0.1; LCP not worse than the loader minimum (3 s by design).

### 9.4 Test harness (rebuild it in `scripts/perf/` and commit it this time)

The Kotoha tests lived in a temporary scratchpad and were lost; commit cleaned copies in the Hanon repo.
- **Static server + API proxy:** serve `public/` with the `vercel.json` CSP header; proxy `/api/public/*` to the deployed site (read-only, cached); **swallow `/api/track` (return 204)** so tests never pollute analytics.
- **Headless Chrome over CDP** (Node's global `WebSocket`, no Puppeteer): `--headless=new --use-angle=gl --ignore-gpu-blocklist` uses the real GPU (without it, headless renders in software and exaggerates draw costs). Wait until the loader element is gone, then wheel-scroll (`Input.dispatchMouseEvent` type `mouseWheel`, 100 px every 70 ms down the whole page, then up), record frame times with a `requestAnimationFrame` recorder (plus `scrollY` per frame to attribute slow frames to sections), and `Tracing` (`devtools.timeline` categories) for Layerize / style / layout / paint / long tasks. `Emulation.setCPUThrottlingRate` for 4×. Compare **back-to-back** runs (±2 fps noise). Delete trace files after reading (they're hundreds of MB).
- **Isolation experiments:** inject a `<style>` that turns one effect group off (`animation: none !important` on a class list) to find what costs the most before optimizing.
- **Screenshots:** per section at 1920 / 1366 / 390, diff against the previous build (PIL/sharp).
- **Behaviour suite (~35 checks):** a wheel notch moves freely (no glide back); nav/deep links land exactly on the section; only the current artwork is visible; marquee runs, reverses on scroll-up, settles; lean only on on-screen cards; progress clover fills; confetti not loaded during the loader, loaded after, fires on the logo; sparkles animate; lightbox opens with its grow, locks scroll, Escape closes; PageDown scrolls; motion toggle → calm and back; phone menu locks scroll and its links work; reduced-motion device → calm; no console errors/CSP violations; analytics beacons fire (on a local server only).
- Harness gotchas: after `Page.navigate`, make sure you're checking the *new* document; headless reports no fine pointer (sparkles don't start — emulate or start them manually); **headless touch swipes are unreliable** (even on a plain page) → the owner tests real phones.

---

## 10. Infrastructure plan (✅ Q5 decided as below; still ask before *creating* each resource)

| Item | Kotoha | Hanon proposal |
|---|---|---|
| GitHub | `PastelSalt/kotoha-fansite` (private) | owner creates the new repo (this guide does **not** create repos) |
| Vercel project | `kotoha-fansite` (`prj_jenOIZqyraT1YJ9WhdrKLp1VxnBn`), region `sin1`; **don't touch `moesoft-web`** | new project `hanon-fansite`, `sin1`, `outputDirectory: public` |
| Neon | project `kotoha-fansite` (`odd-base-44136456`), free tier 512 MB | **separate** Neon project `hanon-fansite` (keeps data, limits and resets independent) |
| Cloudinary | cloud `dijqsw0k8`, folder `kotoha-fansite/gallery`, preset `kotoha_gallery_signed` (free plan: 10 MB & 25 MP per image) | **same cloud** (shared free quota) with folder `hanon-fansite/gallery` + preset `hanon_gallery_signed` |
| Env vars | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET/FOLDER/UPLOAD_PRESET`, `ANALYTICS_SALT`, `ADMIN_BOOTSTRAP_USERNAME/PASSWORD` (one-time), `ALLOWED_ORIGINS` | same keys, **new values** (new `ANALYTICS_SALT`); `DATABASE_URL` marked Sensitive |
| Admin | Owner + auto-numbered admins | same; the owner chooses the bootstrap username/password and puts them in `.env.local` themself |

Before launch: run `npm run prelaunch:reset` only with the owner's go-ahead; afterwards delete the bootstrap env vars.

---

## 11. Build order (one branch per phase; merge to `main` only with the owner's OK)

| # | Phase | Done when |
|---|---|---|
| 0 | Read this file; ask §12; record answers here | answers recorded |
| 1 | Bring in the Kotoha code (§4, ✅ Q4), strip Kotoha data, rename identifiers, fresh `docs/PROGRESS.md` (same structure: resume protocol, hard rules, checklist, decisions log, session log) and `MIGRATION.md`-style handoff | site runs locally with placeholder content, no Kotoha leftovers |
| 2 | Palette + tokens (§5.2), sprite (§5.3), loader spinner variant | style tile approved by the owner ✋ |
| 3 | Owner's assets → `npm run images:optimize`; backdrop + loader art wired; accents picked from the art; credits | all sections show Hanon art |
| 4 | Locale files EN/JA (About, facts, footer, bubbles, marquee, bg words); JA review list | EN↔JA complete |
| 5 | Infra (§10, with OK): Neon project + migration + `seed.sql` (§7), Cloudinary preset + `gallery:seed`, Vercel project + env vars | API returns Hanon data |
| 6 | Admin smoke test (login, forced password change, CRUD, archive/restore, gallery upload/delete, analytics) | all admin flows verified |
| 7 | Performance + behaviour harness (§9.4) committed; meet §9.3 targets | numbers logged in PROGRESS |
| 8 | QA: keyboard/focus, screen reader labels, contrast, ≥ 13 px text, JP line breaks, CSP/SRI, phones (owner ✋), cross-links with the Kotoha site (owner OK) | owner sign-off |
| 9 | Launch: production deploy, prelaunch reset (OK), first Owner login, remove bootstrap env vars | live |

---

## 12. Open questions for the owner (Claude: ask these first, with your recommendation; record answers + date here)

| # | Question | Recommendation | Answer |
|---|---|---|---|
| Q1 | Palette: blue base `#b7d7ef` + deep blue `#1f5e9e` + penguin gold, navy ink (§5.2)? Cool-white paper or Kotoha's cream? | yes; cool-white paper (more Hanon, still clearly a sibling) | ✅ 2026-10-09: **Blue + gold, cool-white cards** |
| Q2 | Motif & loader: penguin sticker + ripples/drops/stars; loader = two counter-rotating 4-point stars whose rays fill with progress, penguin in the centre? | yes | ✅ 2026-10-09: **Penguin + stars** (as recommended) |
| Q3 | AiceClass wording (appears dissolved, §7.1): mention only historically, or not at all? Also fix the Kotoha site? | historically only ("VTuber debut 2023 with AiceClass"); fix Kotoha too | ✅ 2026-10-09: **historical only**; first "Hanon site only", then "do all the recommended" → **the Kotoha site was fixed too** |
| Q4 | Start the repo from a copy of the Kotoha code? How will the code get there? | yes, copy `kotoha-fansite` `main` | ✅ 2026-10-09: **yes, copy the Kotoha code** (ask only how it gets into the repo) |
| Q5 | Site URL / project names (`hanon-fansite`), separate Neon project, Cloudinary account/folder (§10) | `hanon-fansite.vercel.app`; separate Neon project; same Cloudinary cloud, own folder | ✅ 2026-10-09: **as recommended** (still ask before creating each resource) |
| Q6 | Special days: March 6 birthday + which anniversary — VTuber debut (July 9), major debut (Sept 1, shared with the unit), or none? | March 6 + July 9 | ✅ 2026-10-09: **March 6 + July 9** |
| Q7 | Discography scope: include StellaPhizz and "HoneyWorks feat. Hanon" works and Hanon solo vers (as notes), exclude Kotoha-only works? | yes | ✅ 2026-10-09: **yes** |
| Q8 | Sister-site cross-links in both footers? | yes, after both are live | ✅ 2026-10-09: **yes, once both are live** |
| Q9 | Does Hanon have a mascot (like Kotoha's) for the cameo / empty states? Which artworks + credits for the 5 sections and 3 loaders? | owner supplies | |

---

## 13. Sources (checked 2026-10-09)

- Hanon lit.link — https://lit.link/Hanonmoco (bio, birthday, image colour, foods, links, hashtags, fan names, schedule, fan-letter address, anime credits)
- HoloList — https://hololist.net/hanonmoco/ (birthday, height, debut, illustrator/rigger, links, follower counts)
- AiceClass Wiki* (fan wiki) — https://wikiwiki.jp/aiceclass/Hanon and https://wikiwiki.jp/aiceclass/ハコニワリリィ (hex colours, blood type, hashtags, catchphrase, timeline; note: the wiki says it stopped updating in 2024)
- ハコニワリリィ official — https://hakoniwalily.jp/ (`/profile/`, `/news/`, `/release/`, `/release/page/2/`, release pages for 君が灯してくれた光を今, 恋色同盟, Summer/Autumn Vox)
- Wikipedia (JA) ハコニワリリィ — https://ja.wikipedia.org/wiki/ハコニワリリィ (discography, tie-ups, lives, label/office, CeVIO date)
- MARUMOCHI — https://marumochi.net/music/hanon/ (official one-line profile)
- YouTube: Hanon channel videos/popular lists, RSS feed, and watch pages (publish dates, credits, descriptions); HaKoniwalily/MARUMOCHI channel RSS; StellaPhizz channel RSS; oEmbed for channel owners
- StellaPhizz — Rebrast interview https://rebrast.com/stellaphizz/, BOOTH https://stellaphizz.booth.pm/, X https://x.com/StellaPhizz
- AiceClass — Idol dept. dissolution post https://x.com/aiceclass/status/1978038071745822892 (2025-10-14 → effective 2025-10-31); 2026-06-18 dissolution notice seen in search results; aiceclass.com returning 404 (checked 2026-10-09)
- Hanon's AiceClass joining post (2023) — https://x.com/Hanon_moco/status/1675471286888452097
- Kotoha fan site repo docs (design system, performance plan, migration notes) — the source of §3–§5, §8–§10
