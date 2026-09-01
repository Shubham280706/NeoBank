# API Reference

Base URL: `http://localhost:4000` (or `BACKEND_URL` / `VITE_BACKEND_URL`).

This is a **simulated banking demo API**. No endpoint here moves real money,
performs real KYC, or talks to a real bank — every provider has a mock
fallback (see [ARCHITECTURE.md](./ARCHITECTURE.md)).

**Auth**: unless noted "Public", every endpoint requires a valid Supabase
session JWT in `Authorization: Bearer <token>`. "Admin" endpoints additionally
require the caller's `profiles.role` to be `admin`. Identity (`user_id`) is
always derived server-side from the verified JWT, never from the request
body/query.

All request/response bodies are JSON. Errors are `{ "error": "message" }`
with a non-2xx status code.

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | Liveness check; returns `{ ok, demoMode }`. |

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/me` | User | Current user's profile plus their bank accounts. |

## Accounts

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/accounts` | User | List the caller's bank accounts. |
| GET | `/api/accounts/:id` | User | Get one account (must be owned by the caller). |
| GET | `/api/accounts/:id/balance` | User | Balance + available balance for one account. |

## Transfers

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/transfers` | User | Create a transfer (UPI/IMPS/NEFT/RTGS) via the atomic `transfer_money` DB function. Idempotent on `idempotencyKey`. |
| GET | `/api/transfers` | User | List the caller's transfers. |
| GET | `/api/transfers/:id` | User | Get one transfer. |

## Beneficiaries

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/beneficiaries` | User | List the caller's saved beneficiaries. |
| POST | `/api/beneficiaries` | User | Add a beneficiary. |
| GET | `/api/beneficiaries/:id` | User | Get one beneficiary. |
| PATCH | `/api/beneficiaries/:id` | User | Update a beneficiary (name, account, nickname, favorite, ...). |
| DELETE | `/api/beneficiaries/:id` | User | Remove a beneficiary. |

## Cards

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/cards` | User | List the caller's cards. |
| POST | `/api/cards` | User | Issue a new virtual card. |
| GET | `/api/cards/:id` | User | Get one card. |
| POST | `/api/cards/:id/freeze` | User | Freeze a card (blocks further spend). |
| POST | `/api/cards/:id/unfreeze` | User | Unfreeze a previously frozen card. |
| PATCH | `/api/cards/:id/limit` | User | Update spending/daily limit. |
| POST | `/api/cards/:id/report` | User | Report a card lost/stolen (marks REPORTED, terminal). |
| GET | `/api/cards/:id/transactions` | User | List transactions made on this card. |

## KYC

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/kyc/submit` | User | Submit a KYC document (PAN/AADHAAR/PASSPORT/DRIVING_LICENCE). Only a one-way hash of the document number is ever stored; resolves to VERIFIED/FAILED asynchronously via the mock provider. |
| GET | `/api/kyc/status` | User | Get the caller's latest KYC verification status. |

## Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments` | User | Create a payment via the configured payment provider (Stripe or mock). |
| GET | `/api/payments` | User | List the caller's payments. |
| GET | `/api/payments/:id` | User | Get one payment. |
| POST | `/api/payments/:id/refund` | User | Refund a payment. |

## Banks (account aggregation)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/banks/link` | User | Link an external bank via the configured bank provider (Plaid/GoCardless/mock). |
| GET | `/api/banks` | User | List the caller's linked banks. |
| GET | `/api/banks/:id/accounts` | User | List normalized accounts from a linked bank. |
| GET | `/api/banks/:id/transactions` | User | List normalized transactions from a linked bank. |
| DELETE | `/api/banks/:id` | User | Disconnect a linked bank. |

## FX

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/fx/rates` | User | Get current exchange rate(s) (Frankfurter, cached fallback). |
| POST | `/api/fx/convert` | User | Convert an amount between two currencies. |

## Budgets

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/budgets` | User | List the caller's budgets with computed spend/remaining/percentUsed. |
| POST | `/api/budgets` | User | Create a budget for a category + period. |
| PATCH | `/api/budgets/:id` | User | Update a budget. |
| DELETE | `/api/budgets/:id` | User | Delete a budget. |

## Savings goals

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/savings` | User | List the caller's savings goals. |
| POST | `/api/savings` | User | Create a savings goal. |
| PATCH | `/api/savings/:id` | User | Update a savings goal. |
| DELETE | `/api/savings/:id` | User | Delete a savings goal. |
| POST | `/api/savings/:id/contribute` | User | Add a contribution (or withdrawal) to a goal. |

## Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | User | List the caller's notifications. |
| POST | `/api/notifications/:id/read` | User | Mark one notification read. |
| POST | `/api/notifications/read-all` | User | Mark all of the caller's notifications read. |

## Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/overview` | User | Summary: balances, spend, income at a glance. |
| GET | `/api/analytics/spending` | User | Spending breakdown over a period. |
| GET | `/api/analytics/categories` | User | Spend grouped by category. |
| GET | `/api/analytics/monthly` | User | Month-over-month trend data. |

## Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List all users/profiles. |
| GET | `/api/admin/transactions` | Admin | List all transactions across users. |
| GET | `/api/admin/kyc` | Admin | List all KYC verifications. |
| GET | `/api/admin/analytics` | Admin | Platform-wide analytics. |
| GET | `/api/admin/system-health` | Admin | Provider/DB health snapshot. |
| GET | `/api/admin/audit-logs` | Admin | Query the audit log. |

## Webhooks

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/webhooks/stripe` | Public (signature-verified) | Stripe webhook receiver, mounted before the JSON body parser so the raw body is available for signature verification. |
