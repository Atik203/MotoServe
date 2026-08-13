# MotoServe — Blueprint

Source of truth for screens, design references, build status, and data model. Agents: read this + `AGENTS.md`, cache both, extend "Design notes" per screen instead of re-fetching Figma.

## Stakeholders & permissions

| Role | Capabilities |
|---|---|
| **Admin** | Manage service types & prices · manage advisors/mechanics · income & workload reports · verify owner accounts |
| **Service Advisor** | Receive vehicles · create job cards · assign mechanics · send cost estimates · chat with owners |
| **Mechanic** | See assigned task cards · update repair progress + parts used · mark jobs completed |
| **Vehicle Owner** | Register vehicles · book appointments · approve/reject estimates · track service status · pay + download invoice · rate service |
| **Guest** | Browse services, prices, workshop info |

Status flow: `received → inspecting → repairing → testing → ready/completed`

## Tech stack (pinned — do not bump majors without asking)

- Frontend: Next.js 16.3.0 · React 19.2.8 · Tailwind CSS 4.3.3 (CSS-first `@theme`, no tailwind.config.js) · shadcn/ui (CLI 4.x) · @reduxjs/toolkit 2.12.0 + react-redux · lucide-react · sonner 2.0.8 · react-hook-form + Zod 4.4.3 · pnpm
- Backend: Express 5.2.1 · Prisma 7.9.1 + @prisma/adapter-pg · PostgreSQL · Zod 4.4.3 · jsonwebtoken + bcryptjs · socket.io · pdfkit (later)
- Node 24 LTS · TypeScript strict · Inter font · brand blue `#0052cc`

## Folder layout

```
frontend/   Next.js app  ->  src/app/(public) (auth) (owner) (advisor) (mechanic) (admin)
                            src/components/{ui,layout,roles} · src/store · src/lib · src/types · src/hooks
                            public/demo/*.json · public/images/
backend/    Express API  ->  src/{routes,controllers,services,middleware,validation,types,lib} · prisma/{schema.prisma,seed.ts} · prisma.config.ts
```

## Design tokens (canonical — captured, do not re-fetch)

- Primary `#0052cc` · Primary-soft `#eff6ff` · Text `#111827` / `#6b7280` · Border `#e5e7eb` · Page bg `#f9fafb` · Card `#ffffff`
- Warning badge: `#ffc107` on 10% amber bg · Success: green pill per screen
- Radius: owner-side cards `12px`, staff-side cards `8px`, pills `9999px`
- Card shadow: `0 1px 1.5px rgba(0,0,0,0.1), 0 1px 1px rgba(0,0,0,0.06)` · subtle: `0 1px 1px rgba(0,0,0,0.05)`
- Sidebar 256px · Topbar 64px · active nav item = `#0052cc` bg, white text, radius 6px; single shared `AppSidebar`/`AppTopbar` system for ALL roles — nav items per role in `src/lib/nav.ts` (owner/advisor/mechanic/admin), active state derived from `usePathname`. No profile card in sidebar (any role) — identity lives in the topbar.
- **UserMenu** (`src/components/layout/UserMenu.tsx`): 32px circular avatar (photo or initials) top-right in every role topbar + public navbar when logged in. Click → dropdown: name/email/role header, Dashboard (role home), Profile (`/profile`), Logout. Logout calls `POST /auth/logout` then navigates to `/login`.
- **Profile page** `/profile`: shared client layout that renders `AppShell` with the logged-in user's role; proxy-gated (auth required). Edit name/phone via `PATCH /auth/me`; shows role/station/specialization.
- **Owner verification docs**: registration "Identity Verification" dropzone uploads JPG/PNG/PDF (≤5MB) via **S3 presigned PUT** (browser → S3 directly, no server round-trip); keys `MotoServe/docs/{userId}/{uuid}-{name}` (private bucket `scholar-flow-uploads`); `documentUrl` stores the key. Admin detail `/admin/verifications/[id]` fetches a 15-min **presigned GET** per view and renders image/PDF inline. `GET /customers` selects safe fields (no passwordHash). Demo doc `backend/prisma/demo-nid.png` is uploaded to `MotoServe/demo/demo-nid.png` by the seed (best-effort, skips without AWS creds).
- **Payments (Stripe)**: card → `POST /api/payments/checkout` → hosted Stripe Checkout session (invoice total in USD) → redirect; webhook `checkout.session.completed` (signature-verified, raw body before JSON parser) creates the Payment row + marks invoice PAID. Success/cancel return to `/dashboard/payments?status=…`. Mobile/cash keep the dummy `payInvoice` flow.
- Admin dashboard accents: green `#4caf50` (positive delta), amber `#ffc107` (warning delta), red `#ba1a1a` (negative delta), each on 10% bg pill; border `#e2e8f0`; headings 20px semibold.
- Inter 400/500/600/700; headings bold 14px uppercase w/ 0.35px tracking (owner side sections)

