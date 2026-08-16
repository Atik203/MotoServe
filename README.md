<div align="center">

<img src="frontend/public/images/hero-car.png" alt="MotoServe" width="100" />

# MotoServe

### Vehicle Workshop & Servicing Management System

[![Live App](https://img.shields.io/badge/Live_App-blue?style=for-the-badge&logo=vercel&logoColor=white&labelColor=0052cc)](https://motoserve-web.vercel.app)
[![API](https://img.shields.io/badge/API-docs-green?style=for-the-badge&logo=fastapi&logoColor=white&labelColor=16a34a)](https://motoserve-api.vercel.app/api/health)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&labelColor=eab308)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge&labelColor=22c55e)](CONTRIBUTING.md)
[![Issues](https://img.shields.io/github/issues/atik203/motoserve?style=for-the-badge&labelColor=0052cc)](https://github.com/atik203/motoserve/issues)
[![Stars](https://img.shields.io/github/stars/atik203/motoserve?style=for-the-badge&color=fbbf24&labelColor=f59e0b)](https://github.com/atik203/motoserve/stargazers)

---

Customers book appointments, track repairs, and pay online — advisors receive vehicles and dispatch mechanics — mechanics update repair progress in real-time — admins manage everything.

<br />

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## Overview

MotoServe is a full-stack vehicle workshop management platform connecting four user roles in real-time:

| Role | What They Do |
|---|---|
| **Owner** | Register vehicles, book appointments, approve estimates, track repairs, pay & download invoices, rate service |
| **Advisor** | Receive vehicles, create job cards, assign mechanics, send cost estimates, chat with owners |
| **Mechanic** | View assigned tasks, update repair progress, log parts used, mark jobs complete |
| **Admin** | Manage services & pricing, manage employees, view reports & analytics, verify owner accounts |
| **Guest** | Browse services, pricing, and workshop info |

## Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · shadcn/ui · Redux Toolkit · Zod |
| **Backend** | Express 5 · Prisma 7 · PostgreSQL · Zod · JWT · Socket.io |
| **Payments** | Stripe Checkout (card) |
| **Storage** | AWS S3 (presigned URLs) |
| **Deploy** | Vercel (frontend + backend) |
| **Tooling** | TypeScript strict · pnpm 11.x · Node 24 LTS |

## Quick Start

**Prerequisites:** Node 24 LTS, pnpm 11.x, PostgreSQL running

```bash
# Clone the repo
git clone https://github.com/atik203/motoserve.git
cd motoserve

# Install dependencies
cd frontend && pnpm install
cd ../backend && pnpm install

# Set up environment
cd ../backend
cp .env.example .env        # edit DATABASE_URL

# Initialize database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Start development
cd ../frontend && pnpm dev   # http://localhost:3500
cd ../backend  && pnpm dev   # http://localhost:4000
```

## Project Structure

```
motoserve/
├── frontend/                 # Next.js 16 app (port 3500)
│   ├── src/
│   │   ├── app/              # App Router routes by role
│   │   │   ├── (public)/     # Marketing pages
│   │   │   ├── (auth)/       # Login, register, forgot password
│   │   │   ├── (owner)/      # Vehicle owner dashboard
│   │   │   ├── (advisor)/    # Service advisor dashboard
│   │   │   ├── (mechanic)/   # Mechanic dashboard
│   │   │   └── (admin)/      # Admin dashboard
│   │   ├── components/       # Shared UI components
│   │   ├── store/            # Redux Toolkit slices
│   │   ├── lib/              # Utilities, API client, schemas
│   │   ├── types/            # TypeScript type definitions
│   │   └── hooks/            # Custom React hooks
│   └── public/demo/          # Static demo data (JSON)
│
├── backend/                  # Express 5 API (port 4000)
│   ├── src/
│   │   ├── modules/          # Feature modules (auth, jobs, etc.)
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── lib/              # Prisma client, auth, socket
│   │   └── types/            # TypeScript types
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── seed.ts           # Demo data seeder
│
├── AGENTS.md                 # AI coding agent instructions
├── blueprint.md              # Screen list, design tokens, roadmap
└── README.md
```

## Scripts

| Command | Frontend | Backend |
|---|---|---|
| **Dev** | `pnpm dev` | `pnpm dev` |
| **Build** | `pnpm build` | `pnpm build` |
| **Start** | `pnpm start` | `pnpm start` |
| **Lint** | `pnpm lint` | — |
| **Typecheck** | `pnpm typecheck` | `pnpm typecheck` |
| **DB Generate** | — | `pnpm db:generate` |
| **DB Migrate** | — | `pnpm db:migrate` |
| **DB Seed** | — | `pnpm db:seed` |

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@motorserve.com` | `admin123` |
| Owner | `john.doe@example.com` | `password123` |
| Advisor | `sarah.jenkins@motorserve.com` | `password123` |
| Mechanic | `alex.turner@motorserve.com` | `password123` |

## Features

- **40+ screens** — fully built and responsive
- **Real-time chat** — owner-advisor messaging with unread counters
- **Stripe payments** — secure card checkout for invoices
- **Role-based routing** — middleware-protected dashboards
- **S3 file uploads** — presigned URLs for vehicle images & documents
- **PDF generation** — invoices, estimates, and appointment receipts
- **Job lifecycle** — received → inspecting → repairing → testing → ready
- **Analytics** — client-side KPIs, workload reports, revenue charts

## Documentation

| File | Description |
|---|---|
| [`blueprint.md`](blueprint.md) | Screen list, Figma node IDs, design tokens, database schema, roadmap |
| [`AGENTS.md`](AGENTS.md) | Coding conventions and context rules for AI agents |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute, PR process, code style |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting policy |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Community guidelines |
| [`CHANGELOG.md`](CHANGELOG.md) | Release history and notable changes |

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on:

- Forking & branching workflow
- Commit message conventions
- PR requirements and review process
- Code style and linting rules

## Security

To report a vulnerability, see [`SECURITY.md`](SECURITY.md). **Do not** open a public GitHub issue for security-related concerns.

## License

This project is licensed under the **MIT License** — see [`LICENSE`](LICENSE) for details.

---

<div align="center">

**Built with care for the automotive service industry**

[![Vercel](https://img.shields.io/badge/Powered_by_Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

</div>
