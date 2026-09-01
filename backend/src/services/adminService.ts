import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import { env, effectiveBankProvider, effectivePaymentProvider, isSupabaseConfigured } from "../config/env.js";

function paginate(page: number, limit: number) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
}

export async function listUsers(page: number, limit: number) {
  const db = requireSupabase();
  const { from, to } = paginate(page, limit);

  const { data: profiles, error, count } = await db
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new HttpError(500, error.message);

  const enriched = await Promise.all(
    (profiles ?? []).map(async (profile: any) => {
      const { data: accounts } = await db.from("bank_accounts").select("balance").eq("user_id", profile.id);
      const accountCount = accounts?.length ?? 0;
      const balanceSum = (accounts ?? []).reduce((s: number, a: any) => s + Number(a.balance), 0);
      return { ...profile, accountCount, balanceSum };
    })
  );

  return { data: enriched, page, limit, total: count ?? 0 };
}

export async function listTransactions(
  page: number,
  limit: number,
  filters: { status?: string; type?: "CREDIT" | "DEBIT" }
) {
  const db = requireSupabase();
  const { from, to } = paginate(page, limit);

  let query = db.from("transactions").select("*", { count: "exact" }).order("transaction_date", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.type) query = query.eq("type", filters.type);

  const { data, error, count } = await query.range(from, to);
  if (error) throw new HttpError(500, error.message);
  return { data, page, limit, total: count ?? 0 };
}

export async function listKyc(page: number, limit: number, status?: string) {
  const db = requireSupabase();
  const { from, to } = paginate(page, limit);

  let query = db.from("kyc_verifications").select("*", { count: "exact" }).order("submitted_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query.range(from, to);
  if (error) throw new HttpError(500, error.message);
  return { data, page, limit, total: count ?? 0 };
}

export async function getPlatformAnalytics() {
  const db = requireSupabase();

  const [
    { count: totalUsers },
    { count: totalAccounts },
    { data: transactions, count: totalTransactions },
    { count: successfulTransfers },
    { count: failedTransfers },
    { count: pendingKyc },
    { count: verifiedKyc },
    { count: activeCards },
  ] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("bank_accounts").select("*", { count: "exact", head: true }),
    db.from("transactions").select("amount", { count: "exact" }),
    db.from("transfers").select("*", { count: "exact", head: true }).eq("status", "SUCCESS"),
    db.from("transfers").select("*", { count: "exact", head: true }).eq("status", "FAILED"),
    db.from("kyc_verifications").select("*", { count: "exact", head: true }).in("status", ["SUBMITTED", "PROCESSING"]),
    db.from("kyc_verifications").select("*", { count: "exact", head: true }).eq("status", "VERIFIED"),
    db.from("cards").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
  ]);

  const totalTransactionVolume = (transactions ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);

  return {
    totalUsers: totalUsers ?? 0,
    totalAccounts: totalAccounts ?? 0,
    totalTransactions: totalTransactions ?? 0,
    totalTransactionVolume,
    successfulTransfers: successfulTransfers ?? 0,
    failedTransfers: failedTransfers ?? 0,
    pendingKyc: pendingKyc ?? 0,
    verifiedKyc: verifiedKyc ?? 0,
    activeCards: activeCards ?? 0,
  };
}

export function getSystemHealth() {
  return {
    status: "ok" as const,
    demoMode: env.demoMode,
    bankProvider: effectiveBankProvider,
    paymentProvider: effectivePaymentProvider,
    supabaseConfigured: isSupabaseConfigured,
    timestamp: new Date().toISOString(),
  };
}

export async function listAuditLogs(page: number, limit: number) {
  const db = requireSupabase();
  const { from, to } = paginate(page, limit);

  const { data, error, count } = await db
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new HttpError(500, error.message);
  return { data, page, limit, total: count ?? 0 };
}
