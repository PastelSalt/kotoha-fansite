# Kotoha Fan Site

**Student:** Kyle Q. Zoleta  
**Website Category:** Fan Site / Entertainment  
**Project Title:** Kotoha Fan Site — Unofficial Bilingual Fan Site  
**Live URL:** https://kotoha-fansite.vercel.app/  
**Timeline:** Sep 2026 – present  
**Role:** Solo developer (design, front end, back end, admin panel, analytics)  
**Status:** Live

---

## Project Description

An unofficial, non-profit, bilingual (日本語 / English) fan site for **Kotoha (ことは)**, vocalist of HaKoniwalily, HoneyWorks support vocalist, and AiceClass member. Built by **Moeko Software and Technologies** as a comprehensive fan resource featuring latest works, news, discography, and fan art gallery.

The v2 design, **"Clover Scrapbook,"** turns the page into a scrapbook. Paper notes are taped onto artwork, die-cut stickers mark the details, and stitched borders highlight featured items, all over an artwork backdrop that crossfades between sections. Every entrance is timed to one tempo (128 BPM) so the motion feels coordinated. A Motion toggle, together with the device's reduced-motion setting, switches the whole site to a calm mode.

Behind the scenes it is a lightweight site with **no build step** (HTML, modern CSS and ES modules), backed by four Vercel Functions on Node.js, Neon Postgres and Cloudinary. A private admin panel lets the owner and invited admins publish videos, news, achievements, releases and fan art, restore anything archived, review an activity log and read cookieless visitor statistics.

---

## Main Features

### Public Site Features
1. **Arrive in Style** — Loader of at least 3s showcases one of three artworks while everything preloads. Two clovers spin, petals fill with real progress, "Did you know?" facts rotate, and an iris opens onto Home.
2. **Read in Your Language** — Visitors in Japan get Japanese, everyone else English. A switcher changes everything, including headings, menus, About and the footer.
3. **Glide Through Sections** — On desktop you scroll freely, then the page glides to the next section. Phones scroll freely while the artwork backdrop crossfades.
4. **Catch the Next Stream** — Countdown for regular Tue & Fri ~21:00 JST streams, this week's schedule, the newest video, the two newest news items and the next release.
5. **Get to Know Kotoha** — Profile card covers birthday, debut, height, activities, fan name, hashtags and favourites.
6. **Watch and Read Everything** — All videos and news, newest first, with a privacy-enhanced YouTube player.
7. **Explore the Discography** — Every release with YouTube-thumbnail covers and a "coming soon" card.
8. **Browse Fan Art** — Infinite masonry gallery whose lightbox grows out of the tapped tile, with the artist and source credited.
9. **Turn Motion Off** — The site remembers the choice and always respects the device setting.
10. **Celebrate** — Clover confetti on special days (June 10 birthday, July 8 debut).

### Admin Features
- **Sign in Safely** — First login forces a password change, with leak checks (HIBP) and lockout after repeated failures.
- **Publish Content** — Paste a YouTube link and the title/thumbnail are looked up. Manage news, achievements and discography with drafts.
- **Upload Fan Art** — Signed direct uploads to Cloudinary that shrink files to free-tier limits automatically, with credits.
- **Never Lose Anything** — Deleting archives an item with the reason, who and when; any item can be restored.
- **Manage the Team** — Owner creates auto-numbered admin accounts with temporary passwords, resets or removes them. Anyone can sign out their other devices.
- **Watch the Numbers** — Dashboard with content counts, activity log, and visitor statistics for 7/30/90/365 days (JST).

---

## Technologies Used

### Languages
- **HTML5** — Semantic, accessible markup with no build step
- **CSS** — Cascade layers, @property, scroll-driven animations and View Transitions
- **JavaScript** — Native ES modules: no framework and no bundler

### Libraries
- **GSAP** — Arrival choreography and SplitText letter pops
- **canvas-confetti** — Clover confetti on special days
- **Lucide** — Interface icons
- **Animate.css** — Small transitions in the admin panel
- **Argon2id** — Password hashing for admin accounts

