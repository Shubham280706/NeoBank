import { jest } from "@jest/globals";
import { makeChain } from "./helpers/supabaseMock.js";

const rpc = jest.fn<(...args: any[]) => Promise<{ data: any; error: { message: string } | null }>>();
const fromBeneficiaries = jest.fn<() => any>();

jest.unstable_mockModule("../config/supabase.js", () => ({
  requireSupabase: () => ({
    from: (table: string) => {
      if (table === "beneficiaries") return fromBeneficiaries();
      throw new Error(`unexpected table ${table}`);
    },
    rpc: (...args: any[]) => rpc(...args),
  }),
}));

const transferService = await import("../services/transferService.js");

const baseInput = {
  senderAccountId: "11111111-1111-1111-1111-111111111111",
  beneficiaryId: undefined as string | undefined,
  amount: 500,
  transferType: "UPI" as const,
  remarks: "test",
  idempotencyKey: "idem-key-1",
  merchant: undefined as string | undefined,
};

describe("transferService.createTransfer", () => {
  it("throws HttpError(422) on insufficient balance", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "INSUFFICIENT_BALANCE" } });

    await expect(transferService.createTransfer("user-1", { ...baseInput })).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining("Insufficient balance"),
    });
  });

  it("throws HttpError(404) when the beneficiary is not owned by the user", async () => {
    fromBeneficiaries.mockReturnValueOnce(makeChain({ data: null, error: { message: "not found" } }));

    await expect(
      transferService.createTransfer("user-1", { ...baseInput, beneficiaryId: "22222222-2222-2222-2222-222222222222" })
    ).rejects.toMatchObject({ status: 404, message: "Beneficiary not found" });

    // Ownership check must fail fast, before ever calling the RPC.
    expect(rpc).not.toHaveBeenCalled();
  });

  it("is idempotent: replaying the same idempotency key returns the same transfer without reprocessing", async () => {
    const canned = { data: [{ transfer_id: "t-1", status: "SUCCESS", reference_number: "TXN1", new_balance: 9500 }], error: null };
    rpc.mockResolvedValue(canned);

    const first = await transferService.createTransfer("user-1", { ...baseInput });
    const second = await transferService.createTransfer("user-1", { ...baseInput });

    expect(first).toEqual(second);
    expect(rpc).toHaveBeenCalledTimes(2);
    // Both calls carry the exact same idempotency key — the DB function (not
    // this service) is what actually short-circuits on the duplicate key.
    const [firstArgs] = rpc.mock.calls[0] as any[];
    const [secondArgs] = rpc.mock.calls[1] as any[];
    expect(firstArgs).toBe("transfer_money");
    expect(secondArgs).toBe("transfer_money");
    const firstPayload = (rpc.mock.calls[0] as any[])[1];
    const secondPayload = (rpc.mock.calls[1] as any[])[1];
    expect(firstPayload.p_idempotency_key).toBe(secondPayload.p_idempotency_key);
  });
});
