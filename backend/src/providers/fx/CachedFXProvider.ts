import type { FXProvider, FxRateResult } from "./types.js";

// Static fallback rates (approximate, INR-based) used only when Frankfurter
// is unreachable and no fresher cached DB row exists. Keeps FX endpoints alive.
const FALLBACK_RATES_FROM_INR: Record<string, number> = {
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  JPY: 1.77,
  AED: 0.044,
  SGD: 0.016,
  AUD: 0.018,
  INR: 1,
};

export class CachedFXProvider implements FXProvider {
  name = "cached" as const;

  async getRate(base: string, target: string): Promise<FxRateResult> {
    const baseToInr = base === "INR" ? 1 : 1 / (FALLBACK_RATES_FROM_INR[base] ?? 1);
    const inrToTarget = target === "INR" ? 1 : FALLBACK_RATES_FROM_INR[target] ?? 1;
    const rate = baseToInr * inrToTarget;
    return { base, target, rate, provider: "cached-fallback", fetchedAt: new Date().toISOString() };
  }
}
