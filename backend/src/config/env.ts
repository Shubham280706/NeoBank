import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load the monorepo-root .env regardless of the process's cwd. dotenv's
// default `import "dotenv/config"` resolves ".env" against process.cwd(),
// which under `npm run dev -w backend` is backend/ (no .env there) rather
// than the repo root where the real .env lives — so credentials silently
// never loaded. Resolve explicitly instead.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "../../../.env") });

function bool(v: string | undefined, def: boolean): boolean {
  if (v === undefined) return def;
  return v.toLowerCase() === "true";
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  demoMode: bool(process.env.DEMO_MODE, true),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  backendUrl: process.env.BACKEND_URL ?? "http://localhost:4000",

  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  bankProvider: (process.env.BANK_PROVIDER ?? "mock") as "plaid" | "gocardless" | "mock",
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "mock") as "stripe" | "mock",
  fxProvider: (process.env.FX_PROVIDER ?? "frankfurter") as "frankfurter" | "cached",

  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  plaidClientId: process.env.PLAID_CLIENT_ID ?? "",
  plaidSecret: process.env.PLAID_SECRET ?? "",
  plaidEnv: process.env.PLAID_ENV ?? "sandbox",

  gocardlessSecretId: process.env.GOCARDLESS_SECRET_ID ?? "",
  gocardlessSecretKey: process.env.GOCARDLESS_SECRET_KEY ?? "",

  frankfurterApiUrl: process.env.FRANKFURTER_API_URL ?? "https://api.frankfurter.dev/v1",
};

// Effective provider resolves to mock automatically whenever required credentials are missing.
export const effectiveBankProvider: "plaid" | "gocardless" | "mock" =
  env.bankProvider === "plaid" && (!env.plaidClientId || !env.plaidSecret)
    ? "mock"
    : env.bankProvider === "gocardless" && (!env.gocardlessSecretId || !env.gocardlessSecretKey)
    ? "mock"
    : env.bankProvider;

export const effectivePaymentProvider: "stripe" | "mock" =
  env.paymentProvider === "stripe" && !env.stripeSecretKey ? "mock" : env.paymentProvider;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
