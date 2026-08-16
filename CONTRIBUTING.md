# Contributing to MotoServe

Thank you for your interest in contributing to MotoServe! This guide covers everything you need to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Project Conventions](#project-conventions)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior by opening an issue.

## Getting Started

### Prerequisites

- **Node 24 LTS**
- **pnpm 11.x** (`npm install -g pnpm`)
- **PostgreSQL** running locally or a remote connection string
- **Git**

### Setup

1. **Fork** the repository on GitHub.

2. **Clone** your fork:
   ```bash
   git clone https://github.com/atik203/motoserve.git
   cd motoserve
   ```

3. **Install dependencies**:
   ```bash
   cd frontend && pnpm install
   cd ../backend && pnpm install
   ```

4. **Configure the backend**:
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env — set DATABASE_URL, JWT_SECRET, etc.
   ```

5. **Initialize the database**:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

6. **Start the dev servers**:
   ```bash
   # Terminal 1 — Frontend
   cd frontend && pnpm dev    # http://localhost:3500

   # Terminal 2 — Backend
   cd backend && pnpm dev     # http://localhost:4000
   ```

7. **Verify** everything works by visiting `http://localhost:3500`.

## Development Workflow

1. **Sync your fork** with the upstream:
   ```bash
   git remote add upstream https://github.com/atik203/motoserve.git
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Make your changes**, following the code style and conventions below.

4. **Test your changes**:
   ```bash
   # Frontend
   cd frontend && pnpm lint && pnpm typecheck && pnpm build

   # Backend
   cd ../backend && pnpm typecheck && pnpm build
   ```

5. **Commit** with a clear message (see [Commit Messages](#commit-messages)).

6. **Push** and open a Pull Request.

## Branch Naming

Use the following prefixes:

| Prefix | Purpose | Example |
|---|---|---|
| `feat/` | New feature | `feat/invoice-pdf-export` |
| `fix/` | Bug fix | `fix/appointment-date-validation` |
| `refactor/` | Code refactoring | `refactor/sidebar-navigation` |
| `docs/` | Documentation | `docs/api-endpoints` |
| `chore/` | Maintenance | `chore/update-dependencies` |
| `test/` | Tests | `test/job-card-service` |
| `style/` | Styling/cosmetic | `style/dashboard-cards` |

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `style` | Code style (formatting, semicolons, etc.) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, configs |
| `ci` | CI/CD configuration |

### Scope

Use the affected area:

- `frontend` — frontend-only changes
- `backend` — backend-only changes
- `api` — API route changes
- `db` — database schema changes
- `auth` — authentication/authorization
- `ui` — shared UI components

### Examples

```
feat(backend): add invoice PDF generation endpoint
fix(frontend): resolve appointment date picker timezone issue
docs(api): add swagger documentation for /jobs endpoint
refactor(auth): simplify JWT validation middleware
chore(deps): update prisma to 7.9.1
```

## Pull Request Process

### Before Opening a PR

- [ ] Your branch is up-to-date with `main`
- [ ] `pnpm lint` passes on both frontend and backend
- [ ] `pnpm typecheck` passes on both sides
- [ ] `pnpm build` succeeds on both sides
- [ ] You've tested the feature manually (if applicable)
- [ ] Database migrations are reversible and backward-compatible

### PR Template

When opening a PR, include:

1. **Title** — Concise description following commit message format
2. **Description** — What changed and why
3. **Screenshots/Recordings** — For UI changes
4. **Testing Steps** — How reviewers can verify
5. **Checklist** — Items above

### Review Process

1. At least **one maintainer** must approve
2. All CI checks must pass
3. No merge conflicts with `main`
4. Address review feedback within 48 hours

### After Approval

- Squash and merge for feature branches
- Delete the feature branch after merge

## Code Style

### General Rules

- **TypeScript strict mode** — no `any` types; use proper typing
- **No comments** in code unless explicitly requested
- **Follow existing conventions** — match the style of surrounding code
- **Keep changes focused** — one logical change per PR

### Frontend

- **React 19** patterns — prefer server components, use `"use client"` only when needed
- **shadcn/ui** components — use existing components from `src/components/ui/`
- **Tailwind CSS v4** — utility-first, no `tailwind.config.js`
- **Redux Toolkit** — one slice per domain, thunks for API calls
- **Zod schemas** — validate all form inputs and API responses

### Backend

- **Express 5** — async handlers that throw (no try/catch in controllers)
- **Prisma 7** — typed queries via `src/lib/prisma.ts`
- **Zod validation** — validate request bodies in middleware
- **Error handling** — central error middleware returns `{ error }`

### File Naming

| Type | Convention | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `JobCard.tsx` |
| Hooks | `camelCase.ts` | `useAuth.ts` |
| Utilities | `camelCase.ts` | `formatCurrency.ts` |
| Routes | `kebab-case.ts` | `job.routes.ts` |
| Services | `kebab-case.ts` | `job.service.ts` |
| Validation | `kebab-case.ts` | `job.validation.ts` |

## Project Conventions

- **Roles**: `admin`, `advisor`, `mechanic`, `owner`, `guest`
- **Status flow**: `received → inspecting → repairing → testing → ready/completed`
- **Brand color**: `#0052cc` (used for active states, CTAs, links)
- **Font**: Inter (self-hosted via `next/font`)
- **Demo data**: Lives in `frontend/public/demo/*.json` — never hardcode sample values
- **Types sync**: Keep `frontend/src/types/` and `backend/src/types/` in sync manually

## Reporting Bugs

1. **Check existing issues** first — avoid duplicates
2. **Use the bug report template** when available
3. **Include**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Browser/OS info
   - Screenshots if applicable

## Requesting Features

1. **Open a discussion** first for large features
2. **Describe the problem** the feature solves
3. **Propose a solution** if you have one
4. **Consider scope** — keep PRs focused and reviewable

---

Thank you for contributing to MotoServe! Every improvement matters.
