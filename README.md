# NeoBank — Simulated Indian Neo-Banking Demo

> **SIMULATED / DEMO BANKING ENVIRONMENT.** This project does not move real
> money, does not perform real KYC/identity verification, and does not
> connect to real banks, UPI, or card networks. Every external integration
> (bank aggregation, payments, KYC, FX rates) has a realistic mock
> implementation that the backend falls back to automatically whenever real
> provider credentials aren't configured. It exists to demonstrate a
> production-shaped fintech architecture end to end, safely.

## Architecture at a glance

```
┌───────────────────────┐         HTTPS/JSON          ┌──────────────────────────┐
│   Frontend (React)    │ ───────────────────────────▶ │   Backend (Express API)  │
│  Vite + TanStack Query│ ◀─────────────────────────── │  routes → controllers →  │
│  + Supabase JS client │        REST responses         │  services → providers    │
└───────────┬───────────┘                               └────────────┬─────────────┘
            │                                                         │
            │ direct auth + realtime subscriptions                   │ service-role
            ▼                                                         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                                  Supabase                                      │
│  Postgres (16 tables, RLS)  |  Auth (JWT)  |  Realtime (logical replication)   │
│  transfer_money() atomic fn |  is_admin() helper |  handle_new_user() trigger  │
└───────────────────────────────────────────────────────────────────────────────┘
            ▲
            │ automatic mock fallback when credentials are missing
┌───────────┴─────────────────────────────────────────────────────────────────┐
│                          External provider integrations                      │
│   BankDataProvider   PaymentProvider   KYCProvider   FXProvider              │
│   Plaid / GoCardless   Stripe            (mock only)   Frankfurter            │
└────────────────────────────────────────────────────────────────────────────┘
```

Full write-up: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).
Full endpoint list: [`docs/API.md`](./docs/API.md).

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite, TypeScript, TanStack Query, React Router, Tailwind CSS, React Hook Form + Zod, Recharts, Supabase JS client |
| Backend | Node.js, Express 5, TypeScript, Zod, Supabase JS (service role), Jest + Supertest |
| Database / Auth / Realtime | Supabase (Postgres, Row Level Security, Auth, Realtime) |
| External integrations (mockable) | Plaid / GoCardless (bank aggregation), Stripe (payments), Frankfurter (FX rates); all with automatic mock fallback |
| Infra | Docker (multi-stage builds), docker-compose, npm workspaces |

## Repository layout

```
backend/     Express API — routes, controllers, services, providers
frontend/    React SPA
supabase/    SQL migrations + seed script
docker/      docker-compose.yml for running backend + frontend in containers
docs/        API.md, ARCHITECTURE.md
```

## Setup

### 1. Prerequisites

- Node.js 22+
- A Supabase project (free tier is fine) — https://supabase.com
- (Optional) Plaid / GoCardless / Stripe sandbox credentials if you want to
  exercise real provider integrations instead of the mocks

### 2. Configure environment variables

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

At minimum, fill in your Supabase project's values in the root `.env`:

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # backend only — never expose to the frontend
```

and the matching values in `frontend/.env`:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_BACKEND_URL=http://localhost:4000
```

Everything else in `.env.example` (`STRIPE_*`, `PLAID_*`, `GOCARDLESS_*`,
`BANK_PROVIDER`, `PAYMENT_PROVIDER`, `FX_PROVIDER`) can be left as-is for a
fully mocked demo — see [Provider selection](#provider-selection) below.

### 3. Apply the database schema

Run the SQL files in `supabase/migrations/` (in order) against your Supabase
project — via the SQL editor in the Supabase dashboard, or the Supabase CLI:

```bash
supabase db push   # or paste each file into the SQL editor, in numeric order
```

### 4. Install dependencies

From the repo root (this is an npm workspaces monorepo covering
`frontend` and `backend`):

```bash
npm install
```

### 5. Seed demo data

```bash
npm run seed
```

This creates 5 demo users (via Supabase Auth), bank accounts, cards,
budgets, savings goals, beneficiaries, 100+ realistic transactions across
6–12 months, a handful of transfers, and notifications — then prints a demo
login table to the console. It requires real Supabase credentials in `.env`
and cannot run against a mocked/offline environment.

### 6. Run the app

```bash
npm run dev
```

This runs the backend (`:4000`) and frontend (`:5173`) concurrently. Or run
them independently: `npm run dev -w backend`, `npm run dev -w frontend`.

### 7. Run backend tests

```bash
npm test
```

Runs the Jest/Supertest suite in `backend/`, fully mocked (no live Supabase
project required).

### 8. Run with Docker

```bash
cd docker
docker compose up --build
```

Backend on `:4000`, frontend (served via nginx) on `:5173`. There is no
Postgres container here — Supabase is the hosted database for this project,
so `docker-compose.yml` only defines `backend` and `frontend` services (see
the comment at the top of that file).

## Demo login credentials

After running `npm run seed`, log in with any of the printed accounts — for
example:

| Email | Password | Role |
|---|---|---|
| priya.sharma@demo.neo | DemoPass123! | admin |
| rahul.verma@demo.neo | DemoPass123! | user |
| ananya.iyer@demo.neo | DemoPass123! | user |
| vikram.singh@demo.neo | DemoPass123! | user |
| neha.gupta@demo.neo | DemoPass123! | user |

(The exact table is printed to your console by the seed script each time it
runs — treat the console output as the source of truth.)

## Provider selection

`BANK_PROVIDER`, `PAYMENT_PROVIDER`, and `FX_PROVIDER` in `.env` choose which
integration the backend uses:

| Env var | Values | Real implementation | Falls back to mock when... |
|---|---|---|---|
| `BANK_PROVIDER` | `plaid` \| `gocardless` \| `mock` | Plaid / GoCardless sandbox | `PLAID_CLIENT_ID`/`PLAID_SECRET` or `GOCARDLESS_SECRET_ID`/`GOCARDLESS_SECRET_KEY` are missing |
| `PAYMENT_PROVIDER` | `stripe` \| `mock` | Stripe | `STRIPE_SECRET_KEY` is missing |
| `FX_PROVIDER` | `frankfurter` \| `cached` | Live Frankfurter API | Frankfurter is unreachable (`CachedFXProvider` serves a cached/last-known rate) |

The fallback is automatic and transparent to the rest of the app — routes,
controllers, and services always call `getBankProvider()` /
`getPaymentProvider()` / `getFxRate()` and never know or care which concrete
implementation answered. See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md#provider-abstraction-pattern)
for details. KYC (`/api/kyc/*`) always uses the mock provider — this project
never performs real identity verification.

## Safety notice

No code path in this repository sends, receives, or holds real money. Card
numbers, bank account numbers, and identity documents used or generated here
are synthetic. KYC document numbers are hashed (SHA-256) before storage and
the raw value is never persisted. Treat this purely as a demonstration of
architecture and UX patterns for a neo-banking product.
