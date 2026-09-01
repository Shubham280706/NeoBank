import { effectiveBankProvider } from "../../config/env.js";
import { MockBankProvider } from "./MockBankProvider.js";
import { PlaidBankProvider } from "./PlaidBankProvider.js";
import { GoCardlessBankProvider } from "./GoCardlessBankProvider.js";
import type { BankDataProvider } from "./types.js";

let instance: BankDataProvider | null = null;

// The frontend never knows which provider is active — selection is entirely
// backend-config driven (BANK_PROVIDER env var), with automatic mock fallback
// when the chosen provider's credentials are missing.
export function getBankProvider(): BankDataProvider {
  if (instance) return instance;
  switch (effectiveBankProvider) {
    case "plaid":
      instance = new PlaidBankProvider();
      break;
    case "gocardless":
      instance = new GoCardlessBankProvider();
      break;
    default:
      instance = new MockBankProvider();
  }
  return instance;
}

export * from "./types.js";
