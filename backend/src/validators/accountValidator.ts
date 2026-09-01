import { z } from "zod";

export const createAccountSchema = z.object({
  accountType: z.enum(["SAVINGS", "CURRENT"]).default("SAVINGS"),
});

export const depositSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  remarks: z.string().max(200).optional(),
});
