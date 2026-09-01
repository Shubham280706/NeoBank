export type KycStatus = "SUBMITTED" | "PROCESSING" | "VERIFIED" | "FAILED";

export interface KYCProvider {
  name: "mock";
  submit(documentType: string, documentNumber: string): Promise<{ hash: string; status: KycStatus }>;
  // Called after a delay to resolve to a terminal status (VERIFIED/FAILED).
  resolve(documentNumberHash: string): Promise<KycStatus>;
}
