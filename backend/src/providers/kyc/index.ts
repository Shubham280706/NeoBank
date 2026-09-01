import { MockKYCProvider } from "./MockKYCProvider.js";
import type { KYCProvider } from "./types.js";

let instance: KYCProvider | null = null;

export function getKYCProvider(): KYCProvider {
  if (!instance) instance = new MockKYCProvider();
  return instance;
}

export * from "./types.js";
