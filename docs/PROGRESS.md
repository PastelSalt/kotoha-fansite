# PROGRESS.md: Self-Guide, Checklist & Resume Protocol

> **Purpose:** If a coding session gets cut off (token limit, crash, new session), this file tells the next session **exactly where things stand and what to do next**, without re-deriving anything.
> **The specification lives in [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) (v0.5, approved).** This file tracks execution.

| | |
|---|---|
| **Implementation authorized** | ✅ 2026-09-26 by owner |
| **Last checkpoint** | 2026-10-09: **performance pass** (`docs/PERFORMANCE_PLAN.md`): snapping + Lenis removed, rendering cost cut, no content removed. Before that, 2026-10-02: **design v2 ("Clover Scrapbook") merged into `main`** (`c7b6975`) at the owner's request; `MIGRATION.md` handoff added (`ab773d3`). Production deploy not yet verified (see §6) |
| **Current phase** | v1 phases 1–16 done (Phase 17 launch tasks open) · **Design v2: D1–D4 + D6 live; D5 phones, D7 motion, D8 extras, D9 QA remaining** |
| **Next action** | See §6 "Current focus / next action". **Handoff for a fresh session: read [`../MIGRATION.md`](../MIGRATION.md) first.** |

---

## 0. RESUME PROTOCOL (do this first, every new session)

1. **Read this whole file.** Then skim `IMPLEMENTATION_PLAN.md` §6.1 (confirmed requirements), §7.0 (defaults), §16 (decision log). Don't re-ask decided questions.
2. **Check real state; don't trust checkmarks blindly:**
   - `git status` and `git log --oneline -10`
   - Confirm the files listed as done in §5 actually exist and aren't half-written (look for `TODO(resume)` markers).
   - If DB work was in progress: check applied migrations (`node scripts/migrate.js --status` once it exists) or query `schema_migrations` via the Neon connector.
3. **Find §6 "Current focus / next action"** and continue from there.
4. **Update this file after every completed checklist item** (tick the box, add a short note, update "Last checkpoint" + §6). Commit small and often.
5. **Before stopping (or when context is getting long):** write a session-log entry (§11) with what was done, what's half-done, and the exact next step. Mark any half-written file with a `TODO(resume): …` comment at the top.
6. New ambiguity? **Don't guess on owner-facing decisions.** Add it to §7 "Open questions for owner" and ask. Technical choices → decide, record in §9.

---

## 1. HARD RULES (non-negotiable)

