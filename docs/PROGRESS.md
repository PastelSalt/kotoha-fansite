# PROGRESS.md: Self-Guide, Checklist & Resume Protocol

> **Purpose:** If a coding session gets cut off (token limit, crash, new session), this file tells the next session **exactly where things stand and what to do next**, without re-deriving anything.
> **The specification lives in [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) (v0.5, approved).** This file tracks execution.

| | |
|---|---|
| **Implementation authorized** | ✅ 2026-09-26 by owner |
| **Last checkpoint** | 2026-09-26: foundation done; Neon schema + seed applied; Owner bootstrapped; now on Phase 5 (backend core) |
| **Current phase** | Phase 1 (Accounts & setup) + Phase 2 (Foundation) in parallel |
| **Next action** | See §6 "Current focus / next action" |

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
9. **No sound / no Howler.js.** Use pinned CDN versions from the plan (GSAP 3.12.5, Lenis 1.1.18 + lenis-snap, Anime.js 3.2.2, Animate.css 4.1.1, canvas-confetti 1.9.4, Lucide pinned).
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
- [ ] Strict snap (free scroll → glide), gallery free-scroll zone, reduced-motion fallback
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
- Sections: Home, About, News, Discography, Gallery; strict snap; the gallery grows with the page (snap off inside) → footer.
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
- [ ] 1.6 Cloudinary: create signed upload preset (folder, formats, strip metadata); record name
- [ ] 1.7 Cloudinary API key/secret into `.env.local` (connector or owner paste; never commit)
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
- [ ] 3.1 5 blank sections + gallery zone; Lenis + lenis-snap + ScrollTrigger sync
- [ ] 3.2 Touch strategy decision (lenis-snap everywhere vs native CSS snap on touch) → §9
- [ ] 3.3 `--app-height` locking; inner-list `data-lenis-prevent` + edge chaining; reduced-motion path

### Phase 4: Database
- [x] 4.1 `db/migrations/0001_init.sql` (13 tables incl. `schema_migrations`; single-owner partial index; `admin_number_seq` starting at 2; JST date defaults; `visit_id` added to analytics for visit duration/reach)
- [x] 4.2 `scripts/migrate.js` + `scripts/_db.js` (Pool over the unpooled URL, transaction per file) + `scripts/run-sql.js`
- [x] 4.3 Applied 0001 on 2026-09-26 (no snapshot needed: the DB was empty). Verified 13 tables via the Neon connector
- [x] 4.4 `db/seed.sql` seeded & verified idempotent (3 videos, 10 news, 32 achievements incl. 1 draft for the 2026-10-07 release, 11 discography). All 3 videos checked public via oEmbed. Discography `youtube_id` is null except 透明夜 → admins can add MV links later
- [x] 4.5 `scripts/admin-bootstrap.js` + `lib/password.js` (Argon2id m=19456,t=2,p=1; policy; HIBP; temp generator). **Owner created in DB** (must change password). Re-run refuses. Argon2 works locally on Windows; Vercel check pending (2.7)
- [ ] 4.6 `scripts/seed-gallery.js` (credited artworks + official sheets → Cloudinary + rows). **Needs Cloudinary API key/secret**
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
- [ ] 7.1 `scripts/optimize-images.js` → responsive WebP/AVIF in `public/assets/`
- [ ] 7.2 SVG clover (fill/outline) + divider; favicon; OG image
- [ ] 7.3 TwitCasting official logo (**ask owner before download**)

### Phase 8: i18n foundation
- [ ] 8.1 `public/locales/ja.json`, `en.json` (UI, headings, nav, About, footer, admin)
- [ ] 8.2 `public/js/shared/i18n-core.js` (resolution order, pre-paint apply, switcher, persistence)
- [ ] 8.3 Fonts (Fredoka + M PLUS Rounded 1c), JA line-breaking CSS

### Phase 9: Public UI
- [ ] 9.1 Design tokens + base CSS
- [ ] 9.2 Hero header, scrolled nav, mobile menu
- [ ] 9.3 Home (countdown, newest video facade, 2 news, divider, credit)
- [ ] 9.4 About (avatar, bio, pills, clover stage)
- [ ] 9.5 News (all news list paged + dashed scrollbar; player + all-videos list)
- [ ] 9.6 Discography (all releases) + Achievements (all)
- [ ] 9.7 Gallery (infinite masonry, lightbox, "load more" fallback)
- [ ] 9.8 Footer
- [ ] 9.9 Empty/error/skeleton states; responsive pass (360 / 768 / 1024 / 1366 / 1920 / 2560)

### Phase 10: Loader
- [ ] 10.1 Inline loader markup/CSS; random art + credit
- [ ] 10.2 Tiered preloading, min 3 s / soft 6 s / cap 10 s; `loader_timing` event
- [ ] 10.3 Clover iris exit (fade under reduced motion)

