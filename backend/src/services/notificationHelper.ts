import { requireSupabase } from "../config/supabase.js";

export type NotificationType = "INFO" | "TRANSACTION" | "TRANSFER" | "KYC" | "BUDGET" | "SECURITY";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "INFO"
) {
  const db = requireSupabase();
  await db.from("notifications").insert({ user_id: userId, title, message, type });
}
