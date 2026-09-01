import { createTransferSchema } from "../validators/transferValidator.js";
import { createBeneficiarySchema, updateBeneficiarySchema } from "../validators/beneficiaryValidator.js";
import { createCardSchema } from "../validators/cardValidator.js";

const validTransfer = {
  senderAccountId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  amount: 100,
  transferType: "UPI" as const,
  idempotencyKey: "abcdefgh",
};

describe("createTransferSchema", () => {
  it("accepts a valid payload", () => {
    expect(createTransferSchema.safeParse(validTransfer).success).toBe(true);
  });

  it("rejects a zero amount", () => {
    const result = createTransferSchema.safeParse({ ...validTransfer, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = createTransferSchema.safeParse({ ...validTransfer, amount: -50 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid transferType enum value", () => {
    const result = createTransferSchema.safeParse({ ...validTransfer, transferType: "SWIFT" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing idempotencyKey", () => {
    const { idempotencyKey, ...rest } = validTransfer;
    const result = createTransferSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an idempotencyKey shorter than 8 characters", () => {
    const result = createTransferSchema.safeParse({ ...validTransfer, idempotencyKey: "short" });
    expect(result.success).toBe(false);
  });
});

describe("beneficiaryValidator", () => {
  it("accepts a valid create payload", () => {
    const result = createBeneficiarySchema.safeParse({
      name: "Rahul Verma",
      accountNumber: "123456789012",
      ifsc: "HDFC0001234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createBeneficiarySchema.safeParse({ name: "", accountNumber: "123456789012", ifsc: "HDFC0001234" });
    expect(result.success).toBe(false);
  });

  it("allows a partial update payload", () => {
    const result = updateBeneficiarySchema.safeParse({ favorite: true });
    expect(result.success).toBe(true);
  });
});

describe("cardValidator", () => {
  it("rejects a non-positive spendingLimit", () => {
    const result = createCardSchema.safeParse({ spendingLimit: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts an empty payload (all fields optional)", () => {
    const result = createCardSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
