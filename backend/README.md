# Vertrau Backend

Fastify + TypeScript + Prisma + Supabase backend for the Vertrau-auf-die-App.

## Stack

- **Runtime:** Node.js 20+ (developed on 24)
- **Framework:** Fastify 5
- **Language:** TypeScript (ESM)
- **ORM:** Prisma 5
- **DB / Auth / Storage / Realtime:** Supabase (Postgres hosted in Frankfurt)
- **Validation:** zod

## First-time setup

```bash
cd backend
npm install
cp .env.example .env
# Fill .env with values from the Supabase dashboard (Settings → API and Settings → Database)
npx prisma generate
```

Optionally link the Supabase project for local CLI work (run from `backend/`):

```bash
supabase link --project-ref uoavvtuwzbkubtidxeih
```

## Run

```bash
npm run dev          # Hot-reload dev server on http://localhost:3000
npm run typecheck    # Type-check without emitting
npm run build        # Compile to dist/
npm start            # Run compiled build
```

## Verify

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/db   # Requires DATABASE_URL to be set
```

## Folder layout

```
backend/
├── prisma/
│   └── schema.prisma        # DB models (filled in Phase 1)
├── src/
│   ├── lib/
│   │   ├── env.ts           # Validated env vars (zod)
│   │   ├── prisma.ts        # Prisma client singleton
│   │   └── supabase.ts      # Supabase admin client (service role)
│   ├── routes/
│   │   └── health.ts        # /health and /health/db
│   └── server.ts            # Fastify bootstrap
├── supabase/                # Supabase CLI config + migrations
├── .env.example
├── package.json
└── tsconfig.json
```

## Where credentials come from

In the Supabase dashboard for project `Vertrau-auf-die-App` (ref `uoavvtuwzbkubtidxeih`):

- **Settings → API** — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Settings → Database → Connection string** — `DATABASE_URL` (Transaction pooler, port 6543) and `DIRECT_URL` (Session, port 5432). Prisma needs both: the pooler for runtime queries, the direct URL for migrations.

Never commit `.env`. Keys with `service_role` bypass RLS — treat like a password.
