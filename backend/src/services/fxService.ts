import { requireSupabase } from "../config/supabase.js";
import { getFxRate } from "../providers/fx/index.js";

const TARGET_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AED", "SGD", "AUD"];

export async function getRates(base: string) {
  const db = requireSupabase();

  const results = await Promise.all(
    TARGET_CURRENCIES.filter((target) => target !== base.toUpperCase()).map((target) => getFxRate(base, target))
  );

  await Promise.all(
    results.map((result) =>
      db.from("fx_rates").upsert(
        {
          base_currency: result.base,
          target_currency: result.target,
          rate: result.rate,
          provider: result.provider,
          fetched_at: result.fetchedAt,
        },
        { onConflict: "base_currency,target_currency" }
      )
    )
  );

  return { base: base.toUpperCase(), rates: results };
}

export async function convert(from: string, to: string, amount: number) {
  const result = await getFxRate(from, to);
  return {
    rate: result.rate,
    convertedAmount: Number((amount * result.rate).toFixed(2)),
    source: result.provider,
    lastUpdated: result.fetchedAt,
  };
}
