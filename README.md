# Moxpenses Cloud (Pages + D1)

This repo adds Cloudflare Pages Functions API + D1 database for:
- Google sign-in (client-side) + server-side token verification
- Cloud backup / restore
- Friends sharing (read-only default, can enable write)

## Cloudflare setup (dashboard)

1) Create a D1 database (free):
- Workers & Pages → D1 → Create database
- Name it: `moxpenses_db`

2) Run schema:
- Open DB → Console → paste `schema.sql` content → Run

3) Bind DB to Pages project:
- Pages → your project → Settings → Functions → D1 database bindings
- Add binding:
  - Variable name: `DB`
  - Database: `moxpenses_db`

4) Redeploy (Pages will pick up /functions)

## Google Client ID

Create an OAuth Client ID:
- Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID
- Application type: Web application
- Authorized JavaScript origins:
  - https://YOUR_PROJECT.pages.dev
- Then copy the Client ID and paste it into app Settings → Cloud backup (Google).
