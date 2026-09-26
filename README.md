# Kotoha Fan Site

Unofficial, non-profit, bilingual (日本語 / English) fan site for **Kotoha (ことは)**, made by **Moeko Software and Technologies**.

- Public site: animated single page (Home → About → News → Discography → Gallery → Footer)
- Admin: `/login` → `/admin` (Owner + Admin roles, content management, archive, analytics)
- Stack: vanilla HTML/CSS/JS (no build step) · Vercel Functions (Node.js) · Neon PostgreSQL · Cloudinary

> Specification: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) · Build progress: [`docs/PROGRESS.md`](docs/PROGRESS.md)

## Project layout

```
public/        static site (index.html, login.html, admin.html, css/, js/, locales/, assets/)
api/           Vercel Functions (grouped: public, auth, admin, track)
lib/           shared server code (db, auth, validation, cloudinary, …)
db/            migrations/ and seed.sql
scripts/       migrate, seed runner, admin bootstrap, image optimization
middleware.js  language cookie + /admin guard
```

## Local development

_Full instructions will be completed in Phase 17._

1. Install Node.js 22+ and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the values (never commit it).
3. Database: `npm run db:migrate` then `npm run db:seed`.
4. Create the Owner account once: `npm run admin:bootstrap` (reads the bootstrap values from `.env.local`).
5. Run locally: `npm run dev` (uses `npx vercel dev`), then open `http://localhost:3000`. Use `?lang=ja` / `?lang=en` to test languages locally.

## Database

- Migrations live in `db/migrations/` and are applied in order by `npm run db:migrate` (`npm run db:status` lists them).
- `db/seed.sql` is idempotent (safe to run again).
- Content is never hard-deleted by the app; deleted items move to the `archived_content` table.

## Deployment

_To be completed in Phase 17 (Vercel project linked to the private GitHub repo; production URL `https://kotoha-fansite.vercel.app`)._
