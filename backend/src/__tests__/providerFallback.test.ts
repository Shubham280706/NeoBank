import { jest } from "@jest/globals";

// env.ts reads process.env at import time, and the provider factories cache a
// singleton instance module-level. So each scenario needs a fully fresh
// module registry + fresh env vars, obtained via jest.resetModules() and a
// dynamic import performed after mutating process.env.
const ENV_KEYS = [
  "BANK_PROVIDER",
  "PAYMENT_PROVIDER",
  "PLAID_CLIENT_ID",
  "PLAID_SECRET",
  "GOCARDLESS_SECRET_ID",
  "GOCARDLESS_SECRET_KEY",
  "STRIPE_SECRET_KEY",
];

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe("provider fallback to mock implementations", () => {
  it("getBankProvider() falls back to MockBankProvider when PLAID/GOCARDLESS credentials are missing", async () => {
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.BANK_PROVIDER = "plaid"; // requested, but no credentials -> should fall back

    jest.resetModules();
    const { getBankProvider } = await import("../providers/bank/index.js");
    const provider = getBankProvider();

    expect(provider.name).toBe("mock");
  });

  it("getPaymentProvider() falls back to MockPaymentProvider when STRIPE_SECRET_KEY is missing", async () => {
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.PAYMENT_PROVIDER = "stripe"; // requested, but no credentials -> should fall back

    jest.resetModules();
    const { getPaymentProvider } = await import("../providers/payments/index.js");
    const provider = getPaymentProvider();

    expect(provider.name).toBe("mock");
  });

  it("getBankProvider() defaults to mock when BANK_PROVIDER is unset entirely", async () => {
    for (const key of ENV_KEYS) delete process.env[key];

    jest.resetModules();
    const { getBankProvider } = await import("../providers/bank/index.js");
    expect(getBankProvider().name).toBe("mock");
  });
});