### Runtimes
- **Node.js** — Four grouped Vercel Functions

### Data
- **Neon** — Serverless Postgres over the HTTP driver, with retries
- **PostgreSQL** — Ordered SQL migrations and idempotent seeds

### Cloud & Hosting
- **Vercel** — Hosting in Singapore (sin1) with CSP, SRI and HSTS headers

### Services
- **Cloudinary** — Signed direct uploads and optimised delivery of fan art
- **YouTube embeds** — Video lookups and privacy-enhanced embeds

### Tools
- **sharp** — Image-optimisation scripts

---

## Technical Highlights

- **Cookieless Analytics** — Daily-salted visitor hashes and no stored IPs; events batched with `sendBeacon`; 90-day raw data with daily rollups
- **Locked-down Delivery** — Strict Content-Security-Policy with Subresource Integrity on every CDN script, and HSTS
- **Resilient Database Access** — Neon HTTP driver with connection retries, plus a "waking up" notice while the free compute resumes
- **Repeatable Setup** — Ordered SQL migrations, idempotent seeds, an owner-bootstrap script and image-optimisation scripts

---

> Specification: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) · Build progress: [`docs/PROGRESS.md`](docs/PROGRESS.md) · Redesign: [`docs/DESIGN_V2_PLAN.md`](docs/DESIGN_V2_PLAN.md), [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) · **Handoff for a new session: [`MIGRATION.md`](MIGRATION.md)**

## Project Layout

```
public/        static site (index.html, login.html, admin.html, css/ [v2/ = public design system, admin.css], js/ [public/, public/motion/, admin/, shared/], locales/, assets/)
api/           Vercel Functions (grouped: public, auth, admin, track)
lib/           shared server code (db, auth, validation, cloudinary, …)
db/            migrations/ and seed.sql
scripts/       migrate, seed runner, admin bootstrap, image optimization
docs/          plan, progress, design system, Japanese review list, data sheets
```

## Local Development

1. Install Node.js 22+ and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the values (never commit it).
3. Database: `npm run db:migrate` then `npm run db:seed`.
4. Create the Owner account once: `npm run admin:bootstrap` (reads the bootstrap values from `.env.local`).
5. Run locally: `node --env-file=.env.local scripts/dev-server.js` (a small server that mirrors the Vercel rewrites and headers; port 3000), or `npm run dev` (`npx vercel dev`). Open `http://localhost:3000`; use `?lang=ja` / `?lang=en` to test languages and `?debug` to expose scroll internals.

Other scripts: `npm run gallery:seed` (idempotent, 8 credited artworks), `npm run images:optimize`, `npm run prelaunch:reset` (dry run; `-- --yes-reset-everything` runs it for real, only right before launch).

## Database

- Migrations live in `db/migrations/` and are applied in order by `npm run db:migrate` (`npm run db:status` lists them).
- `db/seed.sql` is idempotent (safe to run again).
- Content is never hard-deleted by the app; deleted items move to the `archived_content` table.

## Deployment

The Vercel project is linked to the private GitHub repo `PastelSalt/kotoha-fansite`; production URL `https://kotoha-fansite.vercel.app`. **Every push to `main` deploys production**; other branches create protected previews. Environment variables (Neon `DATABASE_URL`, Cloudinary, bootstrap owner) live in Vercel (Sensitive) and in the git-ignored `.env.local`; never commit them. CSP and Subresource Integrity are enforced via `vercel.json`. To roll back, promote the previous deployment in Vercel (instant) or revert the merge commit.

## Credits & Disclaimer

- **Character and official art** — Kotoha · AiceClass
- **Fan art** — Credited on the site to respective artists

> Unofficial, non-profit fan site. Not affiliated with Kotoha, HaKoniwalily, HoneyWorks or AiceClass. Characters and artwork belong to their respective owners; fan art is credited on the site.

---

**Portfolio:** [Moesoft](https://moesoft.vercel.app/) — A portfolio by Kyle Zoleta