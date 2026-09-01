import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { z } from "zod";
import type { createBudgetSchema, updateBudgetSchema } from "../validators/budgetValidator.js";

type CreateInput = z.infer<typeof createBudgetSchema>;
type UpdateInput = z.infer<typeof updateBudgetSchema>;

function periodStart(period: string): Date {
  const now = new Date();
  if (period === "weekly") {
    const day = now.getDay(); // 0 = Sunday
    const diffToMonday = (day + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "yearly") {
    return new Date(now.getFullYear(), 0, 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function computeSpent(db: ReturnType<typeof requireSupabase>, userId: string, category: string, period: string) {
  const start = periodStart(period);
  const { data, error } = await db
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("category", category)
    .eq("type", "DEBIT")
    .gte("transaction_date", start.toISOString());
  if (error) throw new HttpError(500, error.message);
  return (data ?? []).reduce((sum, row: any) => sum + Number(row.amount), 0);
}

export async function listBudgets(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db.from("budgets").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new HttpError(500, error.message);

  const budgets = data ?? [];
  return Promise.all(
    budgets.map(async (budget: any) => {
      const spent = await computeSpent(db, userId, budget.category, budget.period);
      const remaining = Number(budget.amount) - spent;
      const percentUsed = Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0;
      return { ...budget, spent, remaining, percentUsed };
    })
  );
}

export async function createBudget(userId: string, input: CreateInput) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("budgets")
    .insert({ user_id: userId, category: input.category, amount: input.amount, period: input.period })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "A budget for this category and period already exists");
    throw new HttpError(500, error.message);
  }
  return data;
}

async function ensureOwned(db: ReturnType<typeof requireSupabase>, userId: string, id: string) {
  const { data, error } = await db.from("budgets").select("id").eq("id", id).eq("user_id", userId).single();
  if (error || !data) throw new HttpError(404, "Budget not found");
}

export async function updateBudget(userId: string, id: string, input: UpdateInput) {
  const db = requireSupabase();
  await ensureOwned(db, userId, id);

  const patch: Record<string, unknown> = {};
  if (input.category !== undefined) patch.category = input.category;
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.period !== undefined) patch.period = input.period;

  const { data, error } = await db.from("budgets").update(patch).eq("id", id).eq("user_id", userId).select("*").single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "A budget for this category and period already exists");
    throw new HttpError(500, error.message);
  }
  return data;
}

export async function deleteBudget(userId: string, id: string) {
  const db = requireSupabase();
  await ensureOwned(db, userId, id);

  const { error } = await db.from("budgets").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new HttpError(500, error.message);
  return { success: true };
}