## Demo data (public/demo/)

| File | Contents | Used by |
|---|---|---|
| `services.json` | service types: name, category, basePrice, durationMins, description | Services, Book Appointment, Add/Edit Service |
| `vehicles.json` | owner vehicles: make, model, year, regNo, fuelType, mileage, image | Owner Dashboard, Book Appointment, Register Vehicle |
| `appointments.json` | date, time, vehicleId, serviceIds, status (pending/confirmed) | Book Appointment, Confirmation, Advisor Dashboard |
| `jobs.json` | job cards: id (JC-1045), vehicle, customer, advisor, mechanic, station, priority, status, progress | Mechanic Dashboard, Repair Progress, Receive Vehicle, Admin |
| `parts.json` | parts: name, qty, unitPrice, supplier, stock | Parts Used, Create Job Card |
| `employees.json` | advisors & mechanics: name, role, specialization, station, workload | Assign Mechanic, Employee Management, Dashboards |
| `customers.json` | owners: name, phone, email, nid, drivingLicense, status (pending/approved) | Verification, Receive Vehicle, Communication |
| `estimates.json` | estimate id, jobId, items, total, status (pending/approved/rejected) | Send Estimate, Estimate Approval |
| `invoices.json` | invoice id, jobId, items, labor, parts, tax, total, paid | Payment & Invoice, Service History |
| `messages.json` | chat: thread (owner+advisor), sender, text, time | Communication Center |
| `ratings.json` | rating, review, serviceId, date | Service History, Testimonials |
| `kpis.json` | dashboard cards per role: label, value, delta, icon | All dashboards |
| `reports.json` | revenue by month, workload per mechanic, activity log | Management & Reports, Workload Reports |
| `testimonials.json` | name, vehicle, rating, review, avatar | Testimonials |
| `faqs.json` | question, answer | FAQ |
| `pricing.json` | price tables + plan highlights | Pricing |

## Screens & build status

All desktop (1280px). Design fetch per screen: `figma-desktop_get_design_context` with the node ID, then distill into "Design notes" below. Status: `✅ done` `🔨 building` `✅ pending`.

