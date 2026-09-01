import { effectivePaymentProvider } from "../../config/env.js";
import { MockPaymentProvider } from "./MockPaymentProvider.js";
import { StripePaymentProvider } from "./StripePaymentProvider.js";
import type { PaymentProvider } from "./types.js";

let instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;
  instance = effectivePaymentProvider === "stripe" ? new StripePaymentProvider() : new MockPaymentProvider();
  return instance;
}

export * from "./types.js";
