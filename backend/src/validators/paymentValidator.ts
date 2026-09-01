import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  currency: z.string().length(3).default("INR"),
  paymentMethod: z.string().min(1).max(60),
});