### Phase 11: Animations
- [ ] 11.1 Section entrances + header transition (GSAP/ScrollTrigger)
- [ ] 11.2 Micro-interactions (Anime.js), confetti triggers, Animate.css for states

### Phase 12: Admin: content
- [ ] 12.1 `/login` page; `/admin` shell (JP/EN), forced-change screen
- [~] 12.2 **API done & verified** (`api/admin.js`: generic CRUD for videos/news/achievements/discography, drafts, publish sets `published_at`, archive on DELETE, `videos/lookup` via oEmbed, duplicate → 409). UI pending
- [~] 12.3 **API done & verified** (`lib/archive.js`: archive = copy+delete in one transaction; restore keeps the original id via `overriding system value`; gallery/accounts not restorable; `GET /api/admin/activity`). UI pending

### Phase 13: Admin: gallery
- [~] 13.1 Code written (`lib/cloudinary.js`: sign, verify response signature, Admin API `getResource`, `destroyImage` with invalidate, `deliveryUrl`; gallery routes in `api/admin.js`). Returns `503 CLOUDINARY_NOT_CONFIGURED` until keys exist. **Untested against Cloudinary: needs the owner's API key/secret (still empty in `.env.local`)**
- [ ] 13.2 Drop zone, multi-file, auto-downscale (≤ 10 MB & ≤ 25 MP), progress, HEIC hint
- [ ] 13.3 Edit credit, delete (Cloudinary destroy + archive record)

### Phase 14: Admin: accounts
- [ ] 14.1 Accounts screen (Owner): list, create (show temp password once), reset, remove
- [ ] 14.2 My Account: change password, sign out other devices

### Phase 15: Analytics
- [ ] 15.1 `/api/track` + client tracker (events per plan §8.8)
- [ ] 15.2 Rollups (JST) + retention pruning
- [ ] 15.3 Dashboard charts (SVG) + KPIs

### Phase 16: Quality pass
- [ ] 16.1 A11y (keyboard, screen reader, contrast, reduced motion) in both languages
- [ ] 16.2 Performance (Lighthouse, real devices), cross-browser
- [ ] 16.3 Security review (auth, uploads, headers, secrets scan)

### Phase 17: Launch
- [ ] 17.1 Pre-launch reset (`scripts/prelaunch-reset.js`), re-seed, bootstrap Owner
- [ ] 17.2 Production deploy; verify
- [ ] 17.3 Owner first login + password change (**owner action**); delete bootstrap env vars
- [ ] 17.4 Final docs: README, DB setup, deploy, admin guide (JA/EN), JA review list

---

## 6. CURRENT FOCUS / NEXT ACTION

- **Done so far:** Phases 1 (except Cloudinary keys), 2, 4 (except gallery seed), 5, 6.1/6.2/6.4. Production: https://kotoha-fansite.vercel.app (placeholder page + live APIs).
- **Next action (no owner input needed):** 6.3 accounts API → Phase 8 i18n locale files → Phase 3 scroll prototype → Phase 9 public UI.
- **Blocked on owner:** 1.6/1.7, 4.6, Phase 13 (Cloudinary API key/secret in `.env.local`, then I add them to Vercel).
- **Workflow:** commit + push after each verified step (every push to `main` deploys production; the site is not announced yet, so that's fine pre-launch). Always run the secret scan before committing (see the command in the session log).

---

## 7. OPEN QUESTIONS FOR OWNER

_(none)_

---

## 8. OWNER ACTION ITEMS

- [ ] **Install GitHub CLI + log in** (run in your own terminal):
  `winget install --id GitHub.cli -e` then open a new terminal and run `gh auth login` (choose GitHub.com → HTTPS → login with browser).
- [ ] Approve Vercel's access to the GitHub repo when prompted (one click).
- [ ] **Paste Cloudinary API key + secret into `.env.local`** (Cloudinary Console → Settings → API Keys; lines `CLOUDINARY_API_KEY=` and `CLOUDINARY_API_SECRET=`). The connector can't read these. Cloud name is already filled in.
- [ ] After launch: first login with the default credential → change password immediately.
- [ ] Later: share `docs/JA_REVIEW_LIST.md` with a Japanese speaker.

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
| 2026-09-26 | Password "guessable" rule | Reject when the password's letters consist **only** of site words (kotoha, hakoniwa, lily, clover, password, …), not when it merely contains one | Blocks "KotohaClover2026!" but allows real passphrases |

---

## 10. KNOWN ISSUES / TODO LATER

- Neon free tier caps storage at 512 MB → keep the analytics 90-day raw retention + daily rollups; consider pruning `login_attempts` / expired sessions in a scheduled job (Vercel Cron) in Phase 15.
- CSP header still to be written (Phase 16).

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
