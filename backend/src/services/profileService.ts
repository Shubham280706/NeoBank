import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";

// The `handle_new_user` Postgres trigger (supabase/migrations/0001_init_schema.sql)
// normally creates a profiles row the instant a user signs up. But it can
// legitimately miss a user — e.g. an account created before the trigger
// existed, or via a path that bypasses it — and every downstream feature
// (auth/me, card creation, KYC, ...) depends on a profile existing. Rather
// than 404ing anywhere that reads it, self-heal by creating one lazily from
// the auth user's own metadata, mirroring what the trigger would have done.
export async function ensureProfile(userId: string) {
  const db = requireSupabase();

  const { data: existing, error } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (existing) return existing;

  const { data: authUser } = await db.auth.admin.getUserById(userId);
  const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const email = authUser?.user?.email ?? "";
  const upiId = `${(meta.first_name || email.split("@")[0] || "user").toLowerCase()}${userId.slice(0, 4)}@neo`;

  const { data: created, error: insertError } = await db
    .from("profiles")
    .insert({
      id: userId,
      first_name: meta.first_name ?? "",
      last_name: meta.last_name ?? "",
      phone: meta.phone ?? null,
      date_of_birth: meta.dob ?? null,
      upi_id: upiId,
    })
    .select("*")
    .single();
  if (insertError) throw new HttpError(500, "Could not initialize profile");
  return created;
}
