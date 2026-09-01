import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { z } from "zod";
import type { listTransactionsQuerySchema } from "../validators/transactionValidator.js";

type ListQuery = z.infer<typeof listTransactionsQuerySchema>;

export async function listTransactions(userId: string, query: ListQuery) {
  const db = requireSupabase();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let q = db.from("transactions").select("*", { count: "exact" }).eq("user_id", userId);

  if (query.category) q = q.eq("category", query.category);
  if (query.status) q = q.eq("status", query.status);
  if (query.type) q = q.eq("type", query.type);
  if (query.dateFrom) q = q.gte("transaction_date", query.dateFrom);
  if (query.dateTo) q = q.lte("transaction_date", query.dateTo);
  if (query.search) {
    q = q.or(`merchant.ilike.%${query.search}%,description.ilike.%${query.search}%,reference_number.ilike.%${query.search}%`);
  }

  const { data, error, count } = await q.order("transaction_date", { ascending: false }).range(from, to);
  if (error) throw new HttpError(500, error.message);

  return { data, page: query.page, pageSize: query.pageSize, total: count ?? 0 };
}

export async function getTransaction(userId: string, id: string) {
  const db = requireSupabase();
  const { data, error } = await db.from("transactions").select("*").eq("user_id", userId).eq("id", id).single();
  if (error) throw new HttpError(404, "Transaction not found");
  return data;
}