| # | Screen | Route | Figma node | Status |
|---|---|---|---|---|
| 1 | Home | `/` | `1:5897` | ✅ |
| 2 | Services | `/services` | `17:5640` | ✅ |
| 3 | Pricing | `/pricing` | `17:4635` | ✅ |
| 4 | Testimonials | `/testimonials` | `17:4427` | ✅ |
| 5 | FAQ | `/faqs` | `17:5169` | ✅ |
| 6 | Login | `/login` | `1:6130` | ✅ |
| 7 | Register (owner) | `/register` | `1:6272` | ✅ |
| 8 | Forgot Password | `/forgot-password` | `1:6963` | ✅ |
| 9 | Owner Account Registration | `/register/owner` | `185:1338` | ✅ |
| 10 | Owner Verification & Approval | `/admin/verifications` | `185:1628` | ✅ |
| 11 | Owner Dashboard | `/dashboard` | `1:6484` | ✅ |
| 12 | Register Vehicle | `/dashboard/vehicles/new` | `1:7026` | ✅ |
| 13 | Book Appointment | `/dashboard/appointments/book` | `193:1227` (updated) | ✅ |
| 14 | Appointment Confirmation | `/dashboard/appointments/confirmation` | `1:4759` | ✅ |
| 15 | Service Tracking | `/dashboard/services/track` | `1:4318` | ✅ |
| 16 | Service Details | `/dashboard/services/[id]` | `1:4047` | ✅ |
| 17 | Estimate Approval | `/dashboard/estimates/[id]` | `1:3848` | ✅ |
| 18 | Communication Center (owner) | `/dashboard/chat` | `1:1530` (shared) | ✅ |
| 19 | Payment & Invoice | `/dashboard/payments` | `12:1177` | ✅ |
| 20 | Service History & Rating | `/dashboard/history` | `12:1610` (dupe `110:2` — verify) | ✅ |
| 21 | Advisor Dashboard | `/advisor` | `1:2936` | ✅ |
| 22 | Receive Vehicle | `/advisor/receive` | `1:2641` | ✅ |
| 23 | Create Job Card | `/advisor/job-cards/new` | `14:2006` | ✅ |
| 24 | Assign Mechanic | `/advisor/job-cards/assign` | `14:2306` | ✅ |
| 25 | Send Estimate | `/advisor/estimates/new` | `1:2140` | ✅ |
| 26 | Mechanic Dashboard | `/mechanic` | `1:157` | ✅ |
| 27 | Repair Progress | `/mechanic/jobs/[id]` | `194:1716` (updated) | ✅ |
| 28 | Admin Dashboard | `/admin` | `1:773` | ✅ |
| 29 | Management & Reports | `/admin/reports` | `1:1238` | ✅ |
| 30 | Add / Edit Service | `/admin/services/new` | `15:2638` | ✅ |
| 31 | Employee Management | `/admin/employees` | `15:3005` | ✅ |
| 32 | Add Service Advisor | `/admin/employees/advisors/new` | `183:402` | ✅ |
| 33 | Add Mechanic | `/admin/employees/mechanics/new` | `183:2` | ✅ |
| 34 | Workload Reports | `/admin/reports/workload` | `184:731` | ✅ |
| 35 | My Vehicles (list) | `/dashboard/vehicles` | — (no Figma ref) | ✅ |
| 36 | My Appointments (list) | `/dashboard/appointments` | — (no Figma ref) | ✅ |
| 37 | My Estimates (list) | `/dashboard/estimates` | — (no Figma ref) | ✅ |
| 38 | Service Tracking (list) | `/dashboard/services` | — (no Figma ref) | ✅ |
| 39 | Mechanic Jobs (list) | `/mechanic/jobs` | — (no Figma ref) | ✅ |
| 40 | Mechanic History | `/mechanic/history` | — (no Figma ref) | ✅ |
| 41 | Parts Inventory | `/mechanic/parts` | — (no Figma ref) | ✅ |
| 43 | Reset Password | `/reset-password` | — (no Figma ref) | ✅ |
| 44 | Profile (all roles) | `/profile` | — (no Figma ref) | ✅ |
| 45 | Owner Verification Detail | `/admin/verifications/[id]` | — (no Figma ref) | ✅ |

## Design notes (captured per screen — extend, don't re-fetch)

### 13 · Book Appointment — `193:1227` (updated reference)
- Shell: 256px sidebar (brand row "MotoServe", nav: Dashboard / My Vehicles / **Appointments (active)** / Service History, bottom: Support / Settings), 64px topbar (search "Search vehicles, services..." + bell w/ red dot + 32px avatar), page bg `#f9fafb`, content p-24.
- Header: breadcrumb `Dashboard › Book Appointment` + outline button "Appointment Help" (16px icon + "Appointment Help").
- Left col (7/12): **SELECT VEHICLE** section — 256px vehicle cards (photo top 96px, "Selected" pill `#0052cc` top-left when active, name, Reg/Year/Fuel/Mileage rows 12px `#6b7280`); active = `#eff6ff` bg + 2px `#0052cc` border; inactive = white + `#e5e7eb`; third = dashed "Add New Vehicle" tile (soft-blue 32px circle with `+`).
- **CHOOSE SERVICES**: search input w/ icon, filter pills (All active `#eff6ff`/`#0052cc`; Maintenance, Repairs, Inspections outline `#d1d5db`), 2-col grid of service cards: 40px icon circle `#eff6ff` (selected: white + shadow), bold name 14px, `⏱ 45 mins` + `from $29.99` (bold). Selected card: `#eff6ff` + 2px `#0052cc` + check icon top-right.
- Assets captured: `imgUserAvatar`, `imgFordF150`, `imgToyotaCamry` + ~26 svg icons (nav, search, clock, check, bell) at `http://localhost:3845/assets/<hash>` → download into `public/images/`.
- Right col (5/12) — re-fetch `193:1279` subtree at build time if needed.

