# Kotoha Fan Site — Admin Panel UI Refresh (front end only)

| | |
|---|---|
| **Status** | **v0.2 (2026-10-25): approved and built (A0–A5) on branch `admin-ui-refresh`, checked on a local mock preview. Not committed, not deployed.** Waiting for the owner's look at localhost (✋), then A6 (real-data regression) and A7 (merge) |
| **Scope** | How the admin panel (`/admin`) and the sign-in page (`/login`) **look and lay out**. The dashboard gets the most work; every other admin screen gets the shared component polish |
| **Not changing** | API (`api/*`), `lib/*`, database, migrations, analytics collection, the data shown, auth/roles, CSP/SRI rules, the public site |
| **Supersedes** | `DESIGN_V2_PLAN.md` round 1, Q2 ("keep the current admin look"). That plan stays as it is for the public site |
| **Branch** | `admin-ui-refresh` from `main`; merge only with the owner's OK (same workflow as design v2) |
| **Resume file** | This file (§9 is the checklist). `docs/PROGRESS.md` stays the source of truth for everything else |

---

## 0. Ground rules for this update

1. **Front end only.** Files allowed to change: `public/admin.html`, `public/login.html`, `public/css/admin.css`, `public/js/admin/*.js`, `public/locales/admin/{en,ja}.json`. Nothing under `api/`, `lib/`, `db/`, `scripts/`, `vercel.json`.
2. **Existing data only.** Every number, list and label on screen comes from what the endpoints already return (§2). Totals, percentages or "published vs draft" splits may be **calculated in the browser** from that data; no new endpoint, field or query.
3. **No new features, no new libraries.** Same stack: vanilla ES modules, no build step, Lucide 1.48.0 (already loaded), Animate.css 4.1.1, canvas-confetti 1.9.4, Fredoka + M PLUS Rounded 1c. Charts stay hand-written SVG. No dark mode, no drag-and-drop reordering, no search, no bulk actions, no new pages.
4. **Keep every behaviour.** Routes, dialogs, forms, validation messages, paging ("Load more"), archive/restore, Owner-only screens, forced password change, the render-race guard in `main.js`, the "waking up the database" hint.
5. **Project rules still apply** (`PROGRESS.md` §1): `textContent` for DB text (never `innerHTML` with data), keyboard reachable, visible focus, `prefers-reduced-motion`, ≥ AA contrast, no new CDN origins (the CSP would block them anyway).
6. **New UI strings** (only a few, §6) go into both locale files; the Japanese ones are appended to `docs/JA_REVIEW_LIST.md`.

---

## 1. Current state (analysis, 2026-10-25)

### 1.1 Structure

| File | Lines | Role |
|---|---|---|
| `public/admin.html` | 61 | Shell: top bar, sidebar (10 links, Accounts Owner-only), `<main id="view">`, toasts, one shared `<dialog>` |
| `public/css/admin.css` | 247 | All admin styles; own `:root` palette (pink/green), no cascade layers |
| `js/admin/main.js` | 135 | Auth check, forced change, language, hash router (`#/dashboard` …) |
| `js/admin/pages.js` | 210 | Dashboard, Archive, Activity Log, Accounts, My Account |
| `js/admin/analytics.js` | 222 | Visitor statistics on the dashboard (KPIs, SVG charts, bar lists) |
| `js/admin/content.js` | 253 | Generic list + add/edit dialog for videos / news / achievements / discography |
| `js/admin/gallery.js` | 195 | Upload queue (drop zone, auto-shrink, progress) + image grid |
| `js/admin/ui.js` | 175 | Helpers: toast, dialog, confirm, fields, pills, `pageHead`, formatting |
| `js/admin/{api,login,password,prepaint,styles}.js` | — | API client, sign-in, password form, pre-paint, CDN CSS loader |
| `public/locales/admin/{en,ja}.json` | 350 each | All admin strings |

### 1.2 Data the dashboard already has

