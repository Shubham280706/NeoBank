import { randomInt } from "crypto";
import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import { writeAuditLog } from "./auditService.js";
import { ensureProfile } from "./profileService.js";
import type { z } from "zod";
import type { createCardSchema, updateCardLimitSchema } from "../validators/cardValidator.js";

type CreateInput = z.infer<typeof createCardSchema>;
type UpdateLimitInput = z.infer<typeof updateCardLimitSchema>;

const DEFAULT_SPENDING_LIMIT = 100_000;
const DEFAULT_DAILY_LIMIT = 25_000;

function randomLast4(): string {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

async function getOwnedCard(db: ReturnType<typeof requireSupabase>, userId: string, id: string) {
  const { data, error } = await db.from("cards").select("*").eq("id", id).eq("user_id", userId).single();
  if (error || !data) throw new HttpError(404, "Card not found");
  return data;
}

export async function listCards(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db.from("cards").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function createCard(userId: string, input: CreateInput) {
  const db = requireSupabase();

  const profile = await ensureProfile(userId);
  const cardholderName = `${profile.first_name} ${profile.last_name}`.trim() || "Card Holder";
  const now = new Date();
  const expiryYear = now.getFullYear() + 4;
  const expiryMonth = now.getMonth() + 1;

  const { data, error } = await db
    .from("cards")
    .insert({
      user_id: userId,
      card_type: "VIRTUAL",
      last4: randomLast4(),
      cardholder_name: cardholderName,
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      status: "ACTIVE",
      spending_limit: input.spendingLimit ?? DEFAULT_SPENDING_LIMIT,
      daily_limit: input.dailyLimit ?? DEFAULT_DAILY_LIMIT,
    })
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function freezeCard(userId: string, id: string) {
  const db = requireSupabase();
  const card = await getOwnedCard(db, userId, id);
  if (card.status === "REPORTED" || card.status === "REPLACED") {
    throw new HttpError(422, "Cannot freeze a reported or replaced card");
  }

  const { data, error } = await db.from("cards").update({ status: "FROZEN" }).eq("id", id).select("*").single();
  if (error) throw new HttpError(500, error.message);

  await writeAuditLog(userId, "CARD_FROZEN", "card", id);
  return data;
}

export async function unfreezeCard(userId: string, id: string) {
  const db = requireSupabase();
  const card = await getOwnedCard(db, userId, id);
  if (card.status === "REPORTED" || card.status === "REPLACED") {
    throw new HttpError(422, "Cannot unfreeze a reported or replaced card");
  }

  const { data, error } = await db.from("cards").update({ status: "ACTIVE" }).eq("id", id).select("*").single();
  if (error) throw new HttpError(500, error.message);

  await writeAuditLog(userId, "CARD_UNFROZEN", "card", id);
  return data;
}

export async function updateCardLimit(userId: string, id: string, input: UpdateLimitInput) {
  const db = requireSupabase();
  await getOwnedCard(db, userId, id);

  const patch: Record<string, unknown> = {};
  if (input.spendingLimit !== undefined) patch.spending_limit = input.spendingLimit;
  if (input.dailyLimit !== undefined) patch.daily_limit = input.dailyLimit;
  if (Object.keys(patch).length === 0) throw new HttpError(400, "No limit fields provided");

  const { data, error } = await db.from("cards").update(patch).eq("id", id).select("*").single();
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function reportCard(userId: string, id: string) {
  const db = requireSupabase();
  const card = await getOwnedCard(db, userId, id);
  if (card.status === "REPORTED" || card.status === "REPLACED") {
    throw new HttpError(422, "Card already reported");
  }

  const { data: reported, error: reportError } = await db
    .from("cards")
    .update({ status: "REPORTED" })
    .eq("id", id)
    .select("*")
    .single();
  if (reportError) throw new HttpError(500, reportError.message);

  const { data: replacement, error: replaceError } = await db
    .from("cards")
    .insert({
      user_id: userId,
      card_type: card.card_type,
      last4: randomLast4(),
      cardholder_name: card.cardholder_name,
      expiry_month: card.expiry_month,
      expiry_year: card.expiry_year,
      status: "ACTIVE",
      spending_limit: card.spending_limit,
      daily_limit: card.daily_limit,
    })
    .select("*")
    .single();
  if (replaceError) throw new HttpError(500, replaceError.message);

  await writeAuditLog(userId, "CARD_REPORTED", "card", id, { replacementCardId: replacement.id });

  return { reportedCard: reported, replacementCard: replacement };
}

export async function listCardTransactions(userId: string, id: string) {
  const db = requireSupabase();
  await getOwnedCard(db, userId, id);

  const { data, error } = await db
    .from("card_transactions")
    .select("*")
    .eq("card_id", id)
    .order("transaction_date", { ascending: false });
  if (error) throw new HttpError(500, error.message);
  return data;
}
