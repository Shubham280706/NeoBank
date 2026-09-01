import { z } from "zod";

export const createCardSchema = z.object({
  spendingLimit: z.number().positive().max(10_000_000).optional(),
  dailyLimit: z.number().positive().max(1_000_000).optional(),
});

export const updateCardLimitSchema = z.object({
  spendingLimit: z.number().positive().max(10_000_000).optional(),
  dailyLimit: z.number().positive().max(1_000_000).optional(),
});
