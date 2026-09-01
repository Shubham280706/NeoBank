import { z } from "zod";

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1).max(120),
  targetAmount: z.number().positive().max(100_000_000),
  currentAmount: z.number().min(0).max(100_000_000).optional(),
  deadline: z.string().optional(),
});

export const updateSavingsGoalSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  targetAmount: z.number().positive().max(100_000_000).optional(),
  deadline: z.string().optional(),
});

export const contributeSavingsSchema = z.object({
  amount: z.number().positive().max(100_000_000),
  type: z.enum(["CONTRIBUTION", "WITHDRAWAL"]),
});
