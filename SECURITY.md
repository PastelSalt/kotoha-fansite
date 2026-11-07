# Security

The Kotoha Fan Site has a public site and a private admin panel with several admin accounts, so security reports are
very welcome.

## Reporting a problem

Please **don't open a public issue** for a vulnerability. Instead:

- use GitHub's [private vulnerability reporting](https://github.com/PastelSalt/kotoha-fansite/security/advisories/new), or
- write through the Moeko Works contact form: <https://moekoworks.vercel.app/contact>.

Include what you found, how to reproduce it, and what it could affect. You'll get a reply within a few days.

## Scope

In scope: the site at <https://kotoha-fansite.vercel.app> and this repository — the public API (`/api/public`), the
analytics endpoint (`/api/track`), and the admin panel (`/admin`, `/login`, `/api/auth`, `/api/admin`).

Out of scope: denial-of-service and volume testing, social engineering, and the third-party services the site uses
(Vercel, Neon, Cloudinary, YouTube), which have their own programs.

## How the site protects people

- No accounts and no cookies for visitors; visitor counting uses a salted hash that changes every day, and IP addresses
  are never stored.
- Admin passwords are hashed with Argon2id and checked against known leaks; repeated failed sign-ins lock the account
  for 15 minutes; sessions use `__Host-` cookies (`HttpOnly`, `Secure`, `SameSite=Strict`).
- A strict Content Security Policy with Subresource Integrity on every CDN script, and HSTS (see `vercel.json`).
- Nothing is hard-deleted from the admin panel: deleted items are archived with who, when and why.
