# MIGRATION.md — handoff context for the next Claude session

> Give this file to Claude at the start of a new session ("read MIGRATION.md and continue").
> Written 2026-10-02, right after the design v2 redesign was merged into `main`.
> Read `docs/PROGRESS.md` and `docs/DESIGN_V2_PLAN.md` (§14 checklist, §16 work log) next — they are the living spec.
> **No secrets live in this file.** Never put passwords/keys in tracked files.

---

## 1. The project in one paragraph

Unofficial, non-profit, bilingual (JA/EN) fan site for **Kotoha (ことは)** of HaKoniwalily — HoneyWorks support vocalist, AiceClass VTuber.
Plain HTML/CSS/vanilla JS (ES modules, **no build step**), Vercel Functions (plain Node `(req, res)`), Neon Postgres, Cloudinary, hosted on Vercel at **kotoha-fansite.vercel.app**. Admin panel at `/login` → `/admin`. Private GitHub repo **PastelSalt/kotoha-fansite**. Built by Moesoft (Moeko Software and Technologies). The owner is "bad at frontend design/animation" and gives Claude wide creative freedom; they care a lot about a **dense, creative, Japanese-fan-site feel** (not Western minimalism).

## 2. Repo / branch / deployment state (as of this file)

- `main` = production; **every push to `main` deploys**. Other branches only create protected previews.
- **Design v2 was merged into `main`** (merge commit `c7b6975`, 2026-10-02) at the owner's explicit request ("start applying the changes to the vercel main domain"). The `/design-v2/` style-tile page was deleted before the merge.
- Branch `designupdatev2` still exists (same content; can be deleted or reused for the next design phases — prefer a fresh branch per phase, merge to `main` only with the owner's OK).
- **Not yet verified:** that the production deploy finished and looks right. The Vercel MCP "list deployments" call was blocked by the permission classifier (it flagged it as a production deploy), and I did not work around it. **First thing to do next session:** check https://kotoha-fansite.vercel.app (hard refresh) — loader, all sections, EN/JA, gallery, console errors — e.g. with the headless-Edge scripts described in §8. If broken: promote the previous deployment in Vercel (instant) and/or `git revert -m 1 c7b6975`.
- Recent history: phases 1–15 (v1 site, admin, gallery, analytics, CSP/SRI, pre-launch reset script, gallery seed, TwitCasting icon) → loader clover rotation fix `c58bfbc` → design plan v0.3 → D1/D1.1 style tile → `7b3895f` real page on v2 → `2c8f181` tile removed → `c7b6975` merge.

## 3. Owner action items still open (not Claude's to do silently)

1. Add **`CLOUDINARY_API_KEY`** and **`CLOUDINARY_API_SECRET`** to Vercel as *Sensitive* env vars (Production + Preview). (Images already display; the keys are needed for admin uploads.)
2. **Real-phone test.** The old swipe test is replaced by the phone checkpoint (✋3) once D5 is done.
3. **First admin login + forced password change.** Default login = the credentials from the owner's original brief; they are still in the git-ignored `.env.local` (`ADMIN_BOOTSTRAP_*`). The DB only stores an Argon2id hash with `must_change_password = true`. New password rules: ≥ 12 chars, must not contain the username, not only site words (kotoha/clover/lily/password…), not in known leaks (HIBP). Don't paste the default password into tracked files or chat unnecessarily; the owner already knows it.
4. **Native Japanese review** of `docs/JA_REVIEW_LIST.md` (new v2 strings were appended on 2026-10-02).
5. Later, with the owner's go-ahead only: delete the bootstrap env vars and run `npm run prelaunch:reset` (dry run by default; `--yes-reset-everything` for real — truncates all data tables and rebuilds the Owner from `ADMIN_BOOTSTRAP_*`, so keep those two env lines until then).

## 4. Architecture cheat-sheet

- **API:** four grouped functions `api/public.js`, `api/auth.js`, `api/admin.js`, `api/track.js`; Vercel rewrites pass `?__route=`. `cleanUrls` on. `.vercelignore` patterns **must start with `/`** (an unanchored `assets` once removed `public/assets` from production).
- **DB:** Neon over HTTP (`neon()`); the free compute sleeps and needs ~10 s to wake. `lib/db.js` retries only connection-open errors (`UND_ERR_CONNECT_TIMEOUT`, `ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN`). Public client fetch timeout is 15 s.
- **Auth:** Argon2id, DB-backed sessions (`__Host-kf_session` cookie on HTTPS), forced password change, HIBP check.
- **Cloudinary:** signed uploads (no SDK), preset `kotoha_gallery_signed`, folder `kotoha-fansite/gallery`. `npm run gallery:seed` (idempotent) seeds 8 credited images.
- **Analytics:** cookieless, JST days, Monday weeks, lazy rollup (`rollupIfStale`), 90-day retention, production events only. Public events: `page_view`, `loader_timing`, `section_dwell` (sections: home/about/news/discography/gallery/footer), `outbound_click`, `video_play`, `news_link_click`, `gallery_open`, `gallery_credit_click`, `language_switch` — wired by `data-track*` attributes (`public/js/public/track.js`). Keep these working.
- **CSP + SRI** (`vercel.json`): scripts only from self/cdnjs/jsdelivr, every CDN script/stylesheet SRI-pinned except Google Fonts CSS; no inline scripts (hence `prepaint.js`, `motion-boot.js`). Inline `<style>` and `style=""` are allowed (`style-src 'unsafe-inline'`).
- **i18n:** `public/js/shared/i18n-core.js`, dictionaries `public/locales/{en,ja}.json`; `data-i18n="a.b"` for text, `data-i18n-attr="attr:key;attr2:key2"` for attributes; `t('key', {vars})`. Language chosen by `?lang=`, `localStorage kf_lang`, else IP geo (`/api/public/geo`).
- **Admin panel keeps its old look** (`public/css/admin.css`, `public/js/admin/*`, `login.html`, `admin.html`). `prepaint.js` loads Animate.css for those pages only (public page sets `html[data-site="public"]`).

## 5. Design v2 ("Clover Scrapbook") — what is live

Owner-approved direction: paper notes taped onto fan art, die-cut stickers, stitches for featured items, filled illustrated clovers (never hollow outlines), dense numbered EN/JA section titles, giant outlined background words, vertical Japanese text, speech bubbles, stamps, gingham, a fixed artwork backdrop that **crossfades** between sections. Fredoka stays the main font (M PLUS Rounded 1c for JP, Yomogi for tiny doodle notes only). "Music-video-like" means *quality of movement* only — it must stay a proper website, alive on scroll up and down.

**Reference docs:** `docs/DESIGN_SYSTEM.md` (tokens, components, §4.1 Japanese-density vocabulary, §4.2 backdrop, motion rules, module APIs, SRI table) and `docs/DESIGN_V2_PLAN.md`.

**Files**
- CSS (`public/css/v2/`, cascade layers `legacy, tokens, base, components, sections, motion` declared in `tokens.css`): `tokens.css`, `base.css`, `components.css`, `sections.css` (accents, backdrop, scrims), `layout.css` (**real page**: nav pill, mobile menu, scenes, loader, footer, short-laptop rules), `motion.css`. Old `public/css/site.css` is deleted.
- Sprite: `public/assets/svg/v2-sprite.svg` (`#cl-leaf`, `#cl-round`, `#spark`, `#heart`; colours via `--c1..--c4`). **XML comments in SVG must never contain `--`** (it silently breaks the whole sprite).
- Page: `public/index.html` (static loader markup, fixed `.backdrop`, `.site-nav` pill, `#mobile-menu`, scenes `#home #about #news #discography #gallery` with `data-section`/`data-art`/`data-accent`, footer `#site-footer`, `<dialog id="lightbox">`).
- JS `public/js/public/`: `main.js` (boot/orchestration), `render.js` (builders), `lists.js` (`pagedList`, `render` may return several nodes, `axis:'x'`), `gallery.js` (JS masonry 2–5 cols + lightbox that grows from its tile via View Transitions), `home.js` (week strip, "coming soon", fan-art-of-the-moment, `isRecent` for NEW stamp), `countdown.js` (flip-digit ticket, `nextStream`), `loader.js`, `scroll.js`, `fx.js` (confetti, `boing`, GSAP home intro, title letters), `data.js` (SOCIALS, OFFICIAL_LINKS, CREDITS), `track.js`. Motion modules in `public/js/public/motion/`: `prefs.js`, `beat.js` (128 BPM, `--beat` 469 ms), `scroll-life.js`, `marquee.js`, `sparkles.js`, `wipe.js` (written, **not wired yet**), `spinner.js`, `text.js`, `backdrop.js`. `public/js/motion-boot.js` sets `html[data-motion=full|calm]` pre-paint (toggle stored in `localStorage kf_motion`).
- Libraries on the public page: **GSAP 3.15.0 + SplitText** (jsdelivr, SRI), **Lenis 1.1.18**, **canvas-confetti 1.9.4**. Removed from the public page: GSAP 3.12.5, ScrollTrigger, Anime.js, Animate.css.

**Behaviour decisions**
- **Loader:** artwork is a pure-CSS background keyed by `html[data-loader-art]` (random 1–3, set in `prepaint.js`); the **two clovers are static inline SVG that rotate continuously from first paint** (outer clockwise 4 s, inner counter-clockwise 2.5 s; 12 s/8 s in calm mode) — owner requirement. Petals fill from real task progress, "Did you know?" facts come from About data, exit = fast spin + circle (iris) opening onto Home; calm = fade. Min 3 s / soft 6 s / cap 10 s, CSS failsafe fade at 12 s. Don't regress the rotation.
- **Scrolling:** desktop mouse + full motion → Lenis + strict direction-aware snap (`scroll.js`; free zones inside tall sections and below the gallery top). Phones/tablets/calm mode → native free scrolling (the backdrop crossfade hides section changes). Calm = device `prefers-reduced-motion` OR the site's motion toggle.
- **Credits:** "art by" labels and the loader credit and credits dialog were removed on purpose (they broke the illusion). Artists are credited on gallery tiles, in the lightbox, and in the footer list (static `CREDITS` + gallery authors).
- **Home on short laptops (≤ 960 px tall, ≥ 1100 px wide):** keeps brand/socials/ticket/week | news + video; hides 2nd note, coming-soon and fan-art cards (they show on taller screens). Right column holds news + the "PICK UP!" video polaroid; left column ends with the coming-soon and fan-art cards.
- Never put words in Kotoha's mouth: speech bubbles are the *site's* voice ("check it out ♡", "thank you, artists!").

## 6. Roadmap — what is left (plan §15 order)

Done: D1/D1.1 tile, D2 foundations, D3 components, D4 desktop sections, D6 loader (all merged).
Remaining, in order:
1. **Verify production** (see §2).
2. **✋2 owner review** of the live desktop design → adjustments. (Owner's D1.1 feedback questions — density, 4-leaf vs rounded clover, phone crossfade + free scroll, extra art available, vertical JP text/giant words — were never answered explicitly; the owner said "start applying", which implies the recommended defaults. Re-ask only if it matters.)
3. **D5 phones/tablet:** works but undesigned: one-column compositions, direction-aware top bar, landscape phones (800×360), 360/390/768 matrix, weekly strip wraps at 390, ticket/home stacking order. → **✋3 owner tries it on a real phone.**
4. **D7 motion:** wire `wipe.js` to the desktop snap (`initScroll({ onSectionSnap })` hook exists; reverse direction when scrolling up), velocity lean/parallax tuning, fps checks (≥ 55 fps desktop, ≥ 50 fps with 4× CPU slowdown). → ✋4.
5. **D8 extras:** mascot cameo, special-day decorations (June 10 birthday / July 8 debut; confetti already exists), LIVE badge on the nav, "coming soon" already built; **gallery seed additions**: 5 extra credited artworks (About background, 2 loader arts "pajamas" + "green cardigan", profile avatar, About pose; unknown artist → "Artist unknown (作者不明)") via `scripts/seed-gallery.js`.
6. **D9 QA:** keyboard path + focus, screen-reader labels, contrast sampler, no text < 13 px, ≤ 6 dashed (stitch) items per screen, JP line breaks, perf, CSP/SRI, tracker + admin regression, owner's own devices. Also remove now-unused generated SVGs (`clover-fill.svg`, `clover-outline.svg`, `divider.svg` are still produced by `scripts/optimize-images.js`) and the unused `legacy` layer name.
7. Update `docs/PROGRESS.md` (not yet updated for the v2 merge — do it) and the plan's §14/§16 after each phase.

## 7. Working rules (from the owner / memory)

- Resume from `docs/PROGRESS.md`; keep it, `docs/DESIGN_SYSTEM.md` and the plan §16 work log current after each phase.
- **Never merge a design branch into `main` without the owner's explicit OK** (this one had it). Commit + push after each verified task. **Never force-push.** Secret scan before every commit. Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Git user is "Moesoft: Moeko Software and Technologies".
- Don't touch the admin look. Don't reveal/store passwords in tracked files.
- When the owner is frustrated, answer plainly (e.g. the default login question) instead of lecturing about security.
- Owner prefers Claude to give a recommendation + confidence level when asking questions, and to continue between checkpoints on its own.

## 8. Dev + testing tips (Windows 11, Git Bash + PowerShell)

- Dev server: `.claude/launch.json` config **`kotoha-dev`** (`node --env-file=.env.local scripts/dev-server.js`, port 3000). It stops between turns — restart with `preview_start`. Uses the real Neon DB/Cloudinary from `.env.local`.
- The built-in browser pane reports `visibilityState: hidden`, so verify with **headless Edge over the DevTools protocol** (`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe --headless=new --remote-debugging-port=… `). The scripts used this session lived in the (temporary) Claude scratchpad, not the repo: `site-shot.mjs` (per-section screenshots + CSP/console/network issues), `site-behavior.mjs` (≈50 checks: loader spin, petals, snap by wheel, nav/anchors, EN↔JA, video, lightbox, motion toggle, tracking beacons, deep link, phone menu, reduced motion), `debug1.mjs`. To use such a script: copy it to `.name.tmp.mjs` in the project root (it imports `sharp` / `./lib/...`), run `node --env-file=.env.local .name.tmp.mjs <outDir>`, then delete the copy. **Recreate them if the scratchpad is gone** — consider committing a cleaned version under `scripts/` or `tests/` (good next task).
- Test-harness gotchas: after `Page.navigate`, wait until the *new* document exists (set `window.__old = 1` first and poll until it's gone) — otherwise `#loader` checks hit the old page. Phone emulation needs `Emulation.setTouchEmulationEnabled` to get `(pointer: coarse)` (otherwise Lenis starts). Wheel snap needs ~3 s to settle (Lenis lerp + 0.8 s glide).
- Git Bash mangles `/paths` args (use `MSYS_NO_PATHCONV=1`); `npx.cmd` fails under Git Bash (use PowerShell); long heredocs with mixed quotes break — write a script file with the Write tool; `git merge -F -` is invalid (use `-m`).
- Neon/CDN network drops can fail tests; re-run when stable.

## 9. Gotchas learned the hard way

- `.vercelignore` anchoring (above). SVG comment `--` (above). Admin navigation race fixed with a per-render container + `renderSeq` guard. A `display:grid` author rule overrides the `hidden` attribute — hence `[hidden]{display:none!important}` in `base.css`. `:lang(ja){line-height}` on every element stretched display titles — now only body/text blocks get JA leading. `.menu-btn` display rule needed higher specificity than `.nav-pill__menu`. Component rules that set `transform` (scroll-driven reveal keyframes) must not be animated by GSAP on the same element — animate wrapper columns instead (see `homeIntro`).
- Production images once never showed because of the `.vercelignore` bug; Cloudinary display works now.

## 10. Quick start for the next session

1. `git status` / `git log --oneline -5` on `main`; read `docs/PROGRESS.md`, the plan §14/§16, this file.
2. Verify the live site (§2). Report results to the owner.
3. Ask the owner what they think of the live desktop design (✋2), then do D5 (phones), D7, D8, D9 in that order, one branch per phase, merge only with OK.
