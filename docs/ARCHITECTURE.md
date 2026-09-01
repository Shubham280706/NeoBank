# Architecture

> SIMULATED / DEMO BANKING ENVIRONMENT — no real money movement, no real KYC,
> no real UPI/bank connectivity. Every external integration has a mock
> implementation that the system falls back to automatically.

## High-level diagram

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
│      ↓ falls back        ↓ falls back                    ↓ falls back        │
│   MockBankProvider    MockPaymentProvider              CachedFXProvider      │
└────────────────────────────────────────────────────────────────────────────┘
```

## Provider abstraction pattern

Every external integration (bank aggregation, payments, KYC, FX) is defined
as a TypeScript interface in `backend/src/providers/<domain>/types.ts`
(`BankDataProvider`, `PaymentProvider`, `KYCProvider`, an FX rate function).
Each domain has:

- One or more **real** implementations (`PlaidBankProvider`,
  `GoCardlessBankProvider`, `StripePaymentProvider`, `FrankfurterProvider`).
- One **mock** implementation (`MockBankProvider`, `MockPaymentProvider`,
  `MockKYCProvider`, `CachedFXProvider`) that simulates realistic latency,
  occasional failures, and returns synthetic Indian-flavored demo data —
  never touching a real bank, card network, or identity document.
- A factory (`getBankProvider()`, `getPaymentProvider()`, `getKYCProvider()`,
  `getFxRate()`) that picks the implementation based on
  `BANK_PROVIDER` / `PAYMENT_PROVIDER` / `FX_PROVIDER` env vars.

Crucially, the *effective* provider (`config/env.ts`: `effectiveBankProvider`,
`effectivePaymentProvider`) automatically downgrades to `mock` whenever the
requested real provider's credentials are missing (e.g. `BANK_PROVIDER=plaid`
but no `PLAID_CLIENT_ID`/`PLAID_SECRET` set). This means the app is always
runnable out of the box — with real integrations turned on transparently the
moment credentials are supplied, with no code changes and no code path that
knows which one is active beyond the factory. KYC only ever has a mock
provider, by design — this project performs no real identity verification.

Routes/controllers/services never import a concrete provider class directly;
they only call `getXProvider()` and program against the interface.

## Layering: routes → controllers → services → providers

```
routes/*.ts        Express Router definitions; wires middleware (requireAuth,
                    requireAdmin) and maps HTTP verbs/paths to controller fns.
controllers/*.ts   Parse/validate the request (zod schemas in validators/*.ts),
                    call the matching service function with req.userId, and
                    shape the HTTP response / forward errors to next().
services/*.ts       Business logic: talk to Supabase (via requireSupabase()),
                    call providers when needed, enforce ownership checks,
                    and throw HttpError for expected failure conditions.
providers/*         External integration adapters (see above).
```

This keeps HTTP concerns (status codes, body shapes) out of business logic,
and keeps business logic ignorant of which concrete provider is wired up.
`middleware/auth.ts` guarantees `req.userId` is always derived from a
verified Supabase JWT — services trust it and never take a `user_id` from
the request body/query, which a malicious client fully controls.

## RLS model

Every table with user-owned rows has Row Level Security enabled
(`supabase/migrations/0002_rls_policies.sql`). The default shape is:

- `<resource>_select_own_or_admin`: `user_id = auth.uid() OR is_admin()`
- Mutating policies (`insert`/`update`/`delete`, or a combined `for all`):
  scoped to `user_id = auth.uid()`.

`is_admin()` is a `security definer` SQL function that checks
`profiles.role = 'admin'` for the current `auth.uid()`, so admin-only reads
don't need to duplicate role logic in every policy.

The **backend** talks to Postgres using the Supabase **service role** key
(`supabaseAdmin` in `config/supabase.ts`), which bypasses RLS entirely — RLS
is the defense-in-depth layer for any future direct-from-client Supabase
access (e.g. realtime subscriptions), while the REST API itself enforces
ownership explicitly in each service function (`.eq("user_id", userId)`
filters, and explicit "not found" `HttpError`s when a lookup by id + user_id
returns nothing).

## Atomic transfer flow

`POST /api/transfers` doesn't perform the debit in application code. Instead
`transferService.createTransfer()` calls the Postgres function
`transfer_money(...)` (`supabase/migrations/0003_transfer_money_fn.sql`) via
`db.rpc(...)`, which runs as a single database transaction:

1. **Idempotency check** — look up `transfers` by `(user_id, idempotency_key)`
   first; if found, return the existing transfer's result immediately without
   redoing any work. This makes retried requests (e.g. a client retry after a
   network timeout) safe.
2. **Row lock** — `SELECT ... FOR UPDATE` on the sender's `bank_accounts` row,
   preventing a concurrent transfer from double-spending the same balance.
3. **Validation** — account must exist and be owned by `p_user_id`
   (`ACCOUNT_NOT_FOUND_OR_NOT_OWNED`), must be `ACTIVE`
   (`ACCOUNT_NOT_ACTIVE`), and `available_balance` must cover the amount
   (`INSUFFICIENT_BALANCE`). Each failure raises a named Postgres exception
   that the service layer maps to the right HTTP status (404/422/422).
4. **Write** — debit the account, insert the `transactions` row, the
   `transfers` row, a `notifications` row, and an `audit_logs` row — all
   inside the same transaction, so a mid-flight failure rolls back everything
   rather than leaving a debit with no transaction record.

Application code adds one more idempotency safeguard: the `transfers` table
has a `unique (user_id, idempotency_key)` constraint, so even a race between
two identical concurrent requests can't create two transfer rows.

## Realtime data flow

```
Postgres row change (transfers/transactions/bank_accounts/notifications/...)
        │  (logical replication, enabled per-table in 0004_realtime.sql)
        ▼
Supabase Realtime (WebSocket)
        │  frontend subscribes via supabase-js `.channel(...).on('postgres_changes', ...)`
        ▼
Frontend realtime listener
        │  on any INSERT/UPDATE/DELETE for the current user's rows
        ▼
TanStack Query cache invalidation (`queryClient.invalidateQueries(...)`)
        │
        ▼
Affected queries refetch → UI re-renders with fresh data
```

The tables enabled for realtime (`0004_realtime.sql`) are exactly the ones
whose changes should reflect live in the UI without polling: `bank_accounts`,
`transactions`, `transfers`, `payments`, `notifications`, `cards`, `budgets`,
`savings_goals`, `kyc_verifications`. The backend never pushes realtime
events itself — it just writes to Postgres as part of a normal request (or
the `transfer_money` function does, atomically); Supabase's replication
stream is what turns that write into a WebSocket message. This means the
same account balance update looks identical whether it originated from this
device's own transfer request or from another signed-in device/tab.

## Testing strategy

Backend tests (`backend/src/__tests__/`) mock `requireSupabase()` /
`supabaseAuthClient` and the provider factories rather than hitting a live
Supabase project, so `npm test` runs offline and deterministically. See
`docs/API.md` for the full endpoint surface these layers implement.
