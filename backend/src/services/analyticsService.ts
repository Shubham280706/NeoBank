import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";

function monthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

export async function getOverview(userId: string) {
  const db = requireSupabase();
  const { start, end } = monthRange(new Date());

  const { data, error } = await db
    .from("transactions")
    .select("amount, type")
    .eq("user_id", userId)
    .gte("transaction_date", start.toISOString())
    .lt("transaction_date", end.toISOString());
  if (error) throw new HttpError(500, error.message);

  const rows = data ?? [];
  const totalSpending = rows.filter((r: any) => r.type === "DEBIT").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const totalIncome = rows.filter((r: any) => r.type === "CREDIT").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const amounts = rows.map((r: any) => Number(r.amount));
  const transactionCount = rows.length;
  const averageTransaction = transactionCount > 0 ? amounts.reduce((s, a) => s + a, 0) / transactionCount : 0;
  const largestTransaction = amounts.length > 0 ? Math.max(...amounts) : 0;

  return {
    totalSpending,
    totalIncome,
    averageTransaction: Number(averageTransaction.toFixed(2)),
    largestTransaction,
    transactionCount,
  };
}

function dateKey(d: Date, groupBy: "day" | "week"): string {
  if (groupBy === "day") return d.toISOString().slice(0, 10);
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
}

export async function getSpending(userId: string, from?: string, to?: string, groupBy: "day" | "week" = "day") {
  const db = requireSupabase();

  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await db
    .from("transactions")
    .select("amount, transaction_date")
    .eq("user_id", userId)
    .eq("type", "DEBIT")
    .gte("transaction_date", fromDate.toISOString())
    .lte("transaction_date", toDate.toISOString())
    .order("transaction_date");
  if (error) throw new HttpError(500, error.message);

  const buckets = new Map<string, number>();
  for (const row of data ?? []) {
    const key = dateKey(new Date((row as any).transaction_date), groupBy);
    buckets.set(key, (buckets.get(key) ?? 0) + Number((row as any).amount));
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, amount]) => ({ date, amount }));
}

export async function getCategories(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("transactions")
    .select("amount, category")
    .eq("user_id", userId)
    .eq("type", "DEBIT");
  if (error) throw new HttpError(500, error.message);

  const rows = data ?? [];
  const total = rows.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const buckets = new Map<string, number>();
  for (const row of rows) {
    const category = (row as any).category ?? "Other";
    buckets.set(category, (buckets.get(category) ?? 0) + Number((row as any).amount));
  }

  return Array.from(buckets.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Number(((amount / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getMonthly(userId: string, months: number) {
  const db = requireSupabase();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const { data, error } = await db
    .from("transactions")
    .select("amount, type, transaction_date")
    .eq("user_id", userId)
    .gte("transaction_date", start.toISOString());
  if (error) throw new HttpError(500, error.message);

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { income: 0, expense: 0 });
  }

  for (const row of data ?? []) {
    const d = new Date((row as any).transaction_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if ((row as any).type === "CREDIT") bucket.income += Number((row as any).amount);
    else bucket.expense += Number((row as any).amount);
  }

  return Array.from(buckets.entries()).map(([month, { income, expense }]) => ({ month, income, expense }));
}
