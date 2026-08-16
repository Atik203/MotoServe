# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Professional repository documentation (README, CONTRIBUTING, SECURITY, LICENSE, CODE_OF_CONDUCT, CHANGELOG)

## [0.1.0] - 2025-08-16

### Added

#### Frontend
- 40+ fully built screens across all user roles
- Owner dashboard with vehicle management, appointments, service tracking, estimates, chat, payments, and history
- Advisor dashboard with vehicle receiving, job card creation, mechanic assignment, and estimate sending
- Mechanic dashboard with assigned tasks, repair progress tracking, parts inventory, and diagnostics
- Admin dashboard with service management, employee management, reports, and owner verification
- Public marketing pages: home, services, pricing, testimonials, FAQs
- Authentication: login, register, forgot/reset password
- Role-based routing with middleware protection
- Real-time chat with unread counters (Socket.io + polling fallback)
- Stripe Checkout integration for invoice payments
- PDF generation for invoices, estimates, and appointments
- S3 presigned URL uploads for vehicle images and documents
- Profile page with user settings across all roles
- Responsive design (desktop-first, mobile-ready)

#### Backend
- Express 5 API with modular architecture
- Prisma 7 schema with PostgreSQL
- JWT authentication with HTTP-only cookies
- Role-based access control (admin, advisor, mechanic, owner)
- Full CRUD endpoints: auth, services, vehicles, appointments, jobs, estimates, invoices, employees, parts, ratings, reports
- S3 presigned URL generation for uploads
- Stripe webhook handling for payment confirmation
- Socket.io chat backend with per-party unread counters
- Input validation with Zod schemas
- Comprehensive seed data for demo accounts
- Health check endpoint with database connectivity test
- Audit logging for admin/advisor activity

#### Infrastructure
- Vercel deployment (frontend + backend)
- TypeScript strict mode throughout
- ESLint configuration
- CI-ready build scripts
- Environment variable management

### Security
- HTTP-only cookies for JWT storage
- bcryptjs password hashing
- CORS whitelist with origin validation
- Stripe webhook signature verification
- S3 private bucket with presigned URLs
- Input validation on all API endpoints

---

## Versioning

| Version | Description |
|---|---|
| `0.1.0` | Initial release with full feature set |
| `0.x.y` | Patch releases and bug fixes |
| `x.y.0` | Feature additions |

## Links

- [Repository](https://github.com/atik203/motoserve)
- [Live Frontend](https://motoserve-web.vercel.app)
- [Live API](https://motoserve-api.vercel.app/api)
