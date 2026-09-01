import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import { createNotification } from "./notificationHelper.js";
import type { z } from "zod";
import type {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  contributeSavingsSchema,
} from "../validators/savingsValidator.js";

type CreateInput = z.infer<typeof createSavingsGoalSchema>;
type UpdateInput = z.infer<typeof updateSavingsGoalSchema>;
type ContributeInput = z.infer<typeof contributeSavingsSchema>;

export async function listSavingsGoals(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function createSavingsGoal(userId: string, input: CreateInput) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: input.name,
      target_amount: input.targetAmount,
      current_amount: input.currentAmount ?? 0,
      deadline: input.deadline ?? null,
    })
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);
  return data;
}

async function getOwnedGoal(db: ReturnType<typeof requireSupabase>, userId: string, id: string) {
  const { data, error } = await db.from("savings_goals").select("*").eq("id", id).eq("user_id", userId).single();
  if (error || !data) throw new HttpError(404, "Savings goal not found");
  return data;
}

export async function updateSavingsGoal(userId: string, id: string, input: UpdateInput) {
  const db = requireSupabase();
  await getOwnedGoal(db, userId, id);

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.targetAmount !== undefined) patch.target_amount = input.targetAmount;
  if (input.deadline !== undefined) patch.deadline = input.deadline;

  const { data, error } = await db.from("savings_goals").update(patch).eq("id", id).eq("user_id", userId).select("*").single();
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function deleteSavingsGoal(userId: string, id: string) {
  const db = requireSupabase();
  await getOwnedGoal(db, userId, id);

  const { error } = await db.from("savings_goals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new HttpError(500, error.message);
  return { success: true };
}

export async function contribute(userId: string, id: string, input: ContributeInput) {
  const db = requireSupabase();
  const goal = await getOwnedGoal(db, userId, id);

  const currentAmount = Number(goal.current_amount);
  let newAmount: number;

  if (input.type === "WITHDRAWAL") {
    if (input.amount > currentAmount) throw new HttpError(422, "Insufficient savings balance for withdrawal");
    newAmount = currentAmount - input.amount;
  } else {
    newAmount = currentAmount + input.amount;
  }

  const { error: contribError } = await db
    .from("savings_contributions")
    .insert({ goal_id: id, amount: input.amount, type: input.type });
  if (contribError) throw new HttpError(500, contribError.message);

  const { data, error } = await db
    .from("savings_goals")
    .update({ current_amount: newAmount })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);

  const verb = input.type === "WITHDRAWAL" ? "withdrawn from" : "added to";
  await createNotification(userId, "Savings Updated", `${input.amount} was ${verb} your "${goal.name}" goal.`, "INFO");

  return data;
}
