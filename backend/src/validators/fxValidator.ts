import { z } from "zod";

export const fxRatesQuerySchema = z.object({
  base: z.string().length(3).default("INR"),
});

export const fxConvertQuerySchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  amount: z.coerce.number().positive(),
});
