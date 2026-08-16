# Security Policy

## Reporting a Vulnerability

The MotoServe team takes security seriously. We appreciate your efforts to responsibly disclose any security vulnerabilities you find.

**Do NOT open a public GitHub issue for security-related concerns.**

### How to Report

If you discover a security vulnerability, please report it responsibly by emailing:

**[security@your-domain.com]** (replace with your actual security email)

Or use GitHub's private vulnerability reporting:

1. Go to the [Security](https://github.com/atik203/motoserve/security) tab
2. Click **"Report a vulnerability"**
3. Fill in the details and submit

### What to Include

Please provide as much information as possible:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass, etc.)
- **Location** — file path, URL, or endpoint affected
- **Steps to reproduce** — clear instructions to trigger the vulnerability
- **Impact** — what an attacker could achieve
- **Suggested fix** — if you have one (optional but helpful)

### What to Expect

- **Acknowledgment** within **48 hours** of your report
- **Status update** within **7 days** with our assessment
- **Resolution** timeline once confirmed
- **Credit** in the release notes (unless you prefer to remain anonymous)

## Scope

### In Scope

The following are considered in-scope for security reports:

- Authentication and authorization flaws
- SQL injection or database vulnerabilities
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)
- Remote code execution
- Privilege escalation
- Sensitive data exposure
- Insecure direct object references (IDOR)

### Out of Scope

The following are generally not considered security issues:

- Denial of service (DoS) attacks
- Social engineering (phishing, etc.)
- Physical attacks on infrastructure
- Issues in third-party dependencies (report to the dependency maintainers)
- Security issues requiring physical access to a user's device
- Self-XSS (payload only affects the attacker)
- Missing security headers that do not lead to a direct vulnerability

## Security Measures

MotoServe implements the following security practices:

### Authentication & Authorization

- **JWT tokens** with HTTP-only cookies for session management
- **Role-based access control** (RBAC) with four roles: admin, advisor, mechanic, owner
- **Password hashing** using bcryptjs
- **Token expiration** and refresh mechanisms

### Data Protection

- **Input validation** using Zod schemas on both frontend and backend
- **SQL injection prevention** via Prisma ORM parameterized queries
- **XSS protection** through React's default escaping and Content Security Policy
- **CORS configuration** with strict origin whitelisting

### API Security

- **Rate limiting** on authentication endpoints
- **Request validation** middleware on all API routes
- **Error handling** that does not leak internal details
- **Helmet.js** security headers

### File Upload Security

- **Presigned URLs** for direct S3 uploads (no server round-trip)
- **File type validation** on the client side
- **Size limits** enforced (5MB max for documents)
- **Private bucket** — no public access to uploaded files

### Payment Security

- **Stripe Checkout** for payment processing (PCI-compliant)
- **Webhook signature verification** for payment confirmations
- **No card data** touches our servers

## Dependencies

We regularly audit and update dependencies:

- Automated dependency updates via Dependabot (when configured)
- `pnpm audit` checks during CI/CD
- Prisma ORM for database query safety

## Best Practices for Contributors

When contributing, please follow these security guidelines:

1. **Never commit secrets** — API keys, passwords, tokens, etc. should never appear in code
2. **Use environment variables** — all secrets should be in `.env` (gitignored)
3. **Validate all inputs** — use Zod schemas for any user-provided data
4. **Sanitize outputs** — prevent XSS by escaping user content
5. **Use parameterized queries** — never construct raw SQL with user input
6. **Check authorization** — verify user permissions before sensitive operations
7. **Don't trust client-side validation alone** — always validate on the server

## Environment Variables

Ensure these sensitive values are never committed:

```bash
# .env (gitignored)
DATABASE_URL=          # PostgreSQL connection string
JWT_SECRET=            # JWT signing secret
STRIPE_SECRET_KEY=     # Stripe API key
STRIPE_WEBHOOK_SECRET= # Stripe webhook signing secret
AWS_ACCESS_KEY_ID=     # AWS access key
AWS_SECRET_ACCESS_KEY= # AWS secret key
AWS_BUCKET_NAME=       # S3 bucket name
```

## Compliance

While this is a demo/learning project, we follow security best practices aligned with:

- **OWASP Top 10** vulnerabilities
- **OWASP API Security Top 10**
- **CWE/SANS Top 25** most dangerous software weaknesses

## Updates

This security policy will be updated as needed. Last updated: August 2025.

---

Thank you for helping keep MotoServe and its users safe.
