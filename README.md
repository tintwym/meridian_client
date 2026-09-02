# Client — Meridian Atelier (Next.js)

This is your **public website + Club member app + backend API**.

Built with **Next.js 15**. One app, three user-facing areas:

| URL | Who | What |
|-----|-----|------|
| `/` | Everyone | Marketing landing page |
| `/app` | Members | Club (plan, inquire, account) |
| `/invite/[token]` | Guests | Wedding RSVP |
| `/api/*` | Apps | Backend (auth, AI, consults) |

Admin is **not here** — it lives in `../admin/`.

---

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

http://localhost:3000

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm test` | Lint + build + API smoke tests |
| `npm run clean` | Remove `.next` and other local caches |
| `npm run lint` | TypeScript check only |

---

## Vercel

- **Root Directory:** `client`
- **Framework:** Next.js (auto)
- **Env:** `APP_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`

---

## Folder map

See **[STRUCTURE.md](./STRUCTURE.md)** — read this if you feel lost.

---

## Connect admin locally

Admin runs on port **3001** and calls this app's API:

```bash
# admin/.env
API_ORIGIN=http://localhost:3000
```

Start **client first**, then admin.
