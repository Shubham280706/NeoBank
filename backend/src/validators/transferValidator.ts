import { z } from "zod";

export const createTransferSchema = z.object({
  senderAccountId: z.string().uuid(),
  beneficiaryId: z.string().uuid().optional(),
  amount: z.number().positive().max(1_000_000),
  transferType: z.enum(["UPI", "IMPS", "NEFT", "RTGS"]),
  remarks: z.string().max(200).optional(),
  idempotencyKey: z.string().min(8).max(128),
  merchant: z.string().max(120).optional(),
  recipientUpiId: z.string().max(120).optional(),
});
