import { env } from "../../config/env.js";
import type { FXProvider, FxRateResult } from "./types.js";

// Frankfurter (https://frankfurter.dev) is free and keyless — no API credentials needed.
export class FrankfurterProvider implements FXProvider {
  name = "frankfurter" as const;

  async getRate(base: string, target: string): Promise<FxRateResult> {
    const res = await fetch(`${env.frankfurterApiUrl}/latest?base=${base}&symbols=${target}`);
    if (!res.ok) throw new Error(`Frankfurter request failed: ${res.status}`);
    const data = await res.json();
    const rate = data.rates?.[target];
    if (typeof rate !== "number") throw new Error(`No rate for ${base}->${target}`);
    return { base, target, rate, provider: "frankfurter", fetchedAt: new Date().toISOString() };
  }
}
