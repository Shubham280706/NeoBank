import { jest } from "@jest/globals";
import { makeChain } from "./helpers/supabaseMock.js";

// Fake timers so the internal scheduleResolution(setTimeout(...)) never
// actually fires during the test and leaves no open handle behind.
jest.useFakeTimers();

const insertPayloads: any[] = [];
const fromKyc = jest.fn((..._args: any[]) => {
  return {
    insert: (payload: any) => {
      insertPayloads.push(payload);
      return makeChain({ data: { id: "kyc-1", ...payload }, error: null });
    },
  };
});

jest.unstable_mockModule("../config/supabase.js", () => ({
  requireSupabase: () => ({
    from: (table: string) => {
      if (table === "kyc_verifications") return fromKyc(table);
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

jest.unstable_mockModule("../services/auditService.js", () => ({
  writeAuditLog: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const kycService = await import("../services/kycService.js");

describe("kycService.submitKyc", () => {
  it("never stores the raw document number, only a one-way hash", async () => {
    const documentNumber = "ABCDE1234F"; // looks like a real PAN number
    await kycService.submitKyc("user-1", { documentType: "PAN", documentNumber });

    expect(insertPayloads).toHaveLength(1);
    const payload = insertPayloads[0];

    // The raw document number must never appear anywhere in what gets persisted.
    expect(JSON.stringify(payload)).not.toContain(documentNumber);
    expect(payload).not.toHaveProperty("document_number");
    expect(payload).toHaveProperty("document_number_hash");
    expect(typeof payload.document_number_hash).toBe("string");
    expect(payload.document_number_hash).toHaveLength(64); // sha256 hex digest
  });
});
