import { z } from "zod";

export const createBeneficiarySchema = z.object({
  name: z.string().min(1).max(120),
  accountNumber: z.string().min(4).max(34),
  ifsc: z.string().min(4).max(20),
  bankName: z.string().max(120).optional(),
  nickname: z.string().max(60).optional(),
  favorite: z.boolean().optional(),
});

export const updateBeneficiarySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  accountNumber: z.string().min(4).max(34).optional(),
  ifsc: z.string().min(4).max(20).optional(),
  bankName: z.string().max(120).optional(),
  nickname: z.string().max(60).optional(),
  favorite: z.boolean().optional(),
});
