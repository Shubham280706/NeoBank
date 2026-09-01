export interface FxRateResult {
  base: string;
  target: string;
  rate: number;
  provider: string;
  fetchedAt: string;
}

export interface FXProvider {
  name: "frankfurter" | "cached";
  getRate(base: string, target: string): Promise<FxRateResult>;
}
