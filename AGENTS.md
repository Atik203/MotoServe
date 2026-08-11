# MotoServe — AGENTS.md

Instructions for AI coding agents (DeepSeek v4 pro/flash, GPT-5.6/Lune, Claude, etc.). Read this file first. It exists to maximize context efficiency: **read once, cache, never re-derive.**

## Project

Vehicle workshop & servicing management system (MotoServe).
Two folders, no workspace sharing:

```
frontend/   Next.js 16.3.0 (App Router, Turbopack) · React 19.2.8 · Tailwind CSS 4.3.3 (CSS-first, no tailwind.config.js) · shadcn/ui · @reduxjs/toolkit 2.12.0 · sonner 2.0.8 (toasts) · Zod 4.4.3
backend/    Express 5.2.1 · Prisma 7.9.1 (@prisma/adapter-pg, prisma.config.ts, prisma-client generator) · Zod 4.4.3 · PostgreSQL
root        AGENTS.md · README.md · blueprint.md (source of truth for screens/status)
```

- Node 24 LTS · pnpm (11.x) · TypeScript strict everywhere · Inter font · primary brand blue `#0052cc` (canonical for ALL screens).
- Roles: `admin`, `advisor`, `mechanic`, `owner`, `guest`.

## Context/caching rules (MOST IMPORTANT)

1. **Never re-fetch design data you already captured.** Design tokens, node IDs, demo values, and asset URLs live in this file + `blueprint.md`. Read them instead of calling Figma again.
2. **Batch reads.** Use `glob`/`grep` over multiple Read calls; read whole files, not 30-line slices.
3. **Demo data is the source for UI.** All pages render from `frontend/public/demo/*.json` via `src/lib/demo-data.ts`. Never hardcode sample values in components (except fixed labels from the design).
4. **Types before code.** Domain types live in `frontend/src/types/` and mirror `backend/src/types/` (two simple folders; keep them in sync manually — see "Type sync" below).
5. **Preserve pinned versions.** Do NOT run `npm update`/`pnpm update` or add packages at newer majors without asking. Verify a package exists with `pnpm view <pkg> version` before adding.
6. **One screen per task.** Build order and node IDs in `blueprint.md`. Design context was already fetched once per screen and distilled there — extend the "Design notes" section instead of re-fetching.
7. **No comments in code** unless the user asks. Follow existing file conventions exactly (see component conventions below).

## Commands

```bash
# frontend (from frontend/)
pnpm dev           # dev server (port 3000)
pnpm build && pnpm start
pnpm lint          # eslint
pnpm typecheck     # tsc --noEmit

# backend (from backend/)
pnpm dev           # tsx watch src/index.ts (port 4000)
pnpm build && pnpm start
pnpm db:generate   # prisma generate
pnpm db:migrate    # prisma migrate dev
pnpm db:seed       # node prisma/seed.ts
```

## Frontend conventions

- App Router routes grouped by role:
  - `src/app/(public)/` — marketing (home, services, pricing, faqs, testimonials)
  - `src/app/(auth)/` — login, register, forgot-password
  - `src/app/(owner)/` — vehicle owner app (sidebar layout, `#0052cc`)
  - `src/app/(advisor)/` — service advisor app
  - `src/app/(mechanic)/` — mechanic app
  - `src/app/(admin)/` — admin app
- Shared app chrome: `src/components/layout/` (Sidebar, Topbar, PublicNavbar, PublicFooter). The owner/advisor/mechanic/admin apps share ONE sidebar/topbar system styled to the canonical design (256px sidebar, 64px topbar, `#0052cc` active state).
- shadcn components go in `src/components/ui/`; ONLY add with `pnpm dlx shadcn@latest add <name>` (or copy the component when offline — keep props identical to current shadcn).
- Tailwind v4: tokens in `src/app/globals.css` under `@theme` (e.g. `--color-primary: #0052cc`). Do NOT create `tailwind.config.js`.
- Redux: `src/store/` — one slice per domain (auth, jobs, vehicles, appointments, chat, ui). Async demo loads via `createAsyncThunk` calling `demoData.load("services")` etc. Components consume via hooks `useAppSelector`/`useAppDispatch` from `src/store/hooks.ts`.
- Assets from Figma land in `frontend/public/images/` (cars, avatars, hero). Icons: lucide-react (shadcn default) — never bitmap icons when a lucide equivalent exists.
- Forms: react-hook-form + zod (zod v4 API). No separate `zod/v4` subpath needed.
- Toasts: `sonner` — call `toast.success("...")` / `toast.error("...")`; `<Toaster richColors closeButton />` already mounted in root layout.

