import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import { getBankProvider } from "../providers/bank/index.js";
import type { z } from "zod";
import type { linkBankSchema } from "../validators/bankValidator.js";

type LinkInput = z.infer<typeof linkBankSchema>;

export async function linkBank(userId: string, input: LinkInput) {
  const db = requireSupabase();
  const provider = getBankProvider();

  const { providerItemId, institutionName } = await provider.connectBank(userId, input.institutionId);
  const accounts = await provider.getAccounts(providerItemId);
  const accountMask = accounts[0]?.accountMask ?? null;

  const { data, error } = await db
    .from("linked_banks")
    .insert({
      user_id: userId,
      provider: provider.name,
      institution_name: institutionName,
      account_mask: accountMask,
      provider_account_id: providerItemId,
      status: "ACTIVE",
    })
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function listLinkedBanks(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("linked_banks")
    .select("*")
    .eq("user_id", userId)
    .order("linked_at", { ascending: false });
  if (error) throw new HttpError(500, error.message);
  return data;
}

async function getOwnedLinkedBank(db: ReturnType<typeof requireSupabase>, userId: string, id: string) {
  const { data, error } = await db.from("linked_banks").select("*").eq("id", id).eq("user_id", userId).single();
  if (error || !data) throw new HttpError(404, "Linked bank not found");
  return data;
}

export async function getLinkedBankAccounts(userId: string, id: string) {
  const db = requireSupabase();
  const linkedBank = await getOwnedLinkedBank(db, userId, id);
  if (!linkedBank.provider_account_id) throw new HttpError(422, "Linked bank has no provider reference");

  const provider = getBankProvider();
  return provider.getAccounts(linkedBank.provider_account_id);
}

export async function getLinkedBankTransactions(userId: string, id: string) {
  const db = requireSupabase();
  const linkedBank = await getOwnedLinkedBank(db, userId, id);
  if (!linkedBank.provider_account_id) throw new HttpError(422, "Linked bank has no provider reference");

  const provider = getBankProvider();
  return provider.getTransactions(linkedBank.provider_account_id);
}

export async function unlinkBank(userId: string, id: string) {
  const db = requireSupabase();
  const linkedBank = await getOwnedLinkedBank(db, userId, id);

  if (linkedBank.provider_account_id) {
    const provider = getBankProvider();
    await provider.disconnectBank(linkedBank.provider_account_id);
  }

  const { data, error } = await db
    .from("linked_banks")
    .update({ status: "DISCONNECTED" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);
  return data;
}
