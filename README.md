# Kotoha Fan Site

Unofficial, non-profit, bilingual (日本語 / English) fan site for **Kotoha (ことは)**, made by **Moeko Software and Technologies**.

- Public site: single page in the "Clover Scrapbook" design (design v2, live since 2026-10-02): Home → About → News → Discography → Gallery → Footer, with a floating nav, a crossfading artwork backdrop, a rotating-clover loader and a motion on/off toggle
- Admin: `/login` → `/admin` (Owner + Admin roles, content management, archive, analytics)
- Stack: vanilla HTML/CSS/JS (no build step) · Vercel Functions (Node.js) · Neon PostgreSQL · Cloudinary

> Specification: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) · Build progress: [`docs/PROGRESS.md`](docs/PROGRESS.md) · Redesign: [`docs/DESIGN_V2_PLAN.md`](docs/DESIGN_V2_PLAN.md), [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) · **Handoff for a new session: [`MIGRATION.md`](MIGRATION.md)**

## Project layout

```
public/        static site (index.html, login.html, admin.html, css/ [v2/ = public design system, admin.css], js/ [public/, public/motion/, admin/, shared/], locales/, assets/)
api/           Vercel Functions (grouped: public, auth, admin, track)
lib/           shared server code (db, auth, validation, cloudinary, …)
db/            migrations/ and seed.sql
scripts/       migrate, seed runner, admin bootstrap, image optimization
docs/          plan, progress, design system, Japanese review list, data sheets
```

## Local development


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
