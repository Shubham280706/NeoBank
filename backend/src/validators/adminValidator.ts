import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const transactionsQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  type: z.enum(["CREDIT", "DEBIT"]).optional(),
});

export const kycQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["SUBMITTED", "PROCESSING", "VERIFIED", "FAILED"]).optional(),
});
