import { requireSupabase } from "../config/supabase.js";

// Shared helper for writing audit_logs rows. Never pass secrets, passwords,
// CVVs, or access tokens in `metadata`.
export async function writeAuditLog(
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata: Record<string, unknown> = {}
) {
  const db = requireSupabase();
  await db.from("audit_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata,
  });
}
