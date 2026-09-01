import { randomUUID } from "crypto";
import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { z } from "zod";
import type { createAccountSchema, depositSchema } from "../validators/accountValidator.js";

type CreateAccountInput = z.infer<typeof createAccountSchema>;
type DepositInput = z.infer<typeof depositSchema>;

function randomAccountNumber(): string {
  let s = "";
  for (let i = 0; i < 12; i++) s += Math.floor(Math.random() * 10);
  return s;
}

const DEMO_IFSC = "NEOB0000001";

export async function listAccounts(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db.from("bank_accounts").select("*").eq("user_id", userId).order("created_at");
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function getAccount(userId: string, accountId: string) {
  const db = requireSupabase();
  const { data, error } = await db.from("bank_accounts").select("*").eq("user_id", userId).eq("id", accountId).single();
  if (error) throw new HttpError(404, "Account not found");
  return data;
}

export async function getBalance(userId: string, accountId: string) {
  const account = await getAccount(userId, accountId);
  return { balance: account.balance, availableBalance: account.available_balance, currency: account.currency };
}

// Self-serve account opening. Real neo-banks gate this behind KYC — this app
// enforces that at the frontend route level (KycGate), so by the time a
// request reaches here the user has already passed verification.
export async function createAccount(userId: string, input: CreateAccountInput) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("bank_accounts")
    .insert({
      user_id: userId,
      account_number: randomAccountNumber(),
      ifsc: DEMO_IFSC,
      account_type: input.accountType,
      balance: 0,
      available_balance: 0,
      currency: "INR",
      status: "ACTIVE",
    })
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);
  return data;
}

// Simulated top-up ("Add Money") — represents funds arriving from an
// external source (UPI, linked bank, cash deposit). Nothing external is
// actually contacted; this directly credits the account atomically via the
// deposit_money() Postgres function, same integrity pattern as transfers.
export async function deposit(userId: string, accountId: string, input: DepositInput) {
  const db = requireSupabase();
  const referenceNumber = `DEP${Date.now()}${randomUUID().slice(0, 6).toUpperCase()}`;

  const { data, error } = await db.rpc("deposit_money", {
    p_user_id: userId,
    p_account_id: accountId,
    p_amount: input.amount,
    p_remarks: input.remarks ?? null,
    p_reference_number: referenceNumber,
  });

  if (error) {
    if (error.message.includes("ACCOUNT_NOT_FOUND_OR_NOT_OWNED")) throw new HttpError(404, "Account not found");
    if (error.message.includes("ACCOUNT_NOT_ACTIVE")) throw new HttpError(422, "Account is not active");
    throw new HttpError(500, error.message);
  }

  return data?.[0];
}
