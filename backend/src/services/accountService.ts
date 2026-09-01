import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listAccounts(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db.from("bank_accounts").select("*").eq("user_id", userId).order("created_at");
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function getAccount(userId: string, accountId: string) {
  const db = requireSupabase();
  const { data, error } = await db.from("bank_accounts").select("*").eq("user_id", userId).eq("id", accountId).single();
  if (error) throw new HttpError(404, "Account not found");
  return data;
}

export async function getBalance(userId: string, accountId: string) {
  const account = await getAccount(userId, accountId);
  return { balance: account.balance, availableBalance: account.available_balance, currency: account.currency };
}
