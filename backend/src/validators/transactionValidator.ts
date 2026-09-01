import { z } from "zod";

export const listTransactionsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  status: z.enum(["PENDING", "SUCCESS", "FAILED"]).optional(),
  type: z.enum(["CREDIT", "DEBIT"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
