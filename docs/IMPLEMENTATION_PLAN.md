# Kotoha Fansite — Implementation Plan (Living Specification)

| | |
|---|---|
| **Document status** | **v0.5: approved specification.** All owner questions answered |
| **Implementation authorized?** | **YES**: owner authorized development on 2026-09-26. Progress is tracked in [`docs/PROGRESS.md`](PROGRESS.md) |
| **Architecture clarity** | **97%**: the remaining 3% are technical items settled in the prototype (§7.1) |
| **Last updated** | 2026-09-26 |
| **Changes in v0.5** | Descriptive DB text entered **once in any language, shown as typed** (`N7` = b); GitHub noreply commit email; analytics use **Japan time (JST)**, weeks start Monday; implementation authorized |
| **Changes in v0.4** | GitHub route chosen; domain `kotoha-fansite.vercel.app`; pre-launch reset approved; Japanese handled via official wording + review list; **names/titles entered once in their original form**; new question on how far "type once" goes (§7.2 `N7`) |
| **Changes in v0.3** | Round-2 decisions recorded (§16); role renamed **Owner**; admins auto-numbered; both languages required; shared DB for dev/prod; show all records in sections; connectors verified (§5.9) |

### How to use this document

- Open questions live in **§7** with IDs. **§7.0** lists defaults I'll use unless you object.
- Markers: ✅ Confirmed · 🔶 Implied · 💡 Proposed/delegated default · ❓ Undecided
- Resolved questions move to **§16 Decision Log**.

---

## Table of Contents

