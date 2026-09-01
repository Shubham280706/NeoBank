import { createHash } from "crypto";
import type { KYCProvider, KycStatus } from "./types.js";

// This is NOT real identity verification. Document numbers are never stored —
// only a one-way hash, purely to detect duplicate demo submissions.
export class MockKYCProvider implements KYCProvider {
  name = "mock" as const;

  async submit(documentType: string, documentNumber: string) {
    const hash = createHash("sha256").update(`${documentType}:${documentNumber}`).digest("hex");
    return { hash, status: "SUBMITTED" as KycStatus };
  }

  async resolve(_documentNumberHash: string): Promise<KycStatus> {
    // Simulate ~90% of demo submissions verifying successfully.
    return Math.random() > 0.1 ? "VERIFIED" : "FAILED";
  }
}
