import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "./env.js";

// Service-role client: full DB access, backend-only, bypasses RLS.
// Never expose this client or its key to the frontend.
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// Client used only to verify user JWTs from the Authorization header.
export const supabaseAuthClient = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export function requireSupabase() {
  if (!supabaseAdmin) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return supabaseAdmin;
}
