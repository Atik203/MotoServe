# MotoServe

Vehicle workshop & servicing management system. Customers book appointments, track repairs, and pay online; advisors receive vehicles and dispatch mechanics; mechanics update repair progress; admins manage services, employees, and reports.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · shadcn/ui · Redux Toolkit · Zod |
| Backend | Express 5 · Prisma 7 (@prisma/adapter-pg) · PostgreSQL · Zod |
| Tooling | TypeScript strict · pnpm (11.x) · Node 24 LTS |

Two independent folders — no shared workspace:

```
frontend/   Next.js app (port 3500)
backend/    Express API (port 4000)
```

## Setup

Requirements: Node 24 LTS, pnpm 11.x, PostgreSQL running.

```bash
# 1. install both apps
cd frontend && pnpm install
cd ../backend && pnpm install

# 2. backend env
cd ../backend
cp .env.example .env        # set DATABASE_URL

# 3. database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. run
cd ../frontend && pnpm dev   # http://localhost:3500
cd ../backend  && pnpm dev   # http://localhost:4000
```

## Demo-first development

While the backend is being built, the entire UI renders from static demo data in `frontend/public/demo/*.json` (loaded via `src/lib/demo-data.ts` + Redux thunks). API responses later mirror these exact shapes so the swap is seamless. See `blueprint.md` for the file mapping.

## Scripts

Frontend: `pnpm dev` · `pnpm build` · `pnpm start` · `pnpm lint` · `pnpm typecheck`
Backend: `pnpm dev` · `pnpm build` · `pnpm start` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed`

## Docs

- `blueprint.md` — screen list (with Figma node IDs), build status, DB entities, roadmap
- `AGENTS.md` — coding conventions & context/caching rules for AI agents

## Roles

`admin` · `advisor` (service advisor) · `mechanic` · `owner` (vehicle owner) · `guest` (public)
