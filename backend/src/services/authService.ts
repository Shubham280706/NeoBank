import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import { ensureProfile } from "./profileService.js";

export async function getMe(userId: string) {
  const db = requireSupabase();

  const profile = await ensureProfile(userId);

  const { data: accounts, error: accountsError } = await db
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (accountsError) throw new HttpError(500, accountsError.message);

  return { ...profile, bank_accounts: accounts ?? [] };
}
