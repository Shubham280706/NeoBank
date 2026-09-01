import { randomUUID } from "crypto";
import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { z } from "zod";
import type { createTransferSchema } from "../validators/transferValidator.js";

type CreateTransferInput = z.infer<typeof createTransferSchema>;

// Delegates the actual debit + bookkeeping to the `transfer_money` Postgres
// function (see supabase/migrations/0003_transfer_money_fn.sql), which runs
// as a single atomic transaction: validates ownership, checks balance,
// debits, and writes transaction/transfer/notification/audit rows together.
// Idempotency is enforced both here (unique constraint) and inside the
// function (lookup by idempotency_key before doing any work).
export async function createTransfer(userId: string, input: CreateTransferInput) {
  const db = requireSupabase();

  if (input.beneficiaryId) {
    const { data: beneficiary } = await db
      .from("beneficiaries")
      .select("id")
      .eq("id", input.beneficiaryId)
      .eq("user_id", userId)
      .single();
    if (!beneficiary) throw new HttpError(404, "Beneficiary not found");
  }

  const referenceNumber = `TXN${Date.now()}${randomUUID().slice(0, 6).toUpperCase()}`;

  const { data, error } = await db.rpc("transfer_money", {
    p_user_id: userId,
    p_sender_account_id: input.senderAccountId,
    p_beneficiary_id: input.beneficiaryId ?? null,
    p_amount: input.amount,
    p_transfer_type: input.transferType,
    p_remarks: input.remarks ?? null,
    p_idempotency_key: input.idempotencyKey,
    p_reference_number: referenceNumber,
    p_merchant: input.merchant ?? null,
    p_recipient_upi_id: input.recipientUpiId ?? null,
  });

  if (error) {
    if (error.message.includes("INSUFFICIENT_BALANCE")) throw new HttpError(422, "Insufficient balance");
    if (error.message.includes("ACCOUNT_NOT_FOUND_OR_NOT_OWNED")) throw new HttpError(404, "Sender account not found");
    if (error.message.includes("ACCOUNT_NOT_ACTIVE")) throw new HttpError(422, "Sender account is not active");
    throw new HttpError(500, error.message);
  }

  if (input.category) {
    await db
      .from("transactions")
      .update({ category: input.category })
      .eq("user_id", userId)
      .eq("reference_number", referenceNumber);
  }

  return data?.[0];
}

export async function listTransfers(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db.from("transfers").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function getTransfer(userId: string, id: string) {
  const db = requireSupabase();
  const { data, error } = await db.from("transfers").select("*").eq("user_id", userId).eq("id", id).single();
  if (error) throw new HttpError(404, "Transfer not found");
  return data;
}
