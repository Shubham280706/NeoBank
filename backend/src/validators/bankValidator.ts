import { z } from "zod";

export const linkBankSchema = z.object({
  institutionId: z.string().max(120).optional(),
});
