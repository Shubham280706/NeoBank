import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import { writeAuditLog } from "./auditService.js";
import type { z } from "zod";
import type { createBeneficiarySchema, updateBeneficiarySchema } from "../validators/beneficiaryValidator.js";

type CreateInput = z.infer<typeof createBeneficiarySchema>;
type UpdateInput = z.infer<typeof updateBeneficiarySchema>;

export async function listBeneficiaries(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("beneficiaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function createBeneficiary(userId: string, input: CreateInput) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("beneficiaries")
    .insert({
      user_id: userId,
      name: input.name,
      account_number: input.accountNumber,
      ifsc: input.ifsc,
      bank_name: input.bankName ?? null,
      nickname: input.nickname ?? null,
      favorite: input.favorite ?? false,
    })
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);

  await writeAuditLog(userId, "BENEFICIARY_CREATED", "beneficiary", data.id, { name: input.name });

  return data;
}

async function ensureOwned(db: ReturnType<typeof requireSupabase>, userId: string, id: string) {
  const { data, error } = await db.from("beneficiaries").select("id").eq("id", id).eq("user_id", userId).single();
  if (error || !data) throw new HttpError(404, "Beneficiary not found");
}

export async function updateBeneficiary(userId: string, id: string, input: UpdateInput) {
  const db = requireSupabase();
  await ensureOwned(db, userId, id);

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.accountNumber !== undefined) patch.account_number = input.accountNumber;
  if (input.ifsc !== undefined) patch.ifsc = input.ifsc;
  if (input.bankName !== undefined) patch.bank_name = input.bankName;
  if (input.nickname !== undefined) patch.nickname = input.nickname;
  if (input.favorite !== undefined) patch.favorite = input.favorite;

  const { data, error } = await db
    .from("beneficiaries")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function deleteBeneficiary(userId: string, id: string) {
  const db = requireSupabase();
  await ensureOwned(db, userId, id);

  const { error } = await db.from("beneficiaries").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new HttpError(500, error.message);
  return { success: true };
}