- **`GET admin/summary`** → `{videos,news,achievements,discography,gallery}_{published,draft}` (10 counts).
- **`GET admin/analytics?range=7|30|90|365`** → 
  - `kpis.today / week / month` `{visits, uniques}` (fixed periods, **not** affected by the range), `kpis.range.visits`, `kpis.avgVisitMs`, `kpis.avgLoaderMs` (these **are** range-based);
  - `series.daily / weekly / monthly` `[{key, visits, uniques}]`;
  - `sections[{key, reach, reachPct, avgMs}]`, `devices`, `browsers`, `languages`, `langSwitches`, `countries`, `sources`, `hours[24]`, `videoPlays[{key,name,value}]`, `outbound`, `newsLinks`, `gallery[{key,name,opens,creditClicks}]`.
- **`user`** from `auth/me` → `username`, `role`.

### 1.3 What works well (keep)

- Clean module split, one `el()` helper, all text through `textContent`.
- Charts are tiny, dependency-free SVG with `<title>` tooltips and `role="img"` labels.
- Consistent page pattern: `pageHead` → toolbar → `.items` list → "Load more".
- Bilingual everywhere, JST everywhere, CDN assets never block the page.

### 1.4 UI problems found

**Dashboard**
1. **Two kinds of numbers look identical.** Content counts (`stat`) and visitor KPIs (`kpi`) use the same `.stats` tiles, so "12 News" and "340 visits today" read as the same kind of thing.
2. **The big number is unexplained.** Content tiles show the published count large and "published · 2 drafts" small; drafts are easy to miss and there's no icon tying the tile to its sidebar section.
3. **The range control is in the wrong place.** "Breakdown for: 7/30/90/365 days" sits *under* the KPIs and chart, but it also changes the *Avg visit* and *Avg loading* KPIs above it, while *Today / This week / This month* and the chart ignore it. It's not obvious which numbers follow the range.
4. **The visits chart is small and flat:** one grid line, no visible hover value (only the native `<title>` tooltip, which is slow and invisible on touch), legend under the chart, no total for what is shown.
5. **Twelve breakdown cards in one undifferentiated grid** (sections, devices, languages, countries, sources, hours, video plays, social clicks, news links, gallery, browsers). No grouping, all the same weight.
6. **Mobile chart hack:** `.chart:not(.chart--hours) .chart__tick { font-size: 24px }` under 600 px (makes up for the viewBox scaling). Works, but labels still collide on the daily chart.
7. **Loading = plain "Loading…" text**; the analytics block jumps in height when data arrives.

**Shell / shared**
8. **Mobile sidebar has no backdrop**: tapping outside or pressing Esc doesn't close it; the page behind stays clickable.
9. **Sidebar is a flat list of 10 links** with one separator; no grouping between *content*, *records* and *account*.
10. **Inline styles in JS** (`style: 'text-decoration:none;color:inherit'`, `'display:grid;place-items:center'`, `'margin-top:12px'`, `'margin:8px 0 16px'`) instead of classes.
11. **Grid-column hacks:** Activity rows add an empty `<span>` to fill the 3-column `.item` grid; Archive uses a pill as the "thumbnail" column.
12. **Every card uses a 2 px border** (dashed on `.card`, solid elsewhere) and no elevation, so the page looks busy but flat; the pink page background (`--pink-soft`) behind white cards with grey borders lowers contrast between areas.
13. **Admin palette drifts from the public design system** (`css/v2/tokens.css`): same brand colours under different names (`--green-dark` = `--green-700` `#2f7a1f`, `--pink` = `--pink-300` `#fe9fb9`), plus one-off hex values in `.pill--*`, `.toast--info`, `.chart__bar`.
14. **Empty states** are a dashed box with "Nothing here yet"; error states are a red line of text.

---

## 2. Goal

A **calmer, clearer admin panel** that keeps the Kotoha brand (pink + clover green, Fredoka) but reads like a tool: the dashboard answers *"what's on the site, what's waiting as a draft, how are visitors doing"* at a glance; every other screen gets the same tidier components. Same data, same features, same behaviour.

---

## 3. Design direction