1. **Never write the bootstrap username/password into any tracked file**: not code, SQL, docs, commits or logs. Only `.env.local` (git-ignored) and Vercel env vars. Scripts read them from `process.env`.
2. **Never commit secrets.** `.env*` (except `.env.example`) and `.vercel/` are git-ignored. Check `git diff --cached` before every commit.
3. **No permanent deletion of DB content.** Deletes = move to `archived_content` (copy + delete in one transaction). Exceptions: (a) gallery **image files** are permanently destroyed in Cloudinary (record still archived); (b) the **one-time pre-launch reset** (owner-approved); (c) operational data retention (login attempts 30 d, raw analytics 90 d, expired sessions).
4. **Don't touch unrelated resources:** Vercel project `moesoft-web`; Cloudinary `samples/` folders. Our Cloudinary folder: `kotoha-fansite/gallery`.
5. **Dev and prod share ONE Neon database and ONE Cloudinary folder** (owner decision). Before launch: test freely. After launch: test with **drafts only**. Create a Neon restore point (snapshot/backup branch) **before every schema change**.
6. **Admin-entered DB text is single-field, shown as typed in both languages.** Only static UI/About/footer/headings are bilingual (locale files).
7. **Sections show ALL records** (paged loading inside lists); the Home hero shows the newest 1 video + 2 newest news. Newest first everywhere.
8. **Role names: `owner` and `admin`** (never "Super Admin"). Admin usernames are auto-numbered `<owner-username>2`, `3`, … (derived from the DB, never hardcoded), and numbers are never reused.
9. **No sound / no Howler.js.** Use pinned CDN versions from the plan (GSAP 3.12.5, Anime.js 3.2.2, Animate.css 4.1.1, canvas-confetti 1.9.4, Lucide pinned). Design v2 moved the public page to GSAP 3.15.0 + SplitText; **Lenis is no longer used** (removed 2026-10-09 with the snapping, see `PERFORMANCE_PLAN.md`).
10. **Never reuse fabricated content** from the previous attempt (plan §5.6). Seed only researched/official data (plan §5.7).
11. **Ask the owner first before:** downloading files (state name/source/size; e.g. the TwitCasting logo), installing software that requires accepting agreements, deleting/overwriting anything not created by me, any outward-facing action not already covered by the approved plan.
12. **Git:** branch `main` for production. Author = owner's name + **GitHub noreply email** (repo-local config). Never force-push, never skip hooks. Every commit message ends with:
    `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
13. **Security:** parameterized SQL only; `textContent` for DB text (never `innerHTML` with data); server-side auth checks on every admin API; the Owner-only check on account APIs.
14. **Accessibility & motion:** respect `prefers-reduced-motion`; keyboard reachable; visible focus; don't disable zoom.

---

## 2. OBJECTIVES (definition of done)

Deliverables (from the brief + decisions). Tick when **verified working**, not just written.

- [ ] Public site: Loader → Home → About → News → Discography → Gallery (infinite) → Footer
- [ ] Responsive layouts (mobile / tablet / desktop / large), matching references
- [ ] Loader: ≥ 3 s, tiered preloading, cap 10 s, random art + credit
- [x] ~~Strict snap (free scroll → glide), gallery free-scroll zone~~ → **replaced 2026-10-09 by native free scrolling on every device (owner: no snapping)**; reduced-motion fallback
- [ ] Bilingual JA/EN (Japan IP → JA; saved choice; switcher everywhere; admin too)
- [ ] Hero header (Home) + scrolled nav (other sections, no socials)
- [ ] `/login` + authenticated `/admin` with forced password change
- [ ] Owner/Admin roles, auto-numbered admins, temp passwords, account control
- [ ] Neon integration, migrations, `seed.sql`
- [ ] Cloudinary signed upload, auto-downscale, permanent file delete + archive record
- [ ] Admin CRUD: videos, news, achievements, discography, gallery; drafts; archive + restore; activity log
- [ ] Analytics tracking + dashboard (JST; all agreed metrics)
- [ ] Footer (Moesoft logo, disclaimer, obfuscated email, links, credits, privacy note)
- [ ] Loading / empty / error states everywhere
- [ ] `.env.example`, README (setup, local dev, DB setup, deployment), admin guide (JA/EN)
- [ ] `docs/JA_REVIEW_LIST.md` (Japanese I wrote myself)
- [ ] Deployed to `kotoha-fansite.vercel.app`; pre-launch reset done; Owner first login + password change done; bootstrap env vars removed

---

## 3. ENVIRONMENT FACTS

| Item | Value |
|---|---|
| Project root | `C:\Users\Moeko\Documents\kotoha_fansite` |
| OS / shells | Windows 11; PowerShell 5.1 + Git Bash |
| Node / npm / git | v24.21.0 / 11.19.0 / 2.55 |
| winget | v1.29 (GitHub CLI install is done by the owner) |
| Vercel account | personal; existing project `moesoft-web` (**don't touch**) |
| Vercel project (ours) | `kotoha-fansite` → `https://kotoha-fansite.vercel.app`, ID `prj_jenOIZqyraT1YJ9WhdrKLp1VxnBn` (connector calls: omit teamId) |
| Vercel function region | `sin1` |
| Neon project | `kotoha-fansite`, ID **`odd-base-44136456`**, region `aws-ap-southeast-1`, PG 17, branch `main` = `br-tiny-credit-b3dga6s5`, database `kotoha`, role `kotoha_owner`, endpoint `ep-bold-mouse-b3uvenls` (pooled host has `-pooler`). Free tier: **512 MB storage limit**, 6 h history retention |
| Cloudinary | Free plan; cloud name **`dijqsw0k8`**; limits **10 MB & 25 MP per image**; folder `kotoha-fansite/gallery`; signed preset `kotoha_gallery_signed` (to create); API key/secret: **owner pastes into `.env.local`** |
| GitHub repo | private https://github.com/PastelSalt/kotoha-fansite (account `PastelSalt`, id 214653345) |
| Kotoha YouTube channel ID | `UC3ql_EU4JnaE3Rh3cqbHu6g` (RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=…`) |
| Connectors available | Neon, Vercel, Cloudinary (Claude app); GitHub connector **not** working |
| Secrets location | `.env.local` (git-ignored) + Vercel env vars. **Never in tracked files** |

---

## 4. KEY DECISIONS: QUICK REFERENCE

(Full list: plan §16.)

- Stack: static vanilla frontend in `public/` + Vercel Functions (Node, ESM) in `api/` + shared `lib/`. No front-end build step.
- Sections: Home, About, News, Discography, Gallery; **native free scrolling, no snapping** (since 2026-10-09); the gallery grows with the page → footer.
- Language: `?lang` → saved choice → middleware cookie (JP IP → `ja`, else `en`) → `en`. Fonts: Fredoka + M PLUS Rounded 1c.
- About = hardcoded (locale files). Videos/News/Achievements/Discography/Gallery = DB, newest first, drafts supported.
- News: posted date (default today), headline, summary, ≤ 3 links with dropdown labels (`watch|listen|details|tickets|official|shop`).
- Discography covers = YouTube thumbnail (placeholder if none).
- Gallery: author name + source link; masonry; lightbox; no download; auto alt text.
- Archive: single `archived_content` table; Archive page with Restore (gallery restore disabled because the file is gone).
- Auth: DB sessions (`__Host-kf_session`), 7 d / 2 h idle; Argon2id; password ≥ 12 + blocklist + HIBP; lockout 5/15 min.
- Temp passwords: 8 chars, unambiguous alphabet, shown once, 7-day expiry; Owner can reset Admins.
- Analytics: first-party, cookieless daily hash, JST boundaries, weeks start Monday, production-only in the dashboard.
- Loader: min 3 s; Tier 1 + (Tier 2 or 6 s); cap 10 s; clover iris exit.
- No sound. Confetti: logo click, June 10 / July 8 JST, About pose tap, admin publish.

---

## 5. PHASE CHECKLIST

Legend: `[ ]` todo · `[~]` in progress · `[x]` done & verified · `[!]` blocked (see note)

### Phase 1: Accounts & setup
- [x] 1.1 Owner installed GitHub CLI 2.101.0 + logged in as **PastelSalt** (gh at `C:\Program Files\GitHub CLI\gh.exe`; not on Git Bash PATH → call by full path, and use `MSYS_NO_PATHCONV=1` for `gh api`)
- [x] 1.2 Repo-local git email = `214653345+PastelSalt@users.noreply.github.com` (name: "Moesoft: Moeko Software and Technologies")
- [x] 1.3 Private repo https://github.com/PastelSalt/kotoha-fansite, `main` pushed (initial commit `9aa41e5`, secret scan clean)
- [x] 1.4 Vercel project `kotoha-fansite` created and **Git link verified** (push to `main` → production deployment). Details: (`prj_jenOIZqyraT1YJ9WhdrKLp1VxnBn`, account `team_iTXgjBMqb9YpVCwrSPc0UKWO`, Node 24.x, no framework, output `public`). Deployment protection set to **preview only**. Git link to be confirmed by the first push-triggered deployment. Note: connector `create_git_project` fails with 403 (scope `pastelsalts-projects`); plain `create_project` / `update_project` / env calls work **without** a teamId
- [x] 1.5 Create Neon project `kotoha-fansite` (Singapore); record ID; put connection strings in `.env.local` (see §3)
- [x] 1.6 Signed preset **`kotoha_gallery_signed`** created via Admin API: folder `kotoha-fansite/gallery`, formats jpg/jpeg/png/webp/avif/gif/heic/heif, unique filenames, no overwrite, `disallow_public_id`, tag `kotoha-gallery`. No incoming transformation (owner chose the default config); the site only shows transformed copies (metadata stripped by Cloudinary), and artworks are social-media reposts. Round trip verified with `lib/cloudinary.js` (sign → upload → verify response signature → forged one rejected → Admin API read → destroy)
- [~] 1.7 Key/secret in `.env.local` ✅ (verified: Free plan, 0.68% credits). **Vercel env: owner must add `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` as Sensitive (Production + Preview)** — Claude may not type secrets into other services
- [~] 1.8 Vercel env vars set (all targets): `DATABASE_URL` + `ANALYTICS_SALT` (encrypted), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_FOLDER`, `CLOUDINARY_UPLOAD_PRESET`. **Still to add:** `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (after the owner pastes them). Bootstrap vars intentionally **not** in Vercel (the bootstrap runs locally against the shared DB)

### Phase 2: Foundation
- [x] 2.1 `git init -b main`; `.gitignore`; `.vercelignore`; `.gitattributes` (no commit yet: waiting for the noreply email, 1.2)
- [x] 2.2 `package.json` (ESM, scripts) + deps: `@neondatabase/serverless` ^1.1.0, `@node-rs/argon2` ^2.2.1; dev `sharp` ^0.35.4
- [~] 2.3 `vercel.json` written (cleanUrls, `outputDirectory: public`, `sin1`, rewrites `/api/{public,auth,admin}/:route*` → `/api/<group>?__route=…`, security + cache headers). **CSP not added yet** (add in Phase 16 once inline scripts are known). Rewrites still need verification with `vercel dev` (2.7)
- [x] 2.4 Folder skeleton created
- [x] 2.5 `.env.example` (placeholders only); `.env.local` created with Neon URLs, analytics salt and bootstrap creds (git-ignored, verified with `git check-ignore`)
- [x] 2.6 README skeleton
- [x] 2.7 Verified on Vercel: **Argon2 native module works** (unknown-user login probe → clean 401, not 500). Routing Middleware no longer needed (dropped, §9)
- [x] 2.8 First commit + push (`9aa41e5`, `67c120a`). Production answers at https://kotoha-fansite.vercel.app; `/api/public/*` rewrites verified on Vercel (geo returned PH → en)

### Phase 3: Scroll prototype
- [x] 3.1 Built directly into the real UI (`public/js/public/scroll.js`): Lenis + **custom direction-aware snap** + ScrollTrigger sync. lenis-snap dropped (see §9). Wheel test (DevTools protocol): each notch advances one section, gallery scrolls freely, scrolling up snaps back, nav click exact, inner lists don't move the page
- [~] 3.2 Touch: Lenis `syncTouch:false` (native touch scroll + momentum) + the same settle/snap logic. One emulated swipe snapped correctly to the next section, but headless touch emulation is unreliable (even a plain page ignores first swipes) → **needs a real-phone check by the owner** — owner will do it later (2026-09-26)
- [x] 3.3 `--app-height` locking (width/orientation only on touch), inner lists `data-lenis-prevent`, reduced motion → no Lenis + native CSS snap

### Phase 4: Database
- [x] 4.1 `db/migrations/0001_init.sql` (13 tables incl. `schema_migrations`; single-owner partial index; `admin_number_seq` starting at 2; JST date defaults; `visit_id` added to analytics for visit duration/reach)
- [x] 4.2 `scripts/migrate.js` + `scripts/_db.js` (Pool over the unpooled URL, transaction per file) + `scripts/run-sql.js`
- [x] 4.3 Applied 0001 on 2026-09-26 (no snapshot needed: the DB was empty). Verified 13 tables via the Neon connector
- [x] 4.4 `db/seed.sql` seeded & verified idempotent (3 videos, 10 news, 32 achievements incl. 1 draft for the 2026-10-07 release, 11 discography). All 3 videos checked public via oEmbed. Discography `youtube_id` is null except 透明夜 → admins can add MV links later
- [x] 4.5 `scripts/admin-bootstrap.js` + `lib/password.js` (Argon2id m=19456,t=2,p=1; policy; HIBP; temp generator). **Owner created in DB** (must change password). Re-run refuses. Argon2 works locally on Windows; Vercel check pending (2.7)
- [x] 4.6 `scripts/seed-gallery.js` (`npm run gallery:seed`, idempotent): 5 credited artworks (credits read from `public/js/public/data.js`) + AiceClass front model + turnaround sheet + mascot sheet ("Artist unknown (作者不明)"). Fixed public_ids `kotoha-fansite/gallery/seed-*`. **Seeded 2026-09-26 (8 images).** Re-run after the pre-launch reset
- [x] 4.7 `docs/JA_REVIEW_LIST.md` started (seed summaries, 2026 achievements, discography notes, bracket fixes)

### Phase 5: Backend core
- [x] 5.1 `lib/db.js` (neon HTTP `sql()`, `query()`, `transaction()`), `lib/http.js` (send/sendError, `routeOf`, `readJson` 32 KB, `assertSameOrigin`, `handle`, `methodGuard`, cache presets), `lib/paging.js` (keyset cursors). `lib/validate.js` still to write (Phase 6/12)
- [x] 5.2 `api/public.js`: `home`, `geo` (no-store, `x-vercel-ip-country`), `videos`, `news`, `achievements`, `discography`, `gallery` (cursor paging, `s-maxage=60`). Verified on the local dev server: drafts hidden, cursor page 2 works, bad cursor → 400, POST → 405, unknown → 404
- [x] 5.3 `scripts/dev-server.js`: local stand-in for `vercel dev` (static + cleanUrls + API rewrites). Run: `node --env-file=.env.local scripts/dev-server.js`

### Phase 6: Auth & roles
- [x] 6.1 `lib/auth.js` + `api/auth.js`: login (per user+IP 5/15 min, per IP 20/15 min, account lock after 5), logout, me, change-password (policy + HIBP, revokes all sessions then issues a new one), preferences. Cookie `__Host-kf_session` on HTTPS / `kf_session_dev` on local http. Verified locally with a throwaway `devtest` admin (cleaned up)
- [x] 6.2 `requireAdmin({allowPasswordChange, ownerOnly})` / `requireOwner`; forced-change gate returns `403 PASSWORD_CHANGE_REQUIRED`. `lib/validate.js` done (text/date/url/oneOf/youtubeId/links/id + `parseYouTubeId`)
- [x] 6.3 Accounts API in `api/admin.js` (Owner only): create `<owner>N` via `admin_number_seq` + temp password (returned once, 7-day expiry), reset-password (revokes sessions), remove (deactivate + revoke + archive snapshot without hash). Owner can't be changed. Verified locally (test data cleaned, sequence restored)
- [x] 6.4 ~~`middleware.js`~~ **Dropped** (see §9): language comes from `/api/public/geo`; `/admin` guard = client check + server-side API enforcement

### Phase 7: Image pipeline
- [x] 7.1 `scripts/optimize-images.js` → WebP only (AVIF skipped: slow to encode, WebP is universal). Backgrounds: `public/assets/bg/<name>-{1280,1920,2560}.webp` + portrait `-p{720,1080}.webp` (focal-point crops, visually verified against mobile refs). UI: `public/assets/img/<name>-<w>.webp`. Names: home, about, news, discography, gallery, loader1 (pajama), loader2 (birthday), loader3 (cardigan)
- [x] 7.2 `public/assets/svg/{clover-fill,clover-outline,divider}.svg` (clover path verified against the PNG), `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `public/assets/og-image.jpg`
- [x] 7.3 TwitCasting official logo — owner approved; downloaded `icons_png.zip`, used `icon_android_2048.png` → `assets/icons/twitcasting.png` → `icon-twitcasting-96.webp` (resized only). Original note: source found = TwitCasting operator's brand page https://about.moi.st/en/guideline/ → `icons_png.zip` (1,553,971 bytes, https://about.moi.st/en/wp-content/themes/moi2/assets/guideline/images/icons_png.zip). Rules: no color changes/alterations, generous margin, no implied sponsorship. **Waiting for owner's OK to download.** Temporary placeholder icon in the UI until then

### Phase 8: i18n foundation
- [x] 8.1 `public/locales/{en,ja}.json` for the public site (admin strings will be separate files in Phase 12)
- [x] 8.2 `public/js/shared/i18n-core.js`: `?lang` → saved choice (pre-paint inline script) → `/api/public/geo` during the loader → `en`; `[data-i18n]`/`[data-i18n-attr]`; JP/EN switch everywhere; the choice is saved and `?lang` updated
- [x] 8.3 Fredoka + M PLUS Rounded 1c (Google Fonts); JA-specific sizes for nav/pill verified by screenshot

### Phase 9: Public UI
> v1 public page. **Replaced by design v2 on 2026-10-02** (new markup, CSS, scroll, loader, gallery) — see "Design v2" below; the data/i18n/tracking hooks from this phase were kept.
- [x] 9.1 `public/css/site.css` (tokens, mobile-first, desktop at ≥900w & ≥600h using vw/vh from the 1366×768 refs)
- [x] 9.2 Hero header (inside Home), scrolled nav (fixed bar, no socials, JP/EN under the bar), mobile menu (focus trap, Esc)
- [x] 9.3 Home: countdown (UTC math, live window), video facade, 2 news, divider, credit
- [x] 9.4 About: avatar, bio, pills from the locale file, clover stage + tappable pose
- [x] 9.5 News: paged list + dashed scrollbar; player + all-videos chips
- [x] 9.6 Discography (YouTube-thumbnail or clover placeholder covers) + Achievements (paged)
- [x] 9.7 Gallery verified with the 8 seeded images: masonry (desktop + phone), lightbox (credit, counter, next/prev, "View original post"), no CSP errors. JA credit label changed to 「イラスト：{name}」 (was 「{name}さん」, odd for companies/unknown)
- [x] 9.8 Footer verified at 1920×1080 (links, disclaimer, working runtime-assembled mail link, credits button, JP/EN)
- [x] 9.9 States (skeleton/empty/error with mascot-front). Verified screenshots: desktop 1366×768 EN+JA, 1024×768, 1920×1080 (incl. desktop loader), mobile 360×800, tablet portrait 768×1024 (width capped), landscape phone 800×360

### Phase 10: Loader
> v1 loader. Replaced by loader v2 (D6) on 2026-10-02; the rotating clover pair requirement (10.4) is preserved and verified.
- [x] 10.1 Inline loader markup/critical CSS + **CSS failsafe (auto-hides at 12 s even if JS breaks)** + noscript; random art + credit
- [x] 10.2 `loader.js`: tiers, min 3 s / soft 6 s / cap 10 s (measured 3.0 s locally); section images switched lazy→eager and decoded. `loader_timing` event pending Phase 15
- [x] 10.3 Clover-bloom exit (GSAP), plain fade under reduced motion; boot errors still hide the loader
- [x] 10.4 **Loader clovers rotate** for as long as the loader is visible (owner requirement 2026-09-26, missed in v1): outer clockwise 4 s/turn, inner counter-clockwise 2.5 s/turn (CSS, compositor thread); reduced motion keeps them turning slower (12 s / 8 s) since it's the loading indicator. Verified in headless Edge

### Phase 11: Animations
> v1 effects (Anime.js / ScrollTrigger entrances). Replaced by the v2 motion system on 2026-10-02 (native CSS scroll-driven animations + GSAP 3.15 choreography).
- [x] 11.1 GSAP section entrances (with an IntersectionObserver safety net), CSS header transition (`body.is-scrolled`)
- [x] 11.2 Anime.js (menu stagger, clover bloom, boing), confetti (logo, pose, June 10 / July 8 JST), Animate.css (states, gallery tiles). Not all visually verified yet

### Phase 12: Admin: content
- [x] 12.1 `/login` page; `/admin` shell (JP/EN), forced-change screen. Files: `public/{login,admin}.html`, `public/css/admin.css`, `public/js/admin/{api,ui,password,content,gallery,pages,main,login,styles}.js`, `public/locales/admin/{en,ja}.json`, shared `public/js/shared/dom.js`. **Verified in headless Edge:** login, wrong-password message, forced change (live rules checklist, guessable rule), dashboard, news list, add dialog with links editor, 13 icons rendered
- [x] 12.2 API + UI verified end-to-end (headless Edge, throwaway `devtest` admin, cleaned up): create news with a link → list → public API shows it with the link label; YouTube "Get title" fills the original title; duplicate video → friendly error; JA + mobile screenshots. Fixed: "Add video" dialog crashed (`replaceWith` on a node `el()` had already moved)
- [x] 12.3 Archive → restore round trip verified in the UI; Activity Log shows readable EN/JA labels (`activity.actions.*`)

### Phase 13: Admin: gallery
- [x] 13.1 Verified (see 13.2). Code written (`lib/cloudinary.js`: sign, verify response signature, Admin API `getResource`, `destroyImage` with invalidate, `deliveryUrl`; gallery routes in `api/admin.js`). Returns `503 CLOUDINARY_NOT_CONFIGURED` until keys exist. **Untested against Cloudinary: needs the owner's API key/secret (still empty in `.env.local`)**
- [x] 13.2 Verified locally (scratchpad `admin-gallery-test.mjs`): 2 files queued → "Upload all" → small PNG uploaded as-is; 6000×4500 (27 MP) JPEG auto-shrunk to 5658×4244 WebP (24.0 MP). **Production uploads need the Cloudinary key/secret in Vercel (owner, 1.7)**
- [x] 13.3 Edit credit + delete verified: Cloudinary files destroyed (Admin API 404 afterwards), archive records written, seeded images untouched

### Phase 14: Admin: accounts
- [x] 14.1 Accounts screen verified as Owner (scratchpad `owner-ui-test.mjs`): create shows `<owner>2` + 8-char temp password once, "must change" pill, reset, remove → archived (not restorable). The test snapshots/restores the Owner row (`must_change_password` back to **true**) and `admin_number_seq` (back to 2), and deletes everything it created
- [x] 14.2 My Account: change password (verified in the forced-change flow), sign out other devices (`POST /api/auth/logout-others`) verified

### Phase 15: Analytics
- [x] 15.1 `api/track.js` + `public/js/public/track.js` (sendBeacon batches; `data-track` attributes + capture-phase click listener; dwell per section while visible). Server drops bots, requests carrying an admin session cookie, cross-origin posts and bad JSON (always 204); per-visitor in-memory flood limit. Verified with curl + headless Edge
- [x] 15.2 `lib/analytics.js`: one aggregation query per JST day → `analytics_daily` (+ `_rolled` marker per day). **Lazy rollups** (from the tracker and the dashboard, once per instance per day) instead of a cron. Retention in the same step: raw events > 90 days (only already-rolled days), expired sessions / login attempts > 30 days. Verified with synthetic data (JST days, Monday weeks, 7/30-day ranges) — test rows deleted
- [x] 15.3 Dashboard (`public/js/admin/analytics.js`): KPIs (today/week/month, avg visit, avg loading), daily/weekly/monthly charts, sections (reach % + avg time), devices, language + switches, countries (Japan share), sources, busiest hours JST, video plays, official link clicks, news link clicks, top artworks, browsers. Screenshots verified desktop / JA / mobile

### Phase 16: Quality pass
- [~] 16.1 A11y: done — AA contrast for white-on-green (buttons, toggles, public JP/EN switch, chip hover), darker "Latest" badge, clearer input focus ring, translated admin skip link / menu / nav labels, admin `main` no longer a live region. Still to do: full keyboard + screen-reader walkthrough (both languages)
- [ ] 16.2 Performance (Lighthouse, real devices), cross-browser
- [~] 16.3 Security: **CSP live** (`vercel.json`; pre-paint scripts moved to `/js/prepaint.js` + `/js/admin/prepaint.js` so no inline scripts/hashes; dev server applies the same headers). **SRI on every CDN script/stylesheet** except Google Fonts CSS (varies per browser); confetti switched to the package's own `confetti.browser.js` (the `.min.js` is minified on the fly by jsdelivr → unstable hash). Hashes verified: jsdelivr data API + fetched bytes; cdnjs bytes cross-checked against cdnjs' published sha512 for animate.css. Headless check: 0 CSP violations on public page + every admin screen. URL fields are http(s)-only (checked). Still to do: `DATABASE_URL` → Vercel "sensitive" type; final review pass

### Phase 17: Launch
- [~] 17.1 `scripts/prelaunch-reset.js` written + dry-run tested (not run for real — run only right before launch, with the owner's go-ahead)
- [ ] 17.2 Production deploy; verify
- [ ] 17.3 Owner first login + password change (**owner action**); delete bootstrap env vars
- [ ] 17.4 Final docs: README, DB setup, deploy, admin guide (JA/EN), JA review list


### Design v2: visual + motion redesign (post-v1; plan: `docs/DESIGN_V2_PLAN.md`, reference: `docs/DESIGN_SYSTEM.md`)
- [x] D0 Plan v0.3 approved ("execute the plan", 2026-09-27); owner answers recorded in the plan
- [x] D1 / D1.1 Style tile + density pass after owner feedback ("too minimal, avoid empty space, clovers never hollow") — design system `public/css/v2/*`, SVG sprite, motion modules
- [x] D2 Foundations: layered CSS + tokens, "art by" labels / loader credit / credits dialog removed, GSAP 3.15 swap (Anime.js, Animate.css, ScrollTrigger gone from the public page)
- [x] D3 Components with live data + EN/JA (ticket, polaroid, notes, film strip, profile card, sleeves, timeline, tiles, nav pill, footer, lightbox)
- [x] D4 Desktop sections (Home / About / News / Discography / Gallery) — dense compositions, fixed crossfading artwork backdrop, short-laptop Home rules
- [x] D6 Loader v2: static inline clovers turn from first paint, petals fill from real progress, facts, iris exit
- [x] D10 (early) **Merged to `main` 2026-10-02 at the owner's explicit request** (`c7b6975`; `/design-v2/` style tile deleted first)
- [ ] Verify the production deploy (hard-refresh kotoha-fansite.vercel.app; loader, sections, EN/JA, gallery, console)
- [ ] ✋2 Owner review of the live desktop design → adjustments
- [ ] D5 Phones + tablet design (works today, not designed) → ✋3 real-phone check by the owner
- [ ] D7 Motion: tuning → ✋4. (The snap and its `onSectionSnap` hook are gone; `wipe.js` is kept unwired and could play on nav-link jumps if the owner wants it.)
- [x] **Performance pass (2026-10-09, `docs/PERFORMANCE_PLAN.md`)**: snap + Lenis removed, paper blur replaced, lean scoped to on-screen cards, one scroll ticker, compositor marquee, single backdrop pan layer, far sections drop their animations, confetti loaded after the loader. Measured with headless Chrome on the real GPU (Radeon Vega 3): 1366×768 at 4× CPU slowdown 22 → 35 fps, janky frames (> 33 ms) −58 %; no content removed
- [ ] D8 Extras: mascot cameo, special-day decorations, LIVE badge on the nav; **gallery seed +5 credited artworks** (About background, 2 loader arts, avatar, pose)
- [ ] D9 QA: keyboard/screen-reader, contrast, ≥13 px text, JP line breaks, performance, tracker + admin regression; remove unused generated SVGs / `legacy` layer name; commit the headless-Edge test scripts into the repo

---

## 6. CURRENT FOCUS / NEXT ACTION

- **State (2026-10-02):** public site v1 was live since 2026-09-26 (not announced). **Design v2 is now merged into `main`** (commit `c7b6975`), so every push deploys it. Phases 1–16 are done; Phase 17 (launch) still has owner-only items. Full handoff context: `../MIGRATION.md`.
- **Next action 1 (Claude):** verify the production deploy at https://kotoha-fansite.vercel.app (the Vercel "list deployments" call was blocked by the permission classifier during the merge, so it is **unconfirmed**). If broken: promote the previous Vercel deployment and/or `git revert -m 1 c7b6975`.
- **Next action 2:** owner reviews the live desktop design (✋2) → adjustments → D5 phones/tablet (✋3: owner tries it on a real phone, replaces the old swipe test) → D7 motion (✋4) → D8 extras (+ 5 gallery artworks) → D9 QA. One branch per phase; merge to `main` only with the owner's OK.
- **Waiting on owner:** add `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` to Vercel (production gallery uploads) · first admin login + password change · native Japanese review of `docs/JA_REVIEW_LIST.md` (new v2 strings appended) · real-phone check (after D5) · go-ahead for the pre-launch reset when ready.
- **Workflow:** commit + push after each verified step (every push to `main` deploys production). Always run the secret scan before committing. Commit trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; never force-push; docs (this file, the plan §14/§16, `DESIGN_SYSTEM.md`) updated after each phase.

---

## 7. OPEN QUESTIONS FOR OWNER

_(none blocking.)_ The five D1.1 density questions (density level, four-leaf vs rounded clover, phone crossfade + free scroll, extra art available, keep vertical JP text and giant background words) were never answered one by one; the owner said "start applying", so the recommended defaults are live. Revisit at ✋2 if the owner wants changes.

---

## 8. OWNER ACTION ITEMS

- [x] Install GitHub CLI + log in (done 2026-09-26) · [x] Approve Vercel's access to the repo (done)
- [x] Paste Cloudinary API key + secret into `.env.local` (done 2026-09-26).
- [ ] **Add `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in Vercel** → Project `kotoha-fansite` → Settings → Environment Variables → type **Sensitive**, environments **Production + Preview**, same values as `.env.local`. Then redeploy (or tell Claude, who will push).
- [ ] **First login at `/login`** with the default credentials from your original brief (still in the git-ignored `.env.local`, `ADMIN_BOOTSTRAP_*`) → the site forces a new password right away (≥ 12 characters, no username inside, not only site words, not in known leaks).
- [ ] Look at the live site (hard refresh) and tell Claude what to adjust on desktop (✋2).
- [ ] Real-phone check — after Claude finishes D5 (phones); it replaces the old swipe test.
- [ ] Share `docs/JA_REVIEW_LIST.md` with a Japanese speaker (new v2 strings were added on 2026-10-02).
- [ ] When ready to launch publicly: tell Claude to run `npm run prelaunch:reset` for real (wipes test data, rebuilds the Owner from `ADMIN_BOOTSTRAP_*`), then delete those two bootstrap env vars.

---

## 9. TECHNICAL DECISIONS LOG (made during implementation)

| Date | Topic | Decision | Why |
|---|---|---|---|
| 2026-09-26 | API routing | Grouped functions `api/public.js`, `api/auth.js`, `api/admin.js`, `api/track.js`; `vercel.json` rewrites pass the sub-path as `?__route=` | Few function files; avoids unsure catch-all file routing outside Next.js. Verify in 2.7 |
| 2026-09-26 | Module format | ESM everywhere (`"type": "module"`) | Native in Node 22+/Vercel |
| 2026-09-26 | Script DB access | `Pool` (WebSocket) from `@neondatabase/serverless` over the unpooled URL | Multi-statement SQL files + transactions; the HTTP driver runs one statement per call |
| 2026-09-26 | Analytics schema | Added `visit_id` (random per page load, not persisted in the browser) | Needed for visit duration and section reach per visit without cookies |
| 2026-09-26 | Gallery `source_url` | Nullable in DB (form strongly encourages it) | Some official/unknown-artist items have no link |
| 2026-09-26 | No Routing Middleware | Language default via `GET /api/public/geo` (reads `x-vercel-ip-country`, no-store) during the loader; `/admin` guarded client-side, while every admin API enforces auth server-side | Removes a framework-less Vercel uncertainty and the `@vercel/functions` dependency; security unchanged (plan §12.3 already treated the page guard as UX only) |
| 2026-09-26 | Function signature | Plain Node `(req, res)`: no reliance on Vercel's `res.json`/`req.query` helpers | Runs identically on Vercel and on `scripts/dev-server.js` |
| 2026-09-26 | Local dev | `scripts/dev-server.js` in addition to `npx vercel dev` | Lets development and testing continue before the Vercel CLI login |
| 2026-09-26 | List ordering | `(date desc, id desc)` keyset for all lists; gallery `(created_at desc, id desc)` | Stable paging, newest first |
| 2026-09-26 | **lenis-snap dropped → custom direction-aware snap** | (1) `lenis-snap.min.js` UMD redefines a global helper of `lenis.min.js` → `new Lenis()` throws; (2) its logic snaps to the NEAREST point, so a wheel notch snapped back (tested). Custom logic in `scroll.js`: after 140 ms quiet, glide (0.8 s, input locked) to the next point in the scroll direction; <50 px settles back; points = section tops + ends of tall sections; free zones = inside tall sections and below the gallery top | Matches "scroll freely then glide" + strict snap; still Lenis (brief) |
| 2026-09-26 | Lucide on the public page | Inline SVG sprite of the 9 used Lucide icons (from lucide-static 1.48.0, ISC); full `lucide@1.48.0` UMD (444 KB) only for the admin | Performance; same icon set |
| 2026-09-26 | Screenshot/verification tooling | Headless Edge driven via the DevTools protocol from scratch scripts (not in the repo): `cdp-shot.mjs` (per-section screenshots), `scroll-test.mjs` (wheel snap test). Built-in browser pane scales emulated viewports too small to judge | Reliable visual checks |
| 2026-09-26 | Dev server caching | `scripts/dev-server.js` sends `Cache-Control: no-cache` | Stale modules caused a false bug |
| 2026-09-26 | Login form `method="post" action="/login"` | Without a method, a submit before the script loads would be a native GET that puts the password in the URL (found in testing) | Security |
| 2026-09-26 | Admin CDN assets never block | Google Fonts + Animate.css are injected by `public/js/admin/styles.js`; Lucide/confetti are `async`, and `refreshIcons()` redraws when Lucide arrives | On a slow network, render-blocking CDN CSS delayed the login script by many seconds (seen in testing) |
| 2026-09-26 | Analytics rollups without cron | `rollupIfStale()` runs from `/api/track` and the dashboard (memo per instance per day, retry at most every 10 min); upserts make concurrent runs safe | No `CRON_SECRET`/cron config needed; a quiet site simply rolls up on the next visit |
| 2026-09-26 | Public page CDN resilience | CDN scripts `async` + `librariesReady(6000)` in the loader's tier 1; Google Fonts / Lenis CSS / Animate.css injected by the pre-paint inline script (fonts also in `<noscript>`) | With cdnjs failing and Google Fonts taking 16 s (seen during testing), the site used to stay blank/frozen; now it runs without effects |
| 2026-09-26 | DB connect retry | `lib/db.js` retries (3×) only `UND_ERR_CONNECT_TIMEOUT` / `ECONNREFUSED` / `ENOTFOUND` / `EAI_AGAIN` — errors where the query never reached Neon | Safe (never runs a statement twice); rescues flaky local networks |
| 2026-09-26 | CSP without inline scripts | Pre-paint code in small blocking files instead of hashed inline scripts; `style-src 'unsafe-inline'` kept (inline style attributes from `el()`, the loader's critical `<style>`) | No hash drift when the HTML changes; style injection is low risk |
| 2026-09-26 | Pre-launch reset | `npm run prelaunch:reset` = dry run; `-- --yes-reset-everything` deletes gallery-folder Cloudinary files, truncates all data tables, re-seeds, re-creates the Owner. Refuses without Cloudinary keys unless `--skip-cloudinary` | Plan A13 |
| 2026-09-26 | `.vercelignore` anchored (`/assets` …) | The unanchored `assets` pattern also matched `public/assets` → **no images had ever been deployed** (every `/assets/*` 404 in production). Found while checking the TwitCasting icon; fixed and verified with production screenshots | Critical production fix |
| 2026-09-26 | Admin render race | Each navigation renders into its own `.view__page` container; a slow page finishing after the admin moved on writes into a detached node | Found in testing: a cold-start dashboard overwrote the Gallery page |
| 2026-09-26 | Password "guessable" rule | Reject when the password's letters consist **only** of site words (kotoha, hakoniwa, lily, clover, password, …), not when it merely contains one | Blocks "KotohaClover2026!" but allows real passphrases |
| 2026-09-27 | Design v2 libraries | GSAP **3.15.0** + SplitText (SRI, jsdelivr) for choreography; native CSS scroll-driven animations for reveals/parallax/art camera; velocity lean in a tiny rAF module; Anime.js, Animate.css, ScrollTrigger and GSAP 3.12.5 dropped from the public page (login/admin keep Animate.css via `prepaint.js` + `html[data-site]`) | Lighter, fewer moving parts, progressive enhancement |
| 2026-09-28 | Clovers | Illustrated filled SVG sprite (`/assets/svg/v2-sprite.svg`), never hollow outlines; XML comments in the sprite must not contain `--` | Owner feedback; a `--` in a comment silently broke the whole sprite |
| 2026-09-28 | Section artworks | One fixed `.backdrop` that crossfades between sections (`motion/backdrop.js`) | No hard edge between artworks, essential for free scrolling on phones |
| 2026-10-02 | Scrolling v2 | Lenis + strict snap only for a desktop mouse in full-motion mode; phones, tablets and calm mode scroll natively (free scroll) | Snap fights touch scrolling; the backdrop crossfade hides section changes |
| 2026-10-09 | **No snapping; Lenis removed** | Native free scrolling on every device; in-page jumps use `scrollIntoView` (smooth in full motion, instant in calm) | Owner: the snap was "a total mess"; native scrolling runs on the compositor thread, so it stays smooth while scripts are busy |
| 2026-10-09 | Performance pass | See `PERFORMANCE_PLAN.md` §7. Notable: `.paper` without `backdrop-filter`; `--lean` written per visible card, never on `<html>`; marquee = one Web Animation whose `playbackRate` follows scroll speed; far sections (> 1 screen away) get `.is-far` → `animation: none` | Same look; GPU/CPU time per frame cut |
| 2026-10-09 | **No `content-visibility` on sections** | Tried `content-visibility: auto` on `.scene` (biggest single CPU win), but in Chrome 154 any View Transition (the lightbox grow) **hangs the page** while a rendered-but-off-screen section has it — reproduced on the original build too. Replaced by the `.is-far` animation drop | A frozen page is far worse than lag; revisit when Chrome fixes it |
| 2026-10-02 | Loader v2 artwork | Pure-CSS background keyed by `html[data-loader-art]` (set pre-paint); clover pair is static inline SVG | Starts downloading with the stylesheet and turns before any script runs |
| 2026-10-02 | Credits | "art by" labels, loader credit and credits dialog removed; artists credited on gallery tiles, lightbox and a footer list (static `CREDITS` + gallery authors) | Owner request (keeps the illusion) |
| 2026-10-02 | `[hidden]` | `[hidden] { display: none !important }` in `base.css` | A `display:grid` author rule overrode the `hidden` attribute and showed empty cards |
| 2026-10-02 | JA leading | `line-height` for Japanese applied to body and text blocks only, not to every `:lang(ja)` element | It stretched display titles (section headings) in Japanese |
| 2026-10-02 | Short laptops | ≥ 1100 px wide and ≤ 960 px tall: Home hides the 2nd note, coming-soon and fan-art cards so the hero fits one screen | 1366×768 is common; the cards live in later sections anyway |
| 2026-10-02 | Merge timing | Design v2 merged to `main` early (D10) at the owner's explicit request; D5/D7/D8/D9 continue afterwards | Owner wanted the new look on the real domain now |

---

## 10. KNOWN ISSUES / TODO LATER

- Neon free tier caps storage at 512 MB → analytics keep 90-day raw retention + daily rollups (lazy rollup; expired sessions / login attempts are pruned in the same step).
- CSP + SRI are live (Phase 16). The design-v2 CDN scripts (GSAP 3.15.0, SplitText, confetti — the latter now injected by `fx.js` after the loader, still with SRI) are SRI-pinned; Google Fonts CSS is the one stylesheet without SRI (it varies per browser).
- `DATABASE_URL` is **Sensitive** (Production + Preview). Local dev uses `.env.local`.
- Each tracked visit wakes the Neon compute (free plan: limited compute hours). Fine for a fan site; watch Neon usage after launch.
- The built-in browser pane reports `visibilityState: hidden` → rAF/animations pause and the loader never finishes there. Test the public page in **headless Edge via the DevTools protocol**.
- **Neon free compute sleeps after ~5 min and needs ~10 s to wake.** Mitigated: public API `stale-while-revalidate=86400` at the edge; loader waits max 4 s for home data; client API timeout 15 s. The admin's first request after idle may take ~10 s.
- **Production deploy of design v2 is unverified** (2026-10-02, see §6).
- Design v2 leftovers: phones/tablet are functional but not designed (D5); `wipe.js` exists but is not wired (the snap it was meant for is gone); unused generated SVGs `clover-fill.svg` / `clover-outline.svg` / `divider.svg` still come from `scripts/optimize-images.js`; the `legacy` cascade-layer name in `tokens.css` is unused; text-size/contrast audits not run on v2 yet (D9).
- **Test scripts are not in the repo** (they lived in Claude's temporary scratchpad): `site-shot.mjs`, `site-behavior.mjs` (~50 checks), older admin/gallery/tracker/CSP suites. Re-create them or commit cleaned copies under `scripts/` (see `MIGRATION.md` §8 for the harness gotchas).
- A stray `.kilo/worktrees/` folder and `previous_failed_attempt_v1_only_for_around_30-40%_of_intended/` exist in the working directory (the latter is untracked reference material from an earlier attempt); neither is deployed.

---

## 11. SESSION LOG

### 2026-09-26: Session 1
- Phases 1 (inspection) and 2 (planning) complete; plan v0.5 approved; implementation authorized.
- Verified connectors: Neon (empty), Vercel (`moesoft-web` only), Cloudinary (Free, samples only). `kotoha-fansite.vercel.app` unclaimed.
- Created this file.
- Built: git repo (uncommitted), ignore files, `package.json` + deps, `vercel.json`, `.env.example`, `.env.local`, README skeleton.
- Neon project `odd-base-44136456` (Singapore) created; migration 0001 applied; `seed.sql` applied (idempotent); Owner bootstrapped.
- Libraries: `lib/password.js`, `lib/db.js`, `lib/http.js`, `lib/paging.js`; API: `api/public.js`; `scripts/dev-server.js`. Verified via curl.
- `docs/JA_REVIEW_LIST.md` started.
- **Next:** Phase 6 auth API → i18n → scroll prototype → public UI. Owner: GitHub CLI login + Cloudinary keys.

### 2026-09-26: Session 1 (continued, after owner's GitHub login)
- Owner logged in to GitHub as PastelSalt. Repo-local noreply email set; secret scan found the default password inside a policy example → replaced before the first commit.
- Private repo created + pushed; Vercel project created via connector (create_git_project 403 → used create_project), protection set to preview-only, 5 env vars added, Git auto-deploy verified.
- Phase 6 auth done (`lib/auth.js`, `api/auth.js`, `lib/validate.js`) and verified locally.
- **Next:** verify Argon2 on Vercel (login probe) → accounts API (6.3) → i18n (Phase 8) → scroll prototype (Phase 3) → public UI (Phase 9). Owner: Cloudinary API key/secret.

### 2026-09-26: Session 1 (continued, admin UI)
- Admin UI written (login, shell, forced change, dashboard, content CRUD screens, gallery, archive, activity, accounts, my account) + `admin/summary` and `auth/logout-others` endpoints.
- Headless-Edge test (`admin-ui-test.mjs` in the scratchpad, throwaway `devtest` admin, cleaned up after each run) passed login → forced change → dashboard → news list → add dialog. The save step failed while the owner's network to Neon was dropping (connect timeouts, even google.com timed out); needs a re-run.
- Fixes from testing: login form POST (no password in the URL), admin CDN assets made non-blocking.
- Analytics (Phase 15) built and verified; admin UI fully verified once the network recovered (only failure found and fixed: the "Add video" dialog crash). Owner Accounts flow verified with the Owner row restored.
- Resilience: admin + public pages no longer wait on third-party CDNs; DB connect-retry for flaky networks.
- Phase 16: CSP + SRI live on production; a11y contrast/label fixes; `scripts/prelaunch-reset.js` (dry run only).
- Test hygiene: a DB drop during `csp-check.mjs` left the `devtest` admin behind once — found and removed. Always re-check for `devtest` after a failed run.
- Owner answers: Cloudinary keys saved (verified), TwitCasting icon approved (added), phone test later, `DATABASE_URL` → Sensitive (done; production DB access verified on the new deployment).
- Cloudinary preset created + round-trip tested; gallery seeded (8); admin gallery upload/shrink/edit/delete verified end-to-end.
- **Production images were missing since the first deploy** (`.vercelignore`) — fixed; production screenshots verified.
- Fixed an admin navigation race (stale page overwrote the current one).

### 2026-09-27 → 2026-10-02: Design v2 (sessions 2–4)
- 2026-09-26/27: owner asked for a visual + motion redesign on branch `designupdatev2`; plan written (`docs/DESIGN_V2_PLAN.md`, v0.1 → v0.3 over three Q&A rounds), loader clover rotation fixed on `main` (`c58bfbc`), owner approved "execute the plan".
- 2026-09-27: D1 style tile + motion sample (`/design-v2/` on the protected preview) with the real design-system files (`public/css/v2/*`, `public/js/motion-boot.js`, `public/js/public/motion/*`).
- 2026-09-28: owner feedback (too minimal / empty / hollow clovers) → D1.1 density pass: illustrated SVG sprite, Japanese-fan-site vocabulary (numbered titles, background words, vertical text, badge, bubbles, stamps), Home filled on both sides, crossfading artwork backdrop.
- 2026-10-02: answered the owner's "default password" question (it is the one from the original brief, still in `.env.local`; the DB only holds the hash). Owner asked to start applying the update → rebuilt the real public page on v2 (index.html, `layout.css`, main/render/lists/gallery/home/countdown/loader/scroll/fx modules, EN/JA keys), verified in headless Edge (≈50 checks pass, 0 CSP violations, no overflow at 1366/1920/390), commit `7b3895f`; removed `/design-v2/` (`2c8f181`); owner asked to put it on the main domain → merged `designupdatev2` into `main` (`c7b6975`) and pushed. A first merge attempt failed on a bad flag and changed nothing. Production deploy status could not be checked (Vercel list-deployments call blocked by the permission classifier). Wrote `MIGRATION.md` (`ab773d3`) and refreshed all markdown docs (this update).
- **Next:** verify production → ✋2 → D5 phones → D7 → D8 → D9 (see §6).

### 2026-10-09: Performance pass (session 5)
- Owner: the site is "really laggy" from the amount of motion and visuals; plan a performance optimisation that removes no content, and drop the snapping ("a total mess"). Wrote `docs/PERFORMANCE_PLAN.md`; owner said "execute the plan" (the optional lite tier, Phase 8, **not approved**) and asked to keep the feel unchanged.
- Done: Phases 0–5 and 7 (Phase 6 measured, not needed). Measured with headless Chrome over CDP on this machine's Radeon Vega 3 (scripts in the scratchpad: static server proxying the production public API with `/api/track` swallowed, wheel-scroll benchmark, layer/compositing-reason dump, before/after screenshots, ~35-check behaviour suite).
- Found + avoided a Chrome bug: `content-visibility: auto` + View Transition = page hang (see §9).
- Committed + pushed (`f8b510d`); production verified (new build served, loader closes, lightbox opens, no console errors).
- Later the same day: wrote `FORHANON.md` (guide for the sister Hanon fan site, with researched Hanon data) and fixed two **Kotoha discography data errors** found during that research, in `db/seed.sql` and in the live DB (Neon, one transaction, admin-style): 「君が灯してくれた光を今」 is officially "HoneyWorks feat.Hanon" (Hanon's solo OP) → **archived** (archive entry 11, restorable; activity log 69); 「君の隣は空気が美味しい」 is "HoneyWorks feat.Kotoha", ED of 『29歳独身中堅冒険者の日常』 → type `tie_in` + corrected note (activity log 70). Both logged under the owner account with a "data fix by Claude at the owner's request" note.
- Also found: **AiceClass appears dissolved** (aiceclass.com 404; dissolution notice 2026-06-18). Owner decided (2026-10-09) to **leave the Kotoha site's AiceClass wording as is** for now.