### 27 · Repair Progress — `194:1716` (updated reference, re-skinned to canonical)
- Shell: 280px sidebar (profile card "Main Bay / Station 04" + avatar, nav Current Jobs/History/Parts Request/**Repair Progress active**/Diagnostic Tools/Workshop Chat, bottom Help/Logout/Clock Out btn), topbar links Jobs/Schedule/Inventory/Team + bell/chat/avatar. Page bg `#f8f9fa`→ canonical `#f9fafb`.
- Title "Repair Progress" + amber pill **HIGH PRIORITY** (10% `#ffc107`, uppercase 16px, tracking 0.8px).
- Job summary card (12col): Vehicle 2023 Ford F-150 · Customer John Doe · Job Card #JC-1045 (blue) · Advisor Sarah Jenkins; labels `#64748b`→`#6b7280`, values bold.
- Progress timeline card: "Status" title; 5 steps (Received ✓ / Inspecting ✓ / Repairing active / Testing / Completed) with 32px circles on a 4px track; done = primary blue + white check; active = blue + glow ring `0 0 0 4px rgba(0,68,146,0.2)`; pending = `#e1e3e4`; active label bold.
- **Mechanic Notes**: timestamped note cards (`#f3f4f5`, time + kebab, 16px text) + 136px textarea "Enter detailed repair notes..." + right-aligned primary "Save Note" button.
- **Parts Used** table: columns PART NAME / QTY / UNIT PRICE / SUPPLIER / SUBTOTAL (right), header 16px uppercase `#6b7280`, rows 16px `#111827`, zebra borders `#e5e7eb`; + Add Part button.
- Right col: repair photos upload grid (2×2 tiles) + action buttons — re-fetch subtree at build time.

### 9 · Owner Account Registration — `185:1338` (implemented at `/register`)
- Split card: 460px left value-prop column (`#f3f4f5`, blue/orange blurred blobs, workshop photo) + right form column (48px padding).
- Sections: **Personal Information** (profile photo upload tile, Full Name/Email/Phone/Password/Confirm (all required, red `*`), DOB `mm/dd/yyyy`, Gender select, NID*, Driving License*, Occupation) → **Address Information** (Street*, City*, District/State*, Zip, Country) → **Emergency Contact** (UI-only) → **Identity Verification** (upload dropzone, UI-only).
- Inputs: h-46px, rounded-md, border `#c2c6d5`, bg `#f8f9fa`, left icon at 15px. Submit → `registerUser` (full profile persisted; owner created PENDING → admin verification).

### 35–43 · List/tool screens (no Figma refs — built to canonical tokens)
- Owner lists reuse card/table patterns: vehicles grid (photo, reg plate, in-service pill, Book Service/History actions), appointments rows (status pills pending/confirmed/cancelled + cancel action via `PATCH /appointments/:id`), estimates grid (status pill, top-3 items, total, Review link), services list (ProgressStepper sm + StatusBadge, links to `/dashboard/services/[id]`).
- Mechanic: jobs list (assigned, current first), history table (completed), parts inventory (from `GET /parts`, stock pills In/Low/Out), diagnostics (simulated scan modules — engine/battery/brakes/full sweep, toast results, clear codes).

### 21 · Advisor Dashboard — `1:2936` (capture at build)