- **Calm brand, not scrapbook.** The public site's paper/tape/sticker vocabulary stays on the public site. The admin borrows only its **tokens** (colours, type scale, radii) so both feel like one project.
- **Surfaces:** off-white page (`--paper` `#fffaf2` or a very light pink), white cards with a **1 px** border + soft shadow; the dashed "stitch" border kept only for the drop zone and empty states (where it means "put something here").
- **Hierarchy through type and space**, not borders: one clear page title, section headings with a small Lucide icon, muted labels, big tabular numbers.
- **Colour meaning stays fixed:** green = published / primary action, grey = draft, pink-red = danger, amber = warning. Pills, toasts and buttons use the same tokens.
- **Motion:** only what exists today (button lift, Animate.css toasts) plus short fades for skeleton → content. All of it off under `prefers-reduced-motion`.

---

## 4. Dashboard (main work)

Proposed order, top to bottom (desktop; phones stack the same blocks):

```
┌ Hello, {name}! ──────────────────────────────── [View site] ┐
│ intro line · today's date (JST)                              │
├──────────────────────────────────────────────────────────────┤
│ SITE CONTENT                                                 │
│ [▶ Videos 12 | 1 draft] [📰 News 10] [🏆 Achievements 33]     │
│ [💿 Discography 10]     [🖼 Gallery 8]   ← each links to page │
├──────────────────────────────────────────────────────────────┤
│ VISITORS                                                     │
│ Today 34 · 20 unique | This week … | This month …            │
│ ┌ Visits ─────────────── [Daily|Weekly|Monthly] ┐            │
│ │ total for shown period · legend                │            │
│ │ ▁▃▅▂▇▆▃ (bigger chart, hover/focus value)      │            │
│ └────────────────────────────────────────────────┘            │
├──────────────────────────────────────────────────────────────┤
│ DETAILS FOR [7|30|90|365 days]  · N visits in range          │
│ Avg visit 1m 20s · Avg loading 3.4 s   ← range-based KPIs     │
│ ── Audience:   Devices · Browsers · Languages · Countries     │
│ ── Traffic:    Sources · Busiest hours (JST)                  │
│ ── Engagement: Sections reached · Video plays · Official      │
│                link clicks · News links · Gallery             │
├──────────────────────────────────────────────────────────────┤
│ privacy note                                                  │
└──────────────────────────────────────────────────────────────┘
```

