import { FrankfurterProvider } from "./FrankfurterProvider.js";
import { CachedFXProvider } from "./CachedFXProvider.js";
import type { FXProvider } from "./types.js";

const frankfurter = new FrankfurterProvider();
const cached = new CachedFXProvider();

// Always try Frankfurter first; transparently fall back to cached rates on
// any failure so FX endpoints never go down.
export async function getFxRate(base: string, target: string) {
  try {
    return await frankfurter.getRate(base, target);
  } catch {
    return cached.getRate(base, target);
  }
}

export const fxProviders: { frankfurter: FXProvider; cached: FXProvider } = { frankfurter, cached };
export * from "./types.js";