### 26 · Mechanic Dashboard — `1:157`
- Shell: 256px sidebar (Current Jobs active) + 64px topbar, content `#f9fafb`, p-32, max-w 1280.
- Header: "Good Morning, Alex" 24px semibold + sub "Main Bay / Station 04 • 12 active jobs today" 14px `#64748b`; right "Today, Aug 12" 12px semibold w/ calendar icon.
- KPI row: 4 cards (grid-cols-4, h-104, p-17, rounded-8) from `kpis.json` `mechanic` — Assigned Jobs 12 / In Progress 5 / Awaiting Parts 8 / Completed Today 2; 32px tinted icon chip (blue/amber/brown/green at 10%), label 14px `#64748b`, value 32px bold, delta 12px pill (green up / amber flat).
- Assigned Tasks card: rows show 48px primary-soft wrench chip, vehicle 14px semibold, "Plate <regNo> • <service>" 12px, StatusBadge + PriorityPill, View Details (outline, → /mechanic/jobs/{id}) + Update Progress (primary-soft). Jobs = mechanic emp-002 (JC-1045, JC-1043) + JC-1044.
- Parts Used Today: JC-1045 partsUsed table (Part Name/Qty/Unit Price/Status) with green "In Stock" pill.
- Quick Actions: 2×2 `#f8f9fa` tiles — Repair Progress→/mechanic/jobs, Parts Request, Diagnostic Tools (toast), Workshop Chat→/mechanic/chat.
- Current Repair Progress: vertical 5-step timeline from active job (JC-1045); done = blue circle + white check, active = blue-ringed dot, pending gray, 2px left rail; "View full timeline" → job page.

## Database entities (backend phase)

`User` (role enum: admin/advisor/mechanic/owner; verification fields for owners) · `Vehicle` (ownerId, make, model, year, regNo, fuelType, mileage, photo) · `Service` (name, category, basePrice, durationMins, description, active) · `Appointment` (ownerId, vehicleId, date, time, status) · `JobCard` (appointmentId?, vehicleId, customerId, advisorId, mechanicId, station, priority, status, notes, totalEstimate) · `JobStatusLog` (timeline steps + timestamps) · `Part` (name, sku, unitPrice, supplier, stock) · `PartsUsed` (jobCardId, partId, qty, unitPriceAtSale) · `Estimate` (jobCardId, items, total, status, sentAt, decidedAt) · `Payment` (jobCardId, amount, method, status, paidAt) · `Invoice` (paymentId, number, line items, tax, total, pdfUrl) · `Message` (thread, senderRole, text, createdAt) · `Rating` (jobCardId, ownerId, score, review) · `Testimonial` (approved showcase of rating) · `AuditLog` (admin/advisor activity for reports)

## Roadmap

- **Phase 0** ✅ scaffold root docs + configs + frontend/backend shells
- **Phase 1** ✅ frontend demo-data UI (all 35 screens, batches A–F, desktop-first)
- **Phase 2** ✅ backend: Prisma schema+seed → auth → REST endpoints (auth/services/vehicles/appointments/jobs/employees/estimates/invoices/chat/parts/ratings/reports) → frontend RTK swap (all non-marketing pages on live API) → socket.io chat → jspdf PDFs
- **Phase 3** ✅ route protection (Next 16 `proxy.ts` role guard + client fallback), real logout, API-backed forms (employee CRUD, forgot/reset password, register profile fields, create job card, appointment confirm/cancel), hardcoded-key cleanup, public navbar auth-aware
- **Phase 4** ✅ missing sidebar pages (owner vehicles/appointments/estimates/services lists; mechanic jobs/history/parts/diagnostics)
- **Phase 5** ✅ polish: /health db check, ratings role-scoping, missing assets (honda-civic, repair-photos, 3 avatars), blueprint update
- **Phase 6** ✅ dynamic overhaul: chat redesign (per-party unread + shared CommunicationCenter + new-conversation), job→invoice auto-generation, advisor dashboard real schedule/estimates/messages, admin employee/service edit dialogs + CSV exports, owner rating flow + history details, receive job selector, repair photos via S3, vehicle edit/delete

## API conventions (backend)

- Base URL `http://localhost:4000/api` · JSON bodies sent raw (the `validate` middleware wraps them internally — do NOT send `{body: ...}` wrappers).
- Auth: JWT in httpOnly cookie `motoserve_token` (login sets it; `credentials: "include"` on the frontend).
- Roles enforced per route (`requireRole`); 401 unauthenticated / 403 forbidden.
- Demo accounts: `admin@motorserve.com / admin123` · `john.doe@example.com / password123` (owner) · `alex.turner@motorserve.com / password123` (mechanic) · `sarah.jenkins@motorserve.com / password123` (advisor).
