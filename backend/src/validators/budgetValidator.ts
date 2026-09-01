import { z } from "zod";

export const createBudgetSchema = z.object({
  category: z.string().min(1).max(60),
  amount: z.number().positive().max(10_000_000),
  period: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
});

export const updateBudgetSchema = z.object({
  category: z.string().min(1).max(60).optional(),
  amount: z.number().positive().max(10_000_000).optional(),
  period: z.enum(["weekly", "monthly", "yearly"]).optional(),
});
