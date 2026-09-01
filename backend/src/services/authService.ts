import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function getMe(userId: string) {
  const db = requireSupabase();

  const { data: profile, error: profileError } = await db.from("profiles").select("*").eq("id", userId).single();
  if (profileError || !profile) throw new HttpError(404, "Profile not found");

  const { data: accounts, error: accountsError } = await db
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (accountsError) throw new HttpError(500, accountsError.message);

  return { ...profile, bank_accounts: accounts ?? [] };
}
