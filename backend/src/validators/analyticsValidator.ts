import { z } from "zod";

export const spendingRangeQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  groupBy: z.enum(["day", "week"]).default("day"),
});

export const monthlyQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).default(6),
});