## Backend conventions

- Express 5: async handlers throw; central error middleware returns `{ error }`. No try/catch noise in controllers.
- Prisma 7: client generated to `backend/src/generated/prisma` (generator `prisma-client`, output `../src/generated/prisma`), instantiated once in `src/lib/prisma.ts` with `PrismaPg` adapter. `prisma.config.ts` at backend root; env via `dotenv` (`.env` gitignored, `.env.example` committed).
- Routes: `src/routes/*.router.ts` → `src/controllers/*.controller.ts` → `src/services/*.service.ts`. Zod schemas in `src/validation/`, validated in a `validate` middleware.
- Auth: JWT (httpOnly cookie) + `requireRole("admin"|"advisor"|"mechanic"|"owner")` middleware.
- Every public API response shape MUST match the demo JSON shape so the frontend swap is seamless.
- API request bodies are sent RAW (no `{body: ...}` wrapper) — the `validate` middleware wraps internally. Demo accounts: admin@motorserve.com/admin123, john.doe@example.com/password123, alex.turner@motorserve.com/password123, sarah.jenkins@motorserve.com/password123.

## Type sync (frontend ↔ backend)

Two simple folders — no shared package. When you change a type/schema on one side, update the mirror in the other side in the SAME task:
- `backend/src/types/` (Prisma model-derived) ↔ `frontend/src/types/` (hand-written mirrors).
- `backend/src/validation/` zod schemas ↔ `frontend/src/lib/schemas.ts` (subset used by client forms).

## Design reference (captured — do not re-fetch)

Canonical tokens:
- Primary: `#0052cc` · Primary-soft bg: `#eff6ff` · Text primary: `#111827` · Text secondary: `#6b7280` · Border: `#e5e7eb` · Page bg: `#f9fafb` · Cards: `#ffffff`
- Badges: warning `#ffc107` (amber pill w/ 10% bg), success/info pill styles per screen
- Radius: cards `rounded-[12px]` (owner side) / `rounded-[8px]` (staff side) — keep per-screen as designed
- Shadows: `0 1px 1.5px rgba(0,0,0,0.1), 0 1px 1px rgba(0,0,0,0.06)` (cards), `0 1px 1px rgba(0,0,0,0.05)` (subtle)
- Font: Inter (self-hosted via next/font), weights 400/500/600/700
- Sample entities (used across demo data): 2023 Ford F-150 `A9C-1234` gasoline 24,500 mi; 2022 Toyota Camry `XYZ-9876` hybrid 42,100 mi; customer John Doe; advisor Sarah Jenkins; job card #JC-1045; mechanic station "Main Bay / Station 04"; services: Oil Change $49.99/30min, Brake Service (2h), Tire Rotation $29.99/45min, Multi-Point Inspection $89.99/1h, Brake Pad Replacement, Full Synthetic Oil Change.
- Service status flow: `received → inspecting → repairing → testing → ready/completed`.

Screen node IDs + build status: see `blueprint.md` ("Screens" table). The two updated references are `193:1227` (Book Appointment) and `194:1716` (Repair Progress, re-skinned to canonical tokens).

## Don'ts

- Don't introduce a new major version of an existing dep.
- Don't put demo JSON under `src/` — it must stay in `public/demo/`.
- Don't build mobile-specific layouts unless the task says so (desktop-first; responsive later).
- Don't commit generated code (Prisma client, `.next`, `dist`) — it's gitignored.
- Don't run git commands unless explicitly asked.
