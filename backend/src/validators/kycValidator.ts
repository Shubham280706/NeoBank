import { z } from "zod";

export const submitKycSchema = z.object({
  documentType: z.enum(["PAN", "AADHAAR", "PASSPORT", "DRIVING_LICENCE"]),
  documentNumber: z.string().min(4).max(32),
});