1. [Project Understanding](#1-project-understanding)
2. [Existing Project Analysis](#2-existing-project-analysis)
3. [Asset Inventory](#3-asset-inventory)
4. [Reference Design Analysis](#4-reference-design-analysis)
5. [Documentation, Content & Research](#5-documentation-content--research)
6. [Requirements](#6-requirements)
7. [Open Questions & Clarity Score](#7-open-questions--clarity-score)
8. [Proposed Architecture](#8-proposed-architecture)
9. [Database Plan](#9-database-plan)
10. [Page & Component Plan](#10-page--component-plan)
11. [Animation & Interaction Plan](#11-animation--interaction-plan)
12. [Security Plan](#12-security-plan)
13. [Implementation Phases](#13-implementation-phases)
14. [Risks & Concerns](#14-risks--concerns)
15. [Final Pre-Implementation Checklist](#15-final-pre-implementation-checklist)
16. [Decision Log](#16-decision-log)

---

## 1. Project Understanding

### 1.1 What the project is

An **unofficial, non-profit, bilingual (Japanese/English) fan website for Kotoha (ことは)**: vocalist of HaKoniwalily (with Hanon), HoneyWorks support vocalist, AiceClass. Made by **Moeko Software and Technologies (Moesoft)**.

1. **Public site** ✅: animated, responsive single page of full-screen sections with strict snap: Home → About → News → Discography → Gallery (infinite) → Footer.
2. **Admin area** ✅ (`/login`, `/admin`): roles **Owner** and **Admin**; manages videos, news, achievements, discography and gallery; analytics; archive; accounts (Owner only).

### 1.2 Intended user experience

- **Loader** ✅: automatic, ≥ 3 s to showcase one of three artworks while all images/assets preload.
- **Language** ✅: visitors in Japan (IP) get Japanese; everyone else gets English; a JP/EN switcher is always available; **all text switches, including headings and menus**; the admin panel is switchable too.
- **Header** ✅: a hero header inside Home; a scrolled nav (green bar, **no social icons**) on the other sections.
- **Scroll** ✅: strict snap in the feel "scroll freely, then glide to the nearest section".
- **Content** ✅: Home shows the newest video and the 2 newest news items; each section shows **all** its records (newest first).
- **Gallery** ✅: grows with the page (snap turns off inside it), loads more as you scroll, ends with the footer.
- **No sound** ✅.

### 1.3 Target devices

✅ Mobile, tablet, desktop, large desktop. References: desktop 1366×768, mobile 360×800.

### 1.4 Routes

| Route | Purpose | Status |
|---|---|---|
| `/` | Public single page | ✅ |
| `/?lang=ja` · `/?lang=en` | Forced language (shareable/indexable) | 💡 §7.0 |
| `/login` | Sign-in (JP/EN) | ✅ |
| `/admin` | Forced password change (first login), then dashboard | ✅ |

### 1.5 Feature matrix

| Feature | Status |
|---|---|
| Loader ≥ 3 s + real preloading | ✅ |
| Strict snap (free scroll → glide), gallery free-scroll zone | ✅ |
| Bilingual JA/EN: UI, headings, menus, About, footer, admin panel | ✅ |
| Names/titles (songs, videos, artists, events) entered **once, in their original form**, shown as-is in both languages | ✅ |
| Descriptive DB text (news headline/summary, achievement text, discography note) entered **once, in any language, shown as typed** in both modes | ✅ |
| Hero header / scrolled nav without socials | ✅ |
| Stream countdown (Tue/Fri ~21:00 JST, hardcoded) | 💡 §7.0 |
| Videos (DB): hero shows newest; News section shows player + **all** videos | ✅ |
| News (DB): hero shows 2 newest; News section shows **all** | ✅ |
| Achievements (DB), Discography (DB, YouTube-thumbnail covers): show **all** | ✅ |
| About: hardcoded (JA + EN) | ✅ |
| Gallery (DB + Cloudinary): infinite, masonry, author credit + source link | ✅ |
| Footer: Moesoft logo, disclaimer, obfuscated contact email, links, credits | ✅ |
| Archive instead of deletion (single `archived_content` table, Archive page with Restore) | ✅ |
| Gallery image files permanently deleted from Cloudinary; record archived | ✅ |
| Owner + auto-numbered Admins, temp passwords, forced change | ✅ |
| Analytics: owner's metrics + all suggested extras, cookieless | ✅ |
| Confetti/micro-interactions | 💡 §7.0 |
| ~~Sound~~ | ❌ dropped |

### 1.6 Technologies

Vanilla HTML/CSS/JS (no build step) · Fredoka + **M PLUS Rounded 1c** (Japanese) · GSAP 3.12.5 + ScrollTrigger · Lenis 1.1.18 (+ `lenis-snap`) · Anime.js 3.2.2 · Animate.css 4.1.1 · canvas-confetti 1.9.4 · Lucide (pinned) · ~~Howler~~ · Vercel Functions (Node.js) · Neon PostgreSQL · Cloudinary · Vercel.

### 1.7 External services (verified 2026-09-26, §5.9)

| Service | Account state | Use |
|---|---|---|
| Vercel | ✅ connected; personal account, 1 existing project (`moesoft-web`, untouched) | New project for the fansite |
| Neon | ✅ connected; no projects yet | New project, region **Singapore** (closest to Japan) |
| Cloudinary | ✅ connected; Free plan; only Cloudinary's default `samples` (64 files, ~177 MB) | New folder `kotoha-fansite/gallery` |
| GitHub | ✅ route chosen: GitHub CLI (`winget` v1.29 available) + one browser login by owner; private repo `kotoha-fansite` | Code hosting, auto-deploy to Vercel |
| Vercel URL | ✅ `kotoha-fansite.vercel.app`: currently unclaimed (checked 2026-09-26, `DEPLOYMENT_NOT_FOUND`); reserved when the project is created | Production URL |
| YouTube | public | Embeds, thumbnails, oEmbed auto-fill (no API key) |
| Have I Been Pwned (range API) | public | Leaked-password check (✅ recommended config) |

---

## 2. Existing Project Analysis

*(Stable since v0.1.)*

- Project root = `kotoha_fansite` (not a git repo). Contents: `assets/` (backgrounds, icons, model, decorations), `docs/` (4 reference .md + this plan), `previous_failed_attempt_v1_*` (static HTML/CSS/JS), `references/` (desktop 9, mobile 7).
- Not present: `package.json`, `vercel.json`, env files, server code, SQL, tests, README.
- Local tools: Node 24.21.0, npm 11.19.0, git 2.55. Not installed: Vercel CLI, `psql`, `neonctl`, GitHub CLI.
- **Previous attempt:** the loader never closes (missing `#enter-btn`); Lenis/ScrollTrigger/Howler unused; three competing scroll systems; zoom disabled; heavy images and iframes; **fabricated content** (§5.6).
- **Reusable ideas:** color tokens, Fredoka link, countdown idea, drawer structure, confetti clover shape, lightbox pattern. Everything else is rebuilt.

---

## 3. Asset Inventory

### 3.1 Backgrounds

| File | Size | Section | Credit |
|---|---|---|---|
| `home_bg.jpeg` | 3840×2160 (frame baked in) | Home | @kuroli, `x.com/kuroli/status/2093632342233641201` |
| `about_bg.png` | 1920×1080 | About | **Artist unknown: contact us** ✅ |
| `news_bg.jpeg` | 4093×2894 | News | @Parfait_Pie_12, `…/1596201447003394048` |
| `discography_bg.jpeg` | 2048×1445 | Discography | @snowclole, `…/1784902250097422367` |
| `gallery_bg.jpeg` | 2048×1152 | Gallery | @snowclole, `…/1762039953431875623` |
| `bg1.jpeg` | 4096×3072 | Loader variant, mobile menu | **Artist unknown** ✅ |
| `bg2.jpeg` | 2406×1536 | Loader variant | @kuroli, `…/2064361892999815515` |
| `bg3.jpeg` | 4096×2892 | Loader variant, mobile loader | **Artist unknown** ✅ |

Art is drawn semi-transparent over `#fe9fb9`. Responsive WebP/AVIF derivatives are generated; originals stay untouched.

### 3.2 Other assets

Logo (1000×288), Moesoft logo (707×354), profile picture 400×400 (credit **unknown**), X/YouTube/Twitch icons, **TwitCasting icon: to be obtained from TwitCasting's official materials** ✅ (file/source/size confirmed with you before download), pose image (About), front-view model + turnaround sheet (©AiceClass) + mascot sheet (gallery seed), clover fill/outline PNGs (→ SVG recreations), section divider (→ SVG).

### 3.3 Gallery seed ✅

The 5 credited artworks (kuroli ×2, Parfait_Pie_12, snowclole ×2) + front-view model and turnaround sheet (©AiceClass) + mascot sheet (credit per sheet; "Artist unknown" if not determinable). Uploaded to Cloudinary by a seed script with author name + source link.

---

## 4. Reference Design Analysis

*(Unchanged design language: `#fe9fb9` base; green `#63A23D`; sticker headings; translucent green banners; dashed translucent cards, with border color free to change ✅; dashed scrollbars; credits top-right.)*

### 4.1 Header model ✅

| State | Where | Contents |
|---|---|---|
| Hero header | Inside Home (scrolls away with the hero) | Large logo, nav (no bar), social row, JP/EN switcher |
| Scrolled nav | Fixed at top on all other sections | Green bar: logo + nav + JP/EN switcher. **No social icons** ✅ |
| Mobile hero | Home | Large logo, countdown pill, clover "menu" |
| Mobile scrolled | Other sections | Bar: logo + clover "menu" |
| Mobile menu | Overlay | `bg1` art, socials, logo, nav, JP/EN switcher, Moesoft credit, close button |

### 4.2 Section adaptations from round-2 decisions

- **Home:** newest video (1 card) + 2 newest news. The hero header includes the socials.
- **News:** left: **all** news (scrollable, loads more inside the list); right: main player (newest video) + **scrollable list of all other videos** (desktop). On mobile this becomes a horizontal swipe row, keeping the reference's side-by-side look (💡 delegated).
- **Discography:** left: **all** releases (YouTube-thumbnail covers); right: **all** achievements.
- **Gallery:** banner → masonry grid growing with the page → footer.

---

## 5. Documentation, Content & Research

### 5.1–5.6 (summary; details in v0.1/v0.2)

- Docs were scraped around 2025-08, with additions up to 2026-03.
- Conflicts resolved: 優里 ≠ Tani Yuuki (datasheet error); games = **VALORANT, LoL, Honkai: Star Rail** (official, live). Unverified facts are omitted (hometown, "Diamond rank", CeVIO name).
- Previous-attempt fabrications are never reused.
- Volatile numbers (subscribers/views) are not displayed.

### 5.7 Research results (2026-09-26)

**Seed videos ✅ (latest 3 works; stream replays excluded, see §16 B12):**
`032NxAyaLfQ` ダミーロマンス / DECO*27 cover (09-25, re-check it's publicly live before seeding) · `FLH4EoRCgSQ` 劇薬中毒 / ＝LOVE, Hanon×Kotoha (09-24) · `7pKeXq9AkBc` 透明夜 (feat.MIMI) MV (09-23).

**Seed news ✅ (all 10, unit news included):** 09-25 ダミーロマンス cover · 09-24 劇薬中毒 cover · 09-23 Kotoha×MIMI「透明夜」mini album + MV · 09-15 "Wonder Greeting" 2nd presale · 08-27「世界最強の魔女、始めました」OP「影響力∞アイドル」(release 10-07) · 08-15 "Wonder Greeting" announced · 07-15 ハコリリ夏祭り CD campaign · 07-03 ハニフェス 2026 appearance · 06-07『乙女怪獣キャラメリゼ』ED「オトメノホンキ」(release 07-08) · 05-25 ハコリリ夏祭り2026 key visual & tickets.

**Seed achievements:** official 実績 list (27 entries, 2021-08-21 → 2025-10-06) + 2026 items (オトメノホンキ 07-08, 透明夜 09-23, 影響力∞アイドル 10-07, フローライト 03-11 to be verified).

**Seed discography:** derived from the same verified sources (releases with MV links for thumbnails); exact list presented for review in Phase 4.

**Seed language handling:** names/titles kept in their original form ✅ (`N6`); descriptive text per `N7`. Japanese wording reused from official sources wherever it exists; any Japanese I write myself is listed in `docs/JA_REVIEW_LIST.md` for later native review ✅ (`N5`).

### 5.8 About content (hardcoded ✅)

Pills (count flexible ✅): Name (Kotoha/ことは) · Birthday June 10 · Gemini · Height 152 cm · Debut July 8, 2023 · AiceClass · HaKoniwalily vocalist (with Hanon) · HoneyWorks support vocal · Fans ことリス + 🍀 (not 🥦) + image color green · Streams Tue & Fri ~21:00 JST (TwitCasting talk & singing / Twitch games) · Hashtags #ことらじ #ことぴく #ことメモ · Favorites: pancakes, takoyaki, VALORANT, LoL, Honkai: Star Rail. Bio rewritten from verified facts, in JA + EN.

### 5.9 Service verification (read-only, 2026-09-26)

| Check | Result | Consequence |
|---|---|---|
| Neon `list_projects` | Connected; **0 projects** | Create project at implementation |
| Neon `list_regions` | No Tokyo; nearest **aws-ap-southeast-1 (Singapore)** | DB in Singapore; Vercel functions in `sin1` |
| Vercel `list_projects` | Connected; `moesoft-web` exists (personal account) | New separate project; existing one untouched |
| Cloudinary `get-usage-details` | Free plan; 64 sample files, ~177 MB, 0.68% of 25 credits; **max image 10 MB and 25 megapixels** | Auto-downscale must respect both limits |
| Cloudinary `search-folders` | Only default `samples/*` | Use a dedicated `kotoha-fansite/gallery` folder; samples untouched |
| Cloudinary `list-upload-presets` | None | Create a signed preset at implementation |
| GitHub | `gh` missing; connector failed → owner chose GitHub CLI route (`winget` v1.29 present) | Install `gh` at implementation (with OK), owner logs in once |
| Git identity (local) | Already configured: "Moesoft: Moeko Software and Technologies" + owner's email | Commits authored by owner's identity (see §7.2 `G1`) |
| `kotoha-fansite.vercel.app` | `404 DEPLOYMENT_NOT_FOUND` (unclaimed) | Name available now; claimed at project creation |

---

## 6. Requirements

### 6.1 Confirmed

1. Stack & libraries per brief, **minus Howler**; static frontend + Vercel Functions.
2. References reproduced closely; front-end creative decisions delegated to me where references are silent ✅.
3. Loader ≥ 3 s, real preloading, design delegated.
4. Strict snap, "free scroll then glide" feel; gallery is a free-scroll zone.
5. Bilingual JA/EN: Japan IP → JA, others → EN; saved choice overrides; **headings/menus switch too**; admin switchable.
6. **All admin-entered DB text is entered once**: names/titles in their original form; descriptive text (news headline/summary, achievement text, discography note) in any language. Both are shown exactly as typed in both language modes. Bilingual = UI, headings, menus, About, footer, admin panel (static locale files).
7. Hero header inside Home; scrolled nav without socials elsewhere.
8. DB content: videos, news, achievements, **discography**, gallery. About hardcoded.
9. Newest first everywhere; hero shows newest video + 2 newest news; **sections show all records** ✅ (applies to all related logic).
10. News: date posted (pre-filled today, editable), headline, short description, **up to 3 links**; **draft/publish**.
11. Videos: date (pre-filled today, editable), draft/publish.
12. Gallery item: image + author name + source link; infinite scroll; masonry.
13. Footer: usual items, Moesoft logo, fan-site disclaimer, obfuscated `moekosoftware@outlook.com`.
14. No permanent deletion of DB content: single `archived_content` table + Archive page with Restore; removed admins archived; gallery files permanently deleted from Cloudinary, record archived.
15. Upload works with default settings (no manual compression/conversion).
16. **Owner** (bootstrap account; forced change) + **Admins auto-numbered** (`<owner-username>2`, `3`, …), random 8-character temporary password, forced change; equal content powers; only Owner manages accounts.
17. Password: min 12, leaked-password check, sessions 7 days / 2 h idle.
18. Admin menu: Dashboard · Latest Videos · News · Achievements · Discography · Gallery · Archive · Activity Log · Accounts (Owner) · My Account.
19. Analytics: daily/weekly/monthly visits, section dwell time, mobile/tablet/desktop + all suggested extras; cookieless uniques.
20. **Dev and prod share the same Neon database and Cloudinary folder** (no separation). Testing before launch is free, followed by **one clean reset right before launch**; after launch, testing uses drafts only.
21. Automation of setup via connectors (verified) + **GitHub CLI route** with a private repo `kotoha-fansite`; production URL **`kotoha-fansite.vercel.app`**.
21b. Japanese text: official wording reused where possible; my own Japanese is listed for later native review; changes happen only after that feedback.
22. Artwork used without permission, credited; takedown on request; unknown credits shown as "Artist unknown: contact us".
23. `seed.sql`, `.env.example`, no committed secrets, security minimums, responsive, a11y, performance.
24. Approval gate in force.

### 6.2 Implied by references

Section order; random loader art; semi-transparent art over pink; socials X/YouTube/Twitch/TwitCasting (hero + menu + footer); clover menu; countdown; dashed scrollbars; "scroll for more!"; art credits; Moesoft credit.

### 6.3 Undecided

None. All owner decisions are made. Remaining technical unknowns are settled in the prototype (§7.1).

---

## 7. Open Questions & Clarity Score

### 7.0 Defaults I will use unless you object

| ID | Default |
|---|---|
| A3 | Local dev with `npx vercel dev` |
| A5 | Vercel Hobby plan |
| A8 | Preview deployments protected; production public |
| A9 | Lucide pinned to an exact version (currently 1.48.0) via jsDelivr + SRI; `lenis-snap.min.js` from the same Lenis 1.1.18 |
| A10 | Previous-attempt folder kept, not deployed |
| A14 | Neon in Singapore (`aws-ap-southeast-1`); Vercel functions in `sin1` |
| A15 | A Neon restore point (snapshot/backup branch) before every schema change (safety net for the shared DB) |
| B4 | ことは everywhere |
| B9 | Stream schedule hardcoded (Tue & Fri ~21:00 JST); "Stream time!" for 2 h after start; JST + viewer's local time in a tooltip |
| B11 | Official contact/fan-mail info not republished; linked instead |
| B17 | Home hero shows **1** video card (as in the reference) + 2 news cards |
| C2 | Active nav item follows the current section |
| C3 | Section art ~80% opacity over `#fe9fb9`, tuned per section |
| C4 | Art also on mobile Discography/Gallery |
| C5 | Home frame: `cover` near 16:9, `contain` beyond a threshold |
| C6 | < 900 px wide → mobile composition; ≥ 900 px & ≥ 600 px tall → desktop; landscape phones → mobile |
| C9–C14, C16 | Previous extras dropped; typos fixed; SVG clover/divider; menu bg `bg1`; mascot empty states; card border color chosen per background |
| C17 | Gallery grid: masonry (art never cropped); lightbox with author + source link, no download |
| C18 | News section video list: vertical scrollable list on desktop, horizontal swipe row on mobile |
| D* | Loader shown every visit; random `bg1/bg2/bg3` + credit; Moesoft logo on desktop too; clover breathing; no progress bar; min 3.0 s; reveal when Tier 1 is ready *and* (Tier 2 ready or 6 s passed); hard cap 10 s; clover iris exit |
| E3–E5 | Inner lists chain at edges; sections may exceed small screens; snap prototype first |
| F2–F4 | Confetti on logo click + June 10 / July 8 (JST) + About pose tap + admin publish; moderate intensity |
| G5, G7, G9, G10 | No news detail view; bigint IDs; SQL migrations + Node runner; activity log |
| H3, H5, H6, H8 | `f_auto,q_auto`; folder `kotoha-fansite/gallery` (shared by dev/prod); signed direct upload; static art optimized locally |
| H10 | Accept JPEG/PNG/WebP/AVIF/GIF/HEIC; files over **10 MB or 25 megapixels** auto-downscaled in the browser before upload. HEIC files over the limit can't be downscaled in non-Safari browsers; the admin sees a friendly "please export as JPEG" hint in that one case |
| I2, I6–I10 | Argon2id; 5 failures/15 min → 15-min lockout; password change signs out other devices; Owner password reset via script, Admin reset by Owner in UI; no 2FA; `/admin` redirect guard |
| I12 | Temp passwords: shown once (copy button), expire after 7 days; Owner can reset an Admin (new temp password); auto-numbers never reused |
| J2–J5 | No drag reorder; no preview mode; brand-styled calmer admin; phone-friendly |
| K2, K3, K5, K6 | First-party analytics in Neon; cookieless daily uniques; raw events 90 days + daily totals forever; bots/admins/non-production traffic excluded |
| L1–L4 | WCAG 2.2 AA where compatible; last 2 browser versions + iOS 16+; LCP < 2.5 s after loader |
| M3 | Public pages indexable (`hreflang` for `?lang=` variants); admin not indexed; clover favicon; OG image from logo + Home art |
| N3b | JP/EN switcher in hero header, scrolled nav, mobile menu, footer, login and admin |
| N3c | `?lang=ja|en` supported |
| N8 | News/discography link labels come from a **preset dropdown** (Watch · Listen · Details · Tickets · Official site · Shop), translated automatically, so the admin never types a label twice. The default is "Details" |
| N9 | Video titles auto-filled from YouTube (original title), editable; shown unchanged in both languages |
| G14 | Repo includes `assets/`, `references/`, `docs/`, the previous-attempt folder (history/backup); only `public/`, `api/`, `lib/`, `middleware.js` are deployed |

### 7.1 Architecture clarity: **97%** (was 93%)

| Share | Area | Status |
|---|---|---|
| 97% | Everything owner-facing: frontend, backend/API, auth & roles, i18n, Cloudinary, analytics (JST), archive, loader, headers, gallery, hosting/deploy, domain, shared-DB procedure, Japanese review, single-entry DB text | **Clear** |
| 3% | Technical unknowns settled by me in foundation/prototype: touch-device snap strategy (~1.5%), Routing Middleware on a framework-less Vercel project (~0.5%), Argon2 on Vercel (~0.5%), pinned CDN paths/SRI (~0.5%) | Prototype (tracked in `PROGRESS.md`) |

### 7.2 Open questions

None. New questions that come up during implementation are recorded in `PROGRESS.md` → "Open questions for owner" and answered before the affected work continues.

---

## 8. Proposed Architecture

### 8.1 Overview

```
                    ┌──────────────────────────── Vercel (functions: sin1) ─────────────────────────┐
 Browser            │ Routing Middleware: kf_lang cookie from IP country (JP→ja, else en) if unset; │
 ┌───────────────┐  │                     /admin → /login when no session cookie                    │
 │ Public site   │◀▶│ Static (public/): html, css, js, locales/ja.json + en.json, optimized assets  │
 │ vanilla + CDN │  │ Functions (api/): public · track · auth · admin · accounts(Owner) · archive  │──▶ Neon (Singapore)
 └───────────────┘  └───────────────────────────────────────────────────────────────────────────────┘
 ┌───────────────┐
 │ Admin SPA     │── signed direct upload ──▶ Cloudinary (kotoha-fansite/gallery) ◀── verify/destroy
 └───────────────┘
```

### 8.2 Frontend

- No build step; ES modules; CDN libs `defer` + SRI.
- Document scroll with Lenis; inline critical loader.
- **i18n ✅:** `locales/ja.json` / `en.json` contain all UI strings, headings, nav, About content, footer.
  - Language resolution before first paint: `?lang` → saved choice (`localStorage`) → `kf_lang` cookie (middleware: JP → `ja`, else `en`) → `en`.
  - The switch re-renders in place and saves the choice. `<html lang>` is updated.
  - DB content: **every admin-entered text is a single field shown exactly as typed in both modes** ✅ (names/titles in original form; descriptions in any language). Only static UI/About/footer text is translated (locale files).
  - Japanese typography: M PLUS Rounded 1c (Google Fonts subsets), Fredoka for Latin.
- All data rendered via `textContent`.
- **"All records" lists ✅:** section lists fetch pages (e.g. 20 items) and load more as you scroll inside the list, so they show everything without huge first loads.

### 8.3 API (Vercel Functions, Node.js) ✅

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/public/home` | — | Newest video + 2 newest news (hero) |
| `GET /api/public/videos?cursor=` | — | All published videos (paged) |
| `GET /api/public/news?cursor=` | — | All published news (paged) |
| `GET /api/public/achievements?cursor=` | — | All published achievements |
| `GET /api/public/discography?cursor=` | — | All published releases |
| `GET /api/public/gallery?cursor=` | — | Infinite-scroll pages (e.g. 18) |
| `POST /api/track` | — (rate-limited) | Analytics events |
| `/api/auth/login · logout · me · change-password` | throttled/session | Auth |
| `/api/admin/{videos,news,achievements,discography}` (+ `videos/lookup?url=`) | Admin | CRUD, draft/publish, archive |
| `/api/admin/gallery/sign`, `/api/admin/gallery[/:id]` | Admin | Signed upload, verify/insert, edit credit, delete (destroy + archive) |
| `/api/admin/archive`, `/api/admin/archive/:id/restore` | Admin | Archive |
| `/api/admin/activity`, `/api/admin/analytics?range=` | Admin | Logs, stats |
| `/api/admin/accounts`, `…/:id/reset-password`, `DELETE …/:id` | **Owner** | Account control |

`/lib`: `db`, `http`, `auth` (`requireAdmin`, `requireOwner`), `validate`, `i18n-fields`, `cloudinary`, `youtube`, `archive`, `activity`, `analytics`.

### 8.4 Neon ✅

One project in Singapore, **one database shared by dev and prod** ✅. `@neondatabase/serverless` (HTTP); `sql.transaction()` for archive moves. A restore point before every schema change (§7.0 A15).

### 8.5 Cloudinary ✅

One folder `kotoha-fansite/gallery` (shared). Signed direct upload via a signed preset (formats, size, folder, metadata stripping); in-browser auto-downscale to ≤ 10 MB and ≤ 25 MP; response signature verified server-side; `f_auto,q_auto`; permanent destroy + CDN invalidation on delete; metadata row archived.

### 8.6 Auth, roles & sessions ✅

- Roles `owner` (exactly one; the bootstrap account; can't be removed/demoted/reset by others) and `admin` (auto-numbered usernames, never reused).
- `must_change_password` forced for the Owner's first login and every new/reset Admin.
- Temporary passwords: 8 chars (unambiguous alphabet), hashed, shown once, 7-day expiry.
- Sessions: opaque DB-backed, `__Host-kf_session`, 7 days absolute / 2 h idle.
- Password policy: min 12 + blocklist + HIBP range check.

### 8.7 Admin dashboard ✅

Menu per §6.1 #18; JP/EN switchable; forced-change screen blocks everything else; Owner-only screens hidden and blocked server-side.

### 8.8 Analytics ✅

Events: `page_view`, `section_dwell` (ms), `video_play`, `outbound_click` (per platform), `news_link_click`, `gallery_open`, `gallery_credit_click`, `language_switch`, `loader_timing`.

Enrichment: device (mobile/tablet/desktop), browser, country, referrer host, language, daily cookieless visitor hash, `environment` (only `production` counted in the dashboard, which keeps the shared DB's stats clean). **All day/week/month boundaries use Japan time (Asia/Tokyo); weeks start Monday** ✅.

Dashboard: daily/weekly/monthly visits & uniques, section dwell time & reach, device split, JA/EN usage & switches, country (Japan vs overseas), traffic sources, busiest hours (JST), average visit duration, plays per video, social clicks per platform, news link clicks, top artworks + artist-link clicks, real loading time.

### 8.9 Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Neon (runtime / scripts) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (secret) | Cloudinary |
| `CLOUDINARY_FOLDER` | `kotoha-fansite/gallery` |
| `CLOUDINARY_UPLOAD_PRESET` | Signed preset name |
| `ANALYTICS_SALT` (secret) | Visitor hash |
| `ADMIN_BOOTSTRAP_USERNAME`, `ADMIN_BOOTSTRAP_PASSWORD` | Used once by the bootstrap script, then deleted. **Values provided by owner in chat; never committed** |
| `ALLOWED_ORIGINS` | Custom domain (if any) |
| `VERCEL_ENV`, `VERCEL_URL` | Provided by Vercel |

### 8.10 Deployment (local vs preview vs production)

| | Local | Preview | Production |
|---|---|---|---|
| Run | `npx vercel dev` | Push to any non-`main` branch of the private GitHub repo ✅ | Push/merge to `main` ✅ |
| URL | `http://localhost:3000` | `kotoha-fansite-<hash>.vercel.app` (protected) | **`kotoha-fansite.vercel.app`** ✅ |
| Env vars | `.env.local` (git-ignored) | Vercel Preview scope | Vercel Production scope |
| Database / Cloudinary | **shared** ✅ | **shared** ✅ | **shared** ✅ |
| Analytics | tagged, excluded from dashboard | tagged, excluded | counted |
| Language default | no IP header → use `?lang=ja` to test | IP-based | IP-based |
| Access | local | Vercel-login protected | public |

`vercel.json`: `cleanUrls`, function region `sin1`, security headers, caching. `.vercelignore`: previous attempt, references, docs, raw originals.

### 8.11 Repository layout

```
public/ (index.html, login.html, admin.html, css/, js/{public,admin,shared}/, locales/, assets/)
api/  lib/  db/migrations/  db/seed.sql
scripts/ (migrate, admin-bootstrap, admin-reset-password, optimize-images, seed-gallery, prelaunch-reset)
middleware.js  vercel.json  package.json  .env.example  .gitignore  .vercelignore  README.md
```

---

## 9. Database Plan

> All timestamps `timestamptz`; `set_updated_at()` trigger. Publication: `status ∈ ('draft','published')`.
> **Language columns ✅:** every admin-entered text is **one column**, shown as typed in both language modes (`N6`, `N7` = b). There are no `_ja`/`_en` pairs in the database.

### 9.1 `admin_users`

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity PK | |
| `username` | text unique | Owner = bootstrap username; Admins = `<owner-username>` + number |
| `admin_number` | integer unique null | 2, 3, 4… from a sequence; **never reused** |
| `role` | text | `check in ('owner','admin')`; partial unique index ⇒ one `owner` |
| `password_hash` | text | Argon2id |
| `must_change_password` | boolean default true | |
| `temp_password_expires_at` | timestamptz null | |
| `password_changed_at`, `last_login_at`, `locked_until` | timestamptz null | |
| `failed_login_count` | integer default 0 | |
| `is_active` | boolean default true | false after removal (archived) |
| `preferred_lang` | text null | `ja`/`en` for the admin UI |
| `created_by` | bigint FK null | |
| `created_at`, `updated_at` | timestamptz | |

### 9.2 `admin_sessions`, `login_attempts`

As in v0.2: hashed tokens, cascade on user delete (users are never hard-deleted, only deactivated); login attempts hashed-IP, 30-day retention (operational data).

### 9.3 `videos`

`id` · `youtube_id` (unique, 11-char regex) · `title` (single, original; auto-filled from YouTube oEmbed, editable ✅ `N6`) · `posted_on date` (default today, editable) · `status` · `created_by`/`updated_by` · timestamps. Order `posted_on DESC, created_at DESC`. Index `(status, posted_on DESC)`.

### 9.4 `news`

`id` · `posted_on date` (default today) · `headline` (≤ 200) · `summary` (≤ 500) · `links jsonb default '[]'` (≤ 3 items `{url, label_key}`; `label_key ∈ watch|listen|details|tickets|official|shop`, translated by the locale files (§7.0 `N8`); `http(s)` only) · `status` · audit · timestamps. Order `posted_on DESC, id DESC`.

### 9.5 `achievements`

`id` · `achieved_on date` · `text` (≤ 500) · `link_url null` · `status` · audit · timestamps. Order `achieved_on DESC, id DESC`.

### 9.6 `discography_items` ✅

`id` · `title` (single, original ✅) · `release_type` (`single`, `album`, `ep`, `tie_in`, `cover`, `collab`, `other`) · `released_on date` · `note` (e.g. tie-in/credit) · `youtube_id null` (cover = YouTube thumbnail ✅; placeholder if null) · `links jsonb` (≤ 3) · `status` · audit · timestamps. Order `released_on DESC`.

### 9.7 `gallery_images` ✅

`id` · `cloudinary_public_id` (unique) · `cloudinary_version` · `secure_url` · `width`/`height` · `format` · `bytes` · `author_name` (language-neutral) · `source_url` · `status` · `uploaded_by` · timestamps. Alt text auto-generated per language. Order `created_at DESC, id DESC`; cursor pagination.

### 9.8 `archived_content` ✅

`id` · `source_table` (`videos`, `news`, `achievements`, `discography_items`, `gallery_images`, `admin_users`) · `source_section` (label) · `original_id` · `record jsonb` (full snapshot; **`password_hash` excluded** for accounts) · `archived_at` · `archived_by_id` · `archived_by_username` (snapshot) · `reason null` · `note null` (e.g. "Image file permanently deleted from Cloudinary") · `restored_at` / `restored_by_id`.

Archive = copy + delete in one transaction. Restore re-inserts (gallery restores are disabled because the file is gone; accounts are restored as inactive → Owner reactivates with a new temp password). Indexes `(source_table, archived_at DESC)`.

### 9.9 `activity_log`

`id` · `admin_user_id` · `admin_username` · `action` · `entity_type` · `entity_id` · `details jsonb` (no secrets) · `created_at`.

### 9.10 `analytics_events` / `analytics_daily`

As §8.8; indexes on `(occurred_at)`, `(event_type, occurred_at)`, `(content_type, content_id, occurred_at)`; `environment` column; raw 90 days, daily totals kept.

### 9.11 Seed strategy

- `db/migrations/0001_init.sql` + `db/seed.sql` ✅ (idempotent; §5.7 content with text in its original (official) wording, single field; **no credentials**).
- `scripts/admin-bootstrap.js` creates the Owner from env vars.
- `scripts/seed-gallery.js` uploads §3.3 images with credits.
- `scripts/prelaunch-reset.js` (`A13`): clears test rows and test uploads, re-seeds, re-bootstraps. Guarded by a confirmation flag; intended to run once before launch.

---

## 10. Page & Component Plan

### 10.1 Structure

`#loader` · `#home` (HeroHeader inside) · ScrolledNav (fixed, hidden on Home) · `#mobile-menu` · `#about` · `#news` · `#discography` · `#gallery` (free-scroll zone) · `<footer>` · dialogs (lightbox, credits).

### 10.2 Components (changes since v0.2 in bold)

| Component | Behavior |
|---|---|
| HeroHeader | Logo, nav, socials, **JP/EN switch** |
| ScrolledNav | Logo, nav, **JP/EN switch, no socials** |
| LangSwitch | Instant switch; remembers choice; tracks switches |
| StreamCountdown | Hardcoded schedule, localized labels |
| VideoPlayer + **VideoList** | Facade player; **list of all videos** (desktop vertical / mobile swipe row), paged |
| NewsList | **All news**, paged inside the scroll list |
| DiscographyList / AchievementsList | **All records**, paged |
| InfiniteGallery | Masonry, sentinel-driven paging, "Load more" fallback button for keyboard/screen readers, then Footer |
| Footer | Moesoft logo, disclaimer (JA/EN), obfuscated email, section links, official links, art credits, privacy note, JP/EN switch, back-to-top, © Moesoft |
| Lightbox | Author + source link, arrows/swipe, no download |
| States | Skeletons, empty (mascot), error + retry |

### 10.3 Responsive

Breakpoints per §7.0 C6; `clamp()` type; locked `--app-height`; per-section art direction; Japanese line-breaking (`word-break: auto-phrase` + fallback); every card and pill tested in both languages.

### 10.4 `/login` & `/admin`

- **Login:** JP/EN; username/password; show-password; generic error; lockout message.
- **Forced change:** current/temporary password, new, confirm, live rule checklist (12+, not username, not common, not leaked), sign out.
- **Admin screens:** newest-first lists with Draft/Published pills; editor with **one field per text** (names/titles in original form, descriptions in any language); link labels chosen from a dropdown; archive with confirmation; YouTube link → auto title/thumbnail; gallery drop zone with auto-downscale and progress; Archive page (filter by section, Restore); Activity Log; **Accounts (Owner):** create → shows `<owner-username>N` + temporary password once, reset, remove; My Account: change password, sign out other devices; Dashboard charts.

---

## 11. Animation & Interaction Plan

| Library | Owns | Never used for |
|---|---|---|
| Lenis + `lenis-snap` | Smooth wheel scroll, strict snap (Home→Gallery top), `scrollTo` | Inner lists, gallery free-scroll zone, reduced motion |
| GSAP | Loader clover-iris exit, section entrances, hero header → scrolled nav transition, light desktop parallax | Micro-interactions |
| ScrollTrigger | Triggering entrances/nav state; gallery zone boundary (disable/enable snap); synced to Lenis | Long pinned timelines |
| Anime.js | Clover menu bloom, menu stagger, button boing, countdown tick, loader breathing, pose tap, language text swap | GSAP-owned elements |
| Animate.css | Admin toasts/dialogs/shake; empty/error states; gallery items fading in | Scroll-driven elements |
| canvas-confetti | Logo click, June 10/July 8, pose tap, admin publish | Ambient loops |
| Lucide | UI icons | Social logos |
| ~~Howler~~ | — | — |

**Loader:** min 3.0 s; Tier 1 (fonts incl. JA subset if JA, logo, Home art, `/api/public/home`, layout lock, scroll/animation init) + Tier 2 (all other section art at device size, pose, first gallery page); reveal at ≥ 3 s when Tier 1 is done and Tier 2 is done or 6 s have passed; hard cap 10 s; the rest continues in the background.

**Snap:** "free scroll then glide" ✅; snapping disabled inside the Gallery zone and re-enabled above it; touch strategy chosen in the prototype; never CSS snap and Lenis on the same scroller; reduced motion → native CSS snap, no Lenis.

---

## 12. Security Plan

- **Authentication:** generic errors; DB-backed throttling/lockout; dummy-hash timing protection; HTTPS.
- **Sessions:** `__Host-kf_session` (HttpOnly, Secure, SameSite=Strict), hashed tokens, 7 d / 2 h idle, rotation, revocation on password change and account removal.
- **Roles:** `requireAdmin` (active, password changed) and `requireOwner` (+ role). DB invariant: a single Owner. The Owner can't be removed/demoted/reset via the UI. Admins can't manage accounts. No self-escalation.
- **Bootstrap:** credential provided by owner; env vars only; the bootstrap script refuses to run if an Owner exists; forced change; first login immediately after deploy; bootstrap env vars deleted afterwards. ⚠️ The default password is guessable until changed.
- **Temp passwords:** `crypto.randomInt`, unambiguous alphabet, hashed, shown once, 7-day expiry, forced change, logged (without the value).
- **Password policy:** ≥ 12, ≤ 128; not the username/temporary/default password; blocklist (kotoha, hakoniwa, lily, clover, password, …); HIBP k-anonymity range check (only 5 hash characters leave the server; if HIBP is unreachable, the check is skipped rather than blocking the change).
- **Storage:** Argon2id (bcrypt fallback); rehash on parameter change.
- **Env vars:** server-only; `.env.example` placeholders; `.gitignore` covers `.env*`, `.vercel/`.
- **API:** method allow-lists; body limits; Origin check + SameSite; full validation (required text fields non-empty, `http(s)` URLs, link `label_key` allow-list, YouTube ID regex, ≤ 3 links); published-only public responses; no stack traces; rate-limited `/api/track`.
- **Headers:** CSP (self + cdnjs, jsDelivr, Google Fonts, res.cloudinary.com, i.ytimg.com, youtube-nocookie frames, api.cloudinary.com connect), HSTS, nosniff, Referrer-Policy, Permissions-Policy; admin/API `no-store` + `noindex`; SRI on pinned scripts.
- **Uploads:** signed preset (folder, formats, size), random IDs, server-side response-signature verification + re-validation, out-of-policy uploads destroyed, EXIF/GPS stripped.
- **Database:** parameterized queries; TLS; no raw IPs; no secrets in archive/activity; restore point before schema changes (shared DB).
- **Cloudinary:** secret server-only; signed uploads only; dedicated folder; the samples folder is never touched.

---

## 13. Implementation Phases

| # | Phase | Waits on |
|---|---|---|
| 0 | ~~Decisions~~ **Done**: v0.5 approved 2026-09-26 | — |
| 1 | Accounts & setup: GitHub CLI (owner installs + logs in) → private repo `kotoha-fansite` (commits use the GitHub noreply email) → Vercel project `kotoha-fansite` linked to the repo (owner approves Vercel's GitHub access once) → Neon project (Singapore) → Cloudinary signed preset → env vars in Vercel | owner's one-time logins |
| 2 | Foundation: git, ignore files, `package.json`, `vercel.json`, layout, `.env.example`, README; verify middleware + Argon2 on Vercel | 1 |
| 3 | Snap prototype incl. gallery free-scroll zone, on real devices | — |
| 4 | Database: migrations, `seed.sql`, bootstrap + seed-gallery scripts, `JA_REVIEW_LIST.md` | N7 |
| 5 | Backend core + public paged endpoints | 4 |
| 6 | Auth, Owner/Admin roles, temp passwords, accounts API | 5 |
| 7 | Image pipeline (derivatives, SVGs, favicon/OG, TwitCasting logo after download confirmation) | — |
| 8 | i18n foundation (locales, middleware cookie, switcher, fonts) | N2 |
| 9 | Public UI (all sections, hero/scrolled headers, lists with all records, infinite gallery, footer) | 3, 5, 7, 8 |
| 10 | Loader | 9 |
| 11 | Animations | 10 |
| 12 | Admin: content CRUD, Archive, Activity Log | 6 |
| 13 | Admin: gallery upload/delete | 12 |
| 14 | Admin: Accounts (Owner), My Account | 6 |
| 15 | Analytics tracking + dashboard | 9, 12 |
| 16 | Quality pass (a11y in both languages, performance, cross-browser, security review) | all |
| 17 | Pre-launch reset (`A13`) → production deploy → Owner first login + password change → delete bootstrap env vars → docs (setup, local dev, DB, deploy, admin guide JA/EN) | all |

---

## 14. Risks & Concerns

| Area | Risk | Mitigation |
|---|---|---|
| Scroll | Lenis/snap/ScrollTrigger conflicts; snap ↔ gallery free-scroll handover | Single owner per behavior; explicit zone boundary; prototype |
| Mobile | URL-bar height changes; long sections on small phones | Locked `--app-height`; sections may grow |
| **Shared DB** | Local/preview testing touches live data; migrations run directly on production | Pre-launch reset; drafts-only testing after launch; restore point before schema changes; analytics filtered to production |
| Bilingual | English visitors see admin-entered Japanese text as typed (owner-accepted tradeoff for single entry); Japanese quality of my own UI/About text; layout differences | Dropdown link labels; official wording reuse + `JA_REVIEW_LIST.md`; test all cards in both languages and with long Japanese/English strings |
| Geo language | IP detection is approximate; no IP header locally | Saved choice overrides; `?lang=` for testing |
| "All records" lists | Long lists in fixed-height cards | Paged loading inside lists; lightweight rendering |
| Infinite gallery | Keyboard/screen-reader users can't reach the footer | "Load more" button fallback + skip link to footer |
| Uploads | 10 MB / 25 MP limits; HEIC in non-Safari browsers | Auto-downscale; friendly hint for oversized HEIC |
| Accounts | Equal content power for all admins | Archive + Restore, Activity Log, Owner can remove admins |
| Bootstrap | Guessable default password until changed | Forced change, immediate first login, throttling |
| Vercel platform | Middleware/Argon2 in a framework-less project; ~4.5 MB body limit | Verify in Phase 2; signed direct upload |
| Neon | Singapore is ~70 ms from Japan (no Tokyo region) | Edge caching of public reads; loader hides first-load latency |
| Copyright | Art used without permission (owner-accepted) | Credits, disclaimer, takedown contact, fast removal |
| Data freshness | Research is a 2026-09-26 snapshot; upcoming items (10-07 release) | Admins update via dashboard |

---

## 15. Final Pre-Implementation Checklist

### ✅ Confirmed

Everything in §6.1, plus: GitHub route (noreply email), `kotoha-fansite.vercel.app`, pre-launch reset + drafts-only testing, Japanese review process, single-entry DB text, JST analytics. Service accounts verified in §5.9.

### ❓ Needs clarification

None (owner-facing). Technical items are tracked in `PROGRESS.md`.

### ⛔ Blocked

| Item | Waiting on |
|---|---|
| Private GitHub repo + Vercel Git link | Owner installs GitHub CLI + runs `gh auth login` once; approves Vercel's GitHub access once |

### 🟢 Authorized and in progress

See [`docs/PROGRESS.md`](PROGRESS.md) for the live checklist.

**Architecture clarity: 97%** (§7.1).

---

## 16. Decision Log

| Date | ID | Decision | By |
|---|---|---|---|
| 2026-09-26 | — | Phase 1 inspection; plan v0.1 | — |
| 2026-09-26 | A1, A2 | Static frontend + Vercel Functions; minimal server deps | Owner |
| 2026-09-26 | A4 | Automate setup as far as possible | Owner |
| 2026-09-26 | A7 | Same Neon/Cloudinary accounts for dev and prod | Owner |
| 2026-09-26 | B1 | Research authorized; videos/news/achievements in DB | Owner |
| 2026-09-26 | B2 | Official data wins: games = VALORANT, LoL, Honkai: Star Rail; 優里/Tani Yuuki corrected | Research |
| 2026-09-26 | B3 | Bilingual JA/EN; Japan IP → JA; switchable | Owner |
| 2026-09-26 | B5 | About hardcoded; flexible pill count; border color free | Owner |
| 2026-09-26 | B8 | Achievements in DB | Owner |
| 2026-09-26 | B10 | 4th social = TwitCasting | Owner |
| 2026-09-26 | B13 | Footer with Moesoft logo, disclaimer, contact email | Owner |
| 2026-09-26 | C1 | Hero header inside Home; scrolled nav elsewhere | Owner |
| 2026-09-26 | C7 | Infinite gallery, footer at bottom | Owner |
| 2026-09-26 | D1–D7 | Loader ≥ 3 s, preloading, design delegated | Owner |
| 2026-09-26 | E1 | Strict snap | Owner |
| 2026-09-26 | F1 | No sound; Howler dropped | Owner |
| 2026-09-26 | G1 | Archive instead of permanent deletion | Owner |
| 2026-09-26 | G2, G3 | Newest first; no manual reordering | Owner |
| 2026-09-26 | G4 | News: date posted, headline, short description, optional links | Owner |
| 2026-09-26 | G6 | Gallery: image + author + source link | Owner |
| 2026-09-26 | H1, H2 | Default upload config; no manual compression | Owner |
| 2026-09-26 | H4 | Permanent Cloudinary deletion | Owner |
| 2026-09-26 | I3 | Bootstrap credential (env only); forced change | Owner |
| 2026-09-26 | I5 | Owner manages Admins; temp 8-char passwords; equal content powers | Owner |
| 2026-09-26 | J1 | Primary features: analytics, content input, accounts, change password | Owner |
| 2026-09-26 | K1 | Visits d/w/m, section dwell, mobile vs desktop | Owner |
| 2026-09-26 | M1 | Art used without permission, credited, takedown on request | Owner |
| 2026-09-26 | A11 (part) | Claude-app connectors for Neon/Vercel/Cloudinary confirmed working in this session; GitHub still open | Verified |
| 2026-09-26 | A12 | **No data separation**: dev/prod share one DB and one Cloudinary folder | Owner |
| 2026-09-26 | N1 | Both languages required for DB text. *Narrowed in round 3 by N6 (names/titles once); descriptive text pending `N7`* | Owner |
| 2026-09-26 | N2 | Headings/menus "interchangeable": read as switching with the language toggle (confirm in §7.2) | Owner |
| 2026-09-26 | N3 | Non-Japan visitors → English; admin panel language switchable | Owner |
| 2026-09-26 | N4 | M PLUS Rounded 1c; front-end details delegated | Owner |
| 2026-09-26 | E2 | Snap feel: free scroll, then glide to nearest section | Owner |
| 2026-09-26 | C7 | Gallery: growing page, snap off inside; masonry (delegated) | Owner |
| 2026-09-26 | C15 | No social icons in the scrolled nav | Owner |
| 2026-09-26 | B7 | Discography in DB; covers = YouTube thumbnails | Owner |
| 2026-09-26 | B12 | Seed the 3 latest works; stream replays excluded by default (my suggestion, as requested); admins may add any video | Owner → delegated |
| 2026-09-26 | B15 | Include HaKoniwalily unit news; seed all 10 researched items | Owner |
| 2026-09-26 | B10 | Use TwitCasting's official logo (download confirmed with owner at implementation) | Owner |
| 2026-09-26 | C8 | Unknown credits → "Artist unknown: contact us"; gallery seeded with credited artworks + official sheets | Owner |
| 2026-09-26 | B16 | Footer contents approved; email obfuscated | Owner |
| 2026-09-26 | G12 | Single `archived_content` table; Archive page with Restore; removed admins archived; gallery records archived after file deletion | Owner |
| 2026-09-26 | G13 | Dates pre-filled (editable); ≤ 3 links; drafts; **sections show all records, hero shows newest (1 video, 2 news)** | Owner |
| 2026-09-26 | I11 | Role name **Owner**; Admin usernames **auto-numbered** | Owner |
| 2026-09-26 | I1 | Recommended password config (min 12 + leak check; 7 d / 2 h sessions) | Owner |
| 2026-09-26 | J6 | Admin menu approved | Owner |
| 2026-09-26 | K10, K3 | All suggested analytics extras; cookieless uniques | Owner |
| 2026-09-26 | A11 | **GitHub route**: GitHub CLI via `winget` (install confirmed with owner at that moment), one browser login, private repo `kotoha-fansite`, auto-deploy to Vercel | Owner |
| 2026-09-26 | A6 | Production URL `kotoha-fansite.vercel.app` (unclaimed as of check) | Owner |
| 2026-09-26 | A13 | Free testing before launch + **one clean reset right before launch**; drafts-only testing after launch | Owner |
| 2026-09-26 | N2 | Confirmed: headings and menus switch with the JP/EN toggle | Owner |
| 2026-09-26 | N5 | No reviewer now: reuse official Japanese wording, keep my Japanese simple, keep a review list; change only after others' feedback | Owner |
| 2026-09-26 | N6 | **Names/titles entered once in their original form** and shown as-is in both languages (single admin entry) | Owner |
| 2026-09-26 | N7 | **(b) Everything entered once**: descriptive text in any language, shown as typed in both modes; no auto-translation | Owner |
| 2026-09-26 | G1 | Owner has a GitHub account; commits use the **GitHub noreply** email | Owner |
| 2026-09-26 | K11 | Analytics days/weeks/months in **Japan time (JST)**; weeks start Monday | Owner |
| 2026-09-26 | — | **Implementation authorized.** Self-guide/checkpoint file `docs/PROGRESS.md` created first, as requested | Owner |
