import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listNotifications(userId: string, page: number, limit: number) {
  const db = requireSupabase();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await db
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new HttpError(500, error.message);

  return { data, page, limit, total: count ?? 0 };
}

export async function markAsRead(userId: string, id: string) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error || !data) throw new HttpError(404, "Notification not found");
  return data;
}

export async function markAllAsRead(userId: string) {
  const db = requireSupabase();
  const { error } = await db.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) throw new HttpError(500, error.message);
  return { success: true };
}
