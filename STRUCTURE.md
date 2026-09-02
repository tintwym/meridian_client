# Client folder structure

Use this map when you are not sure where code lives.

```
client/
├── app/                    # Next.js routes (thin — mostly import from src/)
│   ├── page.tsx            #   /  → marketing OR native app shell
│   ├── app/page.tsx        #   /app → Club tabs
│   ├── invite/[token]/     #   guest RSVP
│   ├── api/[[...path]]/    #   all /api/* → Express backend
│   ├── layout.tsx          #   HTML shell + fonts
│   └── globals.css         #   Tailwind + brand styles
│
├── src/                    # All React + server logic
│   ├── MarketingApp.tsx    #   Landing page sections
│   ├── app/                #   Club mobile shell
│   │   ├── MobileApp.tsx
│   │   ├── AuthContext.tsx
│   │   └── screens/        #   Home, Plan, Inquire, Club
│   ├── components/         #   Shared UI (Designer, Header, …)
│   ├── api/                #   Browser API client (fetch /api)
│   ├── server/             #   Express routes + database store
│   │   ├── vercelApp.ts    #   API entry
│   │   ├── platformRoutes.ts
│   │   └── platformStore.ts
│   ├── lib/                #   Supabase, email, helpers
│   └── data/               #   Venues, destinations, catalog
│
├── public/                 #   Static files (favicon, sw.js, venues/)
├── supabase/migrations/    #   SQL for Supabase (optional)
├── scripts/smoke-test.sh   #   npm test
└── data/                   #   Local admin-users.json (dev only)
```

## Mental model

```
Browser
  │
  ├─ /              MarketingApp (scroll landing)
  ├─ /app           MobileApp (4 tabs + auth)
  ├─ /invite/…      InvitePage (no login)
  │
  └─ /api/…         Express (same code as before Vite migration)
        ├─ /api/auth/*     Club login
        ├─ /api/club/*     Member data
        ├─ /api/admin/*    Used by admin app (Bearer admin token)
        └─ /api/generate-plan   Gemini AI
```

## What changed from the old setup?

| Before | Now |
|--------|-----|
| Folder name `web_client` | **`client`** |
| Vite + `server.ts` | **Next.js** `app/` + `app/api/` |
| `meridian_web` (merged admin) | **Removed** — admin stays in `admin/` |
| Port 3000 | Still **3000** |

Your React components in `src/` are **the same code** — only the framework shell changed.

## Where to edit common things

| Task | File(s) |
|------|---------|
| Landing hero / sections | `src/MarketingApp.tsx`, `src/components/landing/` |
| Club tabs | `src/app/MobileApp.tsx`, `src/app/screens/` |
| Login / points | `src/app/AuthContext.tsx`, `src/api/platform.ts` |
| API endpoints | `src/server/platformRoutes.ts`, `meridianApiRoutes.ts` |
| Env vars | `.env` (see `.env.example`) |

## Android / iOS

Mobile apps talk to **`/api/*`** on this client URL. They do not use the Next.js pages.
