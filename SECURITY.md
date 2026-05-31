# Threat Model — Royal Taj RSVP System

## System Overview

| Property | Value |
|---|---|
| Architecture | Next.js 14 App Router (server + client components) |
| Data classification | PII (guest names, email, phone), event metadata |
| Deployment target | Vercel (serverless) + SQLite → PostgreSQL for production |
| Authentication | NextAuth.js JWT sessions (admin only) |
| Public surface | Guest RSVP form — unauthenticated |

## Architecture & Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  INTERNET                                                     │
│                                                               │
│   Guest browser ──QR code──► /rsvp/[slug]                   │
│         │                         │                          │
│         │                    POST /api/rsvp                  │
│         │                    (public, rate-limited)          │
│         │                         │                          │
│   Admin browser ──login──► /admin/* (session-gated)         │
│         │                         │                          │
│         │                    /api/admin/* (JWT session)      │
│         │                         │                          │
├─────────┼─────────────────────────┼──────────────────────────┤
│  SERVER │                         │                          │
│         └────────────────► Prisma ORM ──► SQLite / PG       │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Trust boundaries:
  TB1: Internet → Public RSVP API  (rate limit, Zod validation)
  TB2: Internet → Admin UI          (NextAuth session, bcrypt)
  TB3: Admin UI → Admin API         (JWT session cookie, CSRF via SameSite)
  TB4: Application → Database       (Prisma parameterised queries)
```

## STRIDE Analysis

| Threat | Component | Likelihood | Impact | Risk | Mitigation |
|---|---|---|---|---|---|
| **Spoofing** — credential brute-force | `/api/auth/callback/credentials` | Med | Critical | **High** | Login rate limiting (10 req/15 min per email) |
| **Spoofing** — session token theft | JWT cookie | Low | Critical | Med | `httpOnly`, `secure`, `sameSite=lax`; 8h expiry |
| **Tampering** — RSVP data injection | `POST /api/rsvp` | High | Med | **High** | Zod schema validation on all fields |
| **Tampering** — overbooking race | RSVP create path | Med | High | **High** | Prisma transaction with capacity re-check |
| **Tampering** — cross-event table assign | `PATCH /api/admin/rsvps/:id` | Low | Med | Med | Ownership check before update |
| **Repudiation** — admin action dispute | Table/RSVP mutations | Med | Med | Med | Audit log of all admin mutations |
| **Info Disclosure** — unhandled Prisma errors | All API routes | Med | Med | Med | Global error handler returning generic messages |
| **Info Disclosure** — PII in URL params | RSVP success redirect | Low | Low | Low | Move to POST/session or opaque token |
| **Info Disclosure** — missing security headers | All responses | High | Med | **High** | CSP, HSTS, X-Frame-Options, etc. |
| **Denial of Service** — RSVP spam | `POST /api/rsvp` | High | Med | **High** | Rate limit (upgrade to persistent store in prod) |
| **Denial of Service** — login flood | Admin login | Med | High | **High** | Login rate limit per email + IP |
| **Elevation of Privilege** — unauthenticated admin access | `/admin/*` routes | Low | Critical | Med | Layout-level session guard + per-route API check |
| **Elevation of Privilege** — clickjacking admin | Admin UI | Med | High | Med | `X-Frame-Options: DENY` |

## Attack Surface

### External (unauthenticated)
- `GET /rsvp/[eventSlug]` — public RSVP form
- `POST /api/rsvp` — RSVP submission (rate-limited, Zod-validated)
- `GET /admin/login`, `POST /api/auth/callback/credentials` — login

### Protected (session required)
- `GET/POST /api/admin/events`
- `GET/PATCH/DELETE /api/admin/events/[id]`
- `POST/DELETE /api/admin/tables`
- `POST/DELETE /api/admin/zones`
- `PATCH/DELETE /api/admin/rsvps/[id]`
- `GET/POST /api/admin/venues`
- `PATCH/DELETE /api/admin/venues/[id]`

### Data at rest
- SQLite file (`dev.db`) — not committed; excluded by `.gitignore`
- Production: PostgreSQL with TLS in transit

## Sensitive Data Inventory

| Data | Where stored | Classification |
|---|---|---|
| Guest name | RSVP table | PII |
| Guest email | RSVP table | PII |
| Guest phone | RSVP table | PII |
| Pickup location | RSVP table | PII |
| Admin password hash (bcrypt) | Admin table | Credential |
| NEXTAUTH_SECRET | Environment variable | Secret |
| DATABASE_URL | Environment variable | Secret |

## Residual Risks & Recommendations

| Risk | Recommendation | Priority |
|---|---|---|
| In-memory rate limit reset on cold start | Migrate to Upstash Redis for persistent rate limiting | P1 before launch |
| No MFA for admin | Add TOTP (e.g. `otplib`) to admin login | P1 before launch |
| Single admin account | Add role-based multi-admin support for larger teams | P2 |
| PII in RSVP success URL | Replace query params with a short-lived token or session | P2 |
| No audit log of admin actions | Implement append-only audit log table | P2 |
| SQLite not suitable for concurrent prod load | Migrate to PostgreSQL before any multi-user event | P0 |
