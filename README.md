# Phylax

**See your queue. Know your capacity.**

Incident management for small teams, built by someone who spent 17 years in high-volume ITSM operations.

Phylax is a modern incident management system designed for 5–50 person teams who need real operational tooling without enterprise bloat. It draws on 17 years of Tier 2/3 consumer technical support operations at TELUS Communications — working daily with BMC Remedy, SLA-driven queues, escalation coordination, and incident lifecycle management — rebuilt from the ground up with Next.js, TypeScript, and PostgreSQL.

> Phylax (φύλαξ) — Greek for "guardian" or "watchman."

**Live Demo:** [phylax-7jth.vercel.app](https://phylax-7jth.vercel.app)
Use the "Fill Demo Credentials" button on the login page to sign in as admin.

---

## Why Phylax Exists

Enterprise ITSM platforms like Remedy and ServiceNow are powerful — but they're designed for organizations with dedicated admin teams and six-figure licensing budgets. Small teams end up choosing between spreadsheets and tools that were never built for incident management.

Phylax fills that gap: purpose-built incident management with queue intelligence, severity-aware triage, and AI-assisted workflows — all in a stack a single developer can deploy and maintain.

### Competitive Position

| Tool | Price | AI Features | Queue Intelligence |
|------|-------|-------------|-------------------|
| Spiceworks | Free (ads) | None | FIFO only |
| Startly | $15/seat/mo | None | ITIL-aligned |
| Freshservice | $19/agent/mo | Post-submission categorization | Priority-based |
| **Phylax** | **Free (self-hosted)** | **AI triage at intake + postmortem generation** | **SLA/P + FIFO toggle with Little's Law diagnostics** |

---

<!-- Add screenshots here -->
## Screenshots

| View | Screenshot |
|------|-----------|
| Login | ![Login](docs/screenshots/phylaxlogin.png) |
| Triage Queue | ![Queue](docs/screenshots/phylaxtriage.png) |
| Submit with AI Suggestion | ![Submit](docs/screenshots/phylaxsubmit.png) |
| Incident Detail | ![Detail](docs/screenshots/phylaxincident.png) |
| Dashboard with Little's Law | ![Dashboard](docs/screenshots/phylaxdashboard.png) |
| Settings | ![Settings](docs/screenshots/phylaxsettings.png) |

---

## Features

### Triage Queue with SLA/P and FIFO Sorting

Incidents are sorted by one of two configurable strategies, switchable at runtime from the settings page:

- **SLA/P (SLA Protection):** Severity-first sorting — P1s always surface to the top, with creation time as the tiebreaker within each level. This is outcome-oriented queue management derived from how high-performing operations teams actually work.
- **FIFO (First In, First Out):** Oldest incidents served first regardless of severity.

V2 roadmap: dynamic breach-risk scoring that re-ranks the queue based on SLA proximity — a P2 five minutes from breaching leapfrogs a P1 with three hours of headroom.

### AI-Powered Severity Suggestions

When an incident is created, the submitter can click "AI Suggest" to send the title and description to the Anthropic Claude API. Claude analyzes the incident and recommends a severity level (P1–P4) with reasoning. The user can accept, override, or ignore the suggestion — the AI assists the decision, it doesn't make it.

### AI-Generated Postmortems

Once an incident is resolved, admins and agents can generate a structured postmortem. The AI reads the full incident lifecycle — description, comments, status transitions, resolution notes — and produces: Summary, Timeline, Root Cause, Impact, Resolution, and Recommendations. No competitor at this price tier offers AI-generated postmortems.

### Little's Law Dashboard

The dashboard includes a real-time panel grounded in queueing theory. Using Little's Law (L = λW), it calculates:

- **L** — Average queue depth (Open + In Progress count)
- **λ** — Arrival rate (incidents per day)
- **W** — Average wait time (mean TTR in hours)
- **Predicted L** — λW, what queue depth *should* be if throughput matches demand

When actual L diverges from predicted L, the dashboard flags it — telling the team their queue is growing faster than they're resolving, before the backlog becomes unmanageable.

### Enforced State Machine

Incidents follow a strict lifecycle: **Open → In Progress → Resolved → Closed**, with a reopen path from Resolved back to In Progress. Invalid transitions are rejected at the API level with descriptive error messages. Resolution notes are required when resolving. `resolved_at` and `closed_at` timestamps are set automatically.

### Stale Incident Detection

Incidents that haven't been updated within a configurable threshold (default 48 hours) are flagged on the dashboard. Stale incidents are always sorted by severity regardless of queue strategy — ensuring critical tickets don't silently age in the queue.

### Role-Based Access Control

JWT authentication with bcrypt password hashing and three distinct roles:

- **Admin** — Full system access, settings management, all incident operations
- **Agent** — Incident assignment, triage, status transitions, comments, postmortem generation
- **Submitter** — Incident creation, commenting, and viewing only

Routes are protected at the API level with middleware that returns 401 (not authenticated) or 403 (insufficient permissions). The UI adapts to hide controls the user's role can't access — Settings is admin-only, StatusActions are hidden from submitters.

### Comments & Internal Notes

Every incident has a threaded comment system with timestamps and author attribution from the JWT token. Comments can be flagged as "Internal Notes" (visible to agents and admins only) for investigation details that shouldn't be shared with submitters.

### Audit Trail

Every field change is logged automatically: field name, old value, new value, who made the change, and when. The incident detail page displays this as a visual timeline. The `changed_by` field tracks the authenticated user's UUID, not a manually entered name.

### Configurable Settings

Admins can switch between SLA/P and FIFO queue strategies and adjust the stale incident threshold — all from the UI, stored in the database, effective immediately.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| Data Access | SQL via `pg` (no ORM) |
| Auth | JWT + bcrypt (role-based) |
| AI | Anthropic Claude SDK |
| Styling | Tailwind CSS v4 |
| API Testing | Jest (26 tests) |
| E2E Testing | Playwright (9 tests) |
| Deployment | Vercel + Railway PostgreSQL |

### Why SQL via pg?

Phylax uses SQL via the `pg` library intentionally — no Prisma, no Drizzle, no Sequelize. Incident management involves queue sorting, SLA calculations, time-window aggregations, and Little's Law computations where you need to see exactly what query is hitting the database. Writing SQL directly means the data access layer is transparent and the queries are optimized for the actual access patterns, not generated by an abstraction.

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts        POST — authenticate, return JWT
│   │   │   └── register/route.ts     POST — create user with bcrypt hash
│   │   ├── incidents/
│   │   │   ├── route.ts              POST (create) + GET (list with SLA/P or FIFO sort)
│   │   │   └── [id]/
│   │   │       ├── route.ts          GET (single) + PATCH (state machine + audit trail)
│   │   │       ├── history/route.ts  GET — chronological audit trail
│   │   │       └── comments/route.ts GET + POST — threaded comments with internal notes
│   │   ├── ai/
│   │   │   ├── suggest-severity/route.ts  POST — Claude severity recommendation
│   │   │   └── postmortem/route.ts        POST — Claude postmortem generation
│   │   ├── settings/route.ts         GET + PATCH — admin-only configuration
│   │   └── health/route.ts           GET — database connection check
│   ├── login/page.tsx                Login/register with recruiter demo credentials
│   ├── submit/page.tsx               Incident creation with AI severity suggestion
│   ├── queue/page.tsx                Triage queue (server component, direct DB query)
│   ├── incidents/[id]/
│   │   ├── page.tsx                  Incident detail (server component)
│   │   ├── StatusActions.tsx         Assignment, severity, transitions (client component)
│   │   ├── Comments.tsx              Comment thread (client component)
│   │   └── Postmortem.tsx            AI postmortem generation (client component)
│   ├── dashboard/page.tsx            Stats, Little's Law, stale detection (server component)
│   ├── archive/page.tsx              Resolved/Closed incidents with TTR (server component)
│   └── settings/page.tsx             Queue strategy + threshold config (client component)
├── components/
│   └── Nav.tsx                       Role-aware navigation with active states
├── lib/
│   ├── db.ts                         PostgreSQL connection pool
│   ├── auth.ts                       JWT middleware (getUser, requireAuth, requireRole)
│   ├── api.ts                        authFetch helper — attaches JWT to all API calls
│   └── AuthContext.tsx                React context for client-side auth state
└── db/
    ├── schema.sql                    Initial migration (incidents table + ticket number trigger)
    ├── 002_users_history_settings.sql Users, incident_history, settings tables
    ├── 003_comments.sql              Comments table with internal note flag
    ├── 004_users_auth.sql            Password hash column for auth
    └── seed.sql                      13 demo incidents across all statuses and severities
```

### Database Schema

| Table | Purpose |
|-------|---------|
| `incidents` | Core incident data — ticket number, title, description, status, severity, category, timestamps |
| `users` | Team members with bcrypt password hashes and role (admin/agent/submitter) |
| `incident_history` | Audit trail — every field change with old/new values and who made it |
| `comments` | Threaded comments with `is_internal` flag for agent-only notes |
| `settings` | Key-value configuration (queue_strategy, stale_threshold_hours) |

### Server vs Client Components

Phylax uses the Next.js hybrid pattern deliberately:

- **Server components** (queue, dashboard, archive, detail page) query the database directly — no loading spinners, no client-side fetch. Pages arrive fully rendered.
- **Client components** (StatusActions, Comments, Postmortem, settings, submit, login) handle interactivity — forms, buttons, state. They use `authFetch` to call the API with JWT authentication.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- An Anthropic API key (for AI features)

### Installation

```bash
git clone https://github.com/Lakonas/Phylax.git
cd Phylax
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```
DATABASE_URL=postgresql://username:password@localhost:5432/phylax_dev
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Database Setup

```bash
# Create the database
createdb phylax_dev

# Run migrations in order
psql -d phylax_dev -f src/db/schema.sql
psql -d phylax_dev -f src/db/002_users_history_settings.sql
psql -d phylax_dev -f src/db/003_comments.sql
psql -d phylax_dev -f src/db/004_users_auth.sql

# Seed demo data
psql -d phylax_dev -f src/db/seed.sql
```

### Register the Admin User

```bash
# Start the dev server first
npm run dev

# Then register the admin account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin User", "email": "admin@phylax.dev", "password": "password123", "role": "admin"}'
```

Open [http://localhost:3000](http://localhost:3000) and log in.

---

## Testing

### API Tests (Jest) — 26 tests

```bash
npx jest --verbose
```

Covers: user registration and login, password validation, duplicate email rejection, generic error messages preventing email enumeration, route protection (401 for unauthenticated, 403 for wrong role), incident CRUD, state machine enforcement (valid and invalid transitions), resolution notes requirement, severity validation, audit trail recording, comments, and internal notes.

### E2E Tests (Playwright) — 9 tests

```bash
npx playwright test --project=chromium
```

Covers: login and navigation, incident submission with ticket number verification, queue navigation to detail page, comment posting, dashboard with Little's Law panel, settings access for admin, archive page, logout redirect, and submitter role UI restrictions.

### Full Suite

```bash
npx jest --verbose && npx playwright test --project=chromium
```

**35 tests total, all passing.**

---

## Security (OWASP)

| Principle | Implementation |
|-----------|---------------|
| Injection (A03) | Parameterized queries on every database call — zero string concatenation |
| Broken Auth (A07) | Generic "Invalid email or password" prevents email enumeration |
| Cryptographic Failures (A02) | bcrypt with salt rounds, passwords never stored or returned as plaintext |
| Security Misconfiguration (A05) | Secrets in `.env.local`, covered by `.gitignore` |
| Broken Access Control (A01) | JWT middleware with three-tier role enforcement on all API routes |

---

## Operational Concepts

For anyone reviewing this project who wants to understand the domain thinking:

**SLA/P (SLA Protection)** — V1 sorts by severity then creation time. V2 will score incidents based on SLA breach proximity — a P3 with 5 minutes left on its SLA surfaces above a P1 with 4 hours remaining. This is how experienced operations teams mentally prioritize; Phylax makes it explicit.

**Little's Law (L = λW)** — A foundational queueing theory result: the average number of items in a system equals the arrival rate multiplied by the average time each item spends in the system. The dashboard uses this to signal when resolution capacity can't sustain the current arrival rate — before the queue starts growing uncontrollably.

**The Utilization Cliff** — Queue systems don't degrade linearly. They perform reasonably up to ~70-80% utilization, then wait times spike exponentially. The dashboard metrics help teams see when they're approaching this threshold.

---

## Roadmap (V2)

- [ ] Dynamic SLA breach-risk scoring for queue re-ranking
- [ ] On Hold state with MTTR clock pause
- [ ] Persistent AI postmortems (saved to database)
- [ ] Team member management in settings
- [ ] Dockerfile and docker-compose for self-hosted deployment
- [ ] Email notifications on assignment and status change
- [ ] Configurable SLA thresholds per severity level

---

## About

Built by **Bill Katsoulis** — 17 years of consumer ITSM operations and Tier 2/3 technical support at TELUS Communications, now building the tools I always wished my teams had.

[GitHub](https://github.com/Lakonas) · [Portfolio](https://devanthrope.dev)