### 4.1 Header
- Greeting + intro (existing strings) + today's date in JST (`formatDateTime`/`Intl` already used in `ui.js`).
- Optional right-side "View site" duplicate is **not** added (it's already in the top bar). Nothing else new here.

### 4.2 Site content tiles (`admin/summary`)
- One tile per section with the **same Lucide icon as its sidebar link** (`circle-play`, `newspaper`, `trophy`, `disc-3`, `images`).
- Big number = published (as today); drafts shown as a grey **pill** ("1 draft") only when > 0, so waiting drafts stand out.
- A thin published/draft split bar (pure CSS width from the two counts).
- Whole tile stays a link to its page; hover/focus state from CSS classes (removes the inline style).

### 4.3 Visitors: fixed-period KPIs + chart
- *Today / This week / This month* as a compact KPI strip, visually distinct from content tiles (smaller, no icon, number + "N unique" underneath).
- **Visits chart**: taller on desktop, 3 light grid lines (0, ½, max), legend moved into the panel header, total visits + uniques for the shown series (summed in the browser from `series[kind]`).
- **Readable values on hover, focus and tap**: a small positioned label (one reusable `<div>`, `textContent`) driven by the existing per-column data; columns become focusable (`tabindex`, arrow keys optional) so keyboard users get it too. The `<title>` stays for screen readers.
- Phones: replace the 24 px tick hack with fewer labels (every 7th day for daily) and a chart height that doesn't scale tick text down to unreadable.

### 4.4 Range-based details
- **Move the range control into the heading of this block**, together with *Avg visit* and *Avg loading* (the two KPIs it actually affects) and the existing "N visits in this period" line. Fixes problem 3 without changing any number.
- Group the eleven cards under three small headings — **Audience**, **Traffic**, **Engagement** (new strings, §6). Cards keep their current content and hints.
- Bar lists: same data, slightly taller tracks, value right-aligned in tabular numerals, rank number optional (from array index).
- Busiest hours chart: highlight the top hour (computed in the browser), label ticks 0/6/12/18.
- While a new range loads: keep the old content dimmed (as today with `aria-busy`) instead of re-rendering; first load shows **skeleton cards** at final size (CSS only) so the page doesn't jump.

### 4.5 Errors and empty data
- Same messages and Retry button, in a styled error panel (icon + text + button).
- "No data yet" boxes: lighter style, same string.

---

## 5. Shell and shared components (light touch, all screens)

| Area | Change |
|---|---|
| Tokens | Rewrite `admin.css` `:root` using the v2 names/values (`--pink-*`, `--green-*`, `--paper`, `--ink`, `--ink-soft`) plus admin-only tokens (surface, border, shadow, radius, spacing scale). Replace one-off hex values in pills/toasts/charts. Keep `admin.css` a separate file (no `@layer` import of the public tokens, to avoid cascade surprises) |
| Top bar | Same items; tighter spacing, user badge with role pill, consistent ghost buttons |
| Sidebar | Visual groups using the existing separator idea: *Content* (Videos → Gallery), *Records* (Archive, Activity), *Account* (Accounts, My Account) — three small group labels (§6). Clearer active state (green bar + tint) |
| Mobile nav | Backdrop scrim; tap outside / Esc / route change closes it; focus moves into the menu when opened and back to the toggle when closed. Same `#nav-toggle` + `aria-expanded` |
| Page head | Same `pageHead()`; title + hint + actions aligned, consistent spacing |
| Toolbar / filters | Same segmented control, sized like the buttons (44 px targets) |
| Item rows (`content.js`, Archive, Activity, Accounts) | `.item` gets modifiers instead of filler elements: `.item--no-thumb` (Activity), `.item--tag` (Archive's section pill) → removes the empty `<span>` hack; thumbnails get a placeholder icon when missing |
| Gallery | Same queue + grid; drop zone keeps the dashed border; cards with a 1 px border + shadow, credit/status/actions spacing tidied |
| Dialog | Same `<dialog>`; header/footer separation, sticky action row for long forms (news, discography), better small-screen padding |
| Toasts | Same API (`toast(msg, kind)`); icon per kind (Lucide `check`, `circle-alert`, `info`) |
| Empty / error states | One `.state` style (icon + text, optional button) used by lists, gallery and analytics |
| Inline styles | Every `style:` in `pages.js` / `main.js` / `content.js` → a class in `admin.css` |
| Login page | Same form and behaviour; restyled with the new tokens so it matches the panel |
| Forced password change / My Account | Same forms; use the panel + field styles; rules checklist with Lucide icons instead of ○ ✓ ✗ characters (labels unchanged) |

---

## 6. New strings (the only "content" added)

Both `public/locales/admin/en.json` and `ja.json`; Japanese appended to `docs/JA_REVIEW_LIST.md`.

| Key | EN | JA (draft) |
|---|---|---|
| `dashboard.contentTitle` | Site content | サイトのコンテンツ |
| `dashboard.draftsN` | {n} draft(s) | 下書き {n} 件 |
| `analytics.detailsFor` | Details for | 期間別の詳細 |
| `analytics.groups.audience` | Audience | 訪問者 |
| `analytics.groups.traffic` | Traffic | アクセス |
| `analytics.groups.engagement` | Engagement | 反応 |
| `analytics.totalShown` | {visits} visits · {uniques} unique in this chart | このグラフ：訪問 {visits} 回・ユニーク {uniques} 人 |
| `nav.groups.content` / `records` / `account` | Content / Records / Account | コンテンツ / 記録 / アカウント |

Existing keys are reused wherever possible (`analytics.breakdownFor` may simply be reworded instead of adding `detailsFor`).

---

## 7. Files

**Will change:** `public/css/admin.css` (most of the work), `public/js/admin/analytics.js`, `public/js/admin/pages.js`, `public/js/admin/ui.js` (state/skeleton helpers, toast icons), `public/js/admin/main.js` (nav backdrop/Esc/focus), `public/js/admin/content.js` + `gallery.js` (class names only, no logic), `public/admin.html` (sidebar group labels, scrim element), `public/login.html` (classes only), `public/locales/admin/{en,ja}.json`, `docs/JA_REVIEW_LIST.md`, `docs/PROGRESS.md`.

**Will not change:** `api/*`, `lib/*`, `db/*`, `scripts/*`, `vercel.json`, `public/index.html`, `public/css/v2/*`, `public/js/public/*`, `public/js/shared/*` (unless a bug is found; then ask first).

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Breaking a CRUD flow while touching class names | Logic untouched; full regression pass (§9 A6) |
| CSP violations from new styles/scripts | No new origins; no inline `<script>`; `style-src 'unsafe-inline'` already allows the `el()` width styles |
| Long Japanese labels overflow new tiles/headings | Check every screen in JA at 360 px and 1366 px |
| Cold Neon start makes the dashboard look broken | Skeletons at final size + the existing "waking up" toast |
| Owner prefers the current look | A1 is a CSS-only token/surface pass on a branch, reviewed before anything else (✋1) |

---

## 9. Phases & checklist

Legend: `[ ]` todo · `[~]` in progress · `[x]` done & verified · ✋ = owner review

- [x] **A0** Approved 2026-10-25 ("proceed with the plan"); owner added: **the real version must follow the actual site theme**. §10 defaults used (content first, sidebar groups, no dark mode)
- [x] **A1** Tokens + surfaces: v2 palette/radii/shadows copied into `admin.css`; brand-pink dotted page, paper cards, green sticker titles with the sprite clovers (`/assets/svg/v2-sprite.svg#cl-leaf`), stitch only on the welcome card + drop zone, pill/segmented controls styled like the public JP/EN pill. Colour meaning: green = site content, pink = visitors, dashed = draft
- [x] **A2** Shell: sidebar groups (Content / Records / Account), floating paper sidebar, sticker-style active link; mobile scrim + Esc + tap-outside + focus in/out; user badge with clover avatar; inline styles → classes; `<main>` focus ring hidden
- [x] **A3** Dashboard: welcome card (date in JST), content tiles (icon, published count, draft pill, split bar, link), visitor KPI strip, visits chart drawn at the real width (readable ticks on phones, replaces the 24 px hack) with hover / tap / arrow-key value label + totals, range block with the two KPIs it drives, cards grouped Audience / Traffic / Engagement with ranks, busiest-hour highlight, skeletons + error state
- [x] **A4** Other screens: row icons instead of filler `<span>`s (content without thumbnails, Archive, Activity, Accounts), draft rows dashed, gallery cards, dialog (header/body/sticky actions), toasts with icons, `.state` empty/error boxes, password rule badges (CSS, not Lucide)
- [x] **A5** Login page: paper card, sticker title, clover decorations
- Verified on a **mock preview** (scratchpad `admin-preview.mjs`: real published content proxied read-only from the production public API, fake drafts/analytics/accounts, nothing written anywhere): every route, add/edit dialog + save toast, range switch, chart hover, mobile menu, EN + JA, 1366 / 1024 / 375 px, no horizontal overflow, no CSP errors. **Not yet run against the real API/DB** (this checkout has no `.env.local`)
- [ ] **A6** QA: EN + JA; 1920 / 1366×768 / 1024 / 768 / 390 / 360 widths; keyboard-only walkthrough; reduced motion; contrast (AA); 0 CSP violations (headless Edge, as in Phase 16); regression of every flow — sign in, forced change, add/edit/publish/unpublish/archive for all four content types, gallery upload + edit credit + delete, archive restore, activity log, Owner accounts create/reset/remove, sign out others. Follow `PROGRESS.md` rule 5 for test data (throwaway `devtest` admin, cleaned up)
- [ ] **A7** New JA strings in `JA_REVIEW_LIST.md`; `PROGRESS.md` + this file updated; commit on `admin-ui-refresh` → ✋3 owner OK → merge to `main` (deploys production) → verify production `/admin`

Local run for checks: `node --env-file=.env.local scripts/dev-server.js` (see `PROGRESS.md` §5, 5.3).

---

## 10. Questions for the owner (defaults used if not answered)

1. **Look:** calmer admin with the public site's colours (recommended) — or keep the current dashed/pink look and only fix layout? *Default: calmer, aligned colours.*
2. **Sidebar group labels** (Content / Records / Account): OK? *Default: yes.*
3. **Dashboard order:** content first, visitors second (as drawn in §4) — or visitors first? *Default: content first.*
4. **Dark mode:** out of scope for this update (it would double the styling work). *Default: not included.*
