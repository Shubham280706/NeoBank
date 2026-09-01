import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import { getPaymentProvider } from "../providers/payments/index.js";
import { createNotification } from "./notificationHelper.js";
import { writeAuditLog } from "./auditService.js";
import type { z } from "zod";
import type { createPaymentSchema } from "../validators/paymentValidator.js";

type CreateInput = z.infer<typeof createPaymentSchema>;

export async function createPayment(userId: string, input: CreateInput) {
  const db = requireSupabase();
  const provider = getPaymentProvider();

  const result = await provider.createPayment(input.amount, input.currency, { userId });

  const { data, error } = await db
    .from("payments")
    .insert({
      user_id: userId,
      amount: input.amount,
      currency: input.currency,
      provider: provider.name,
      provider_payment_id: result.providerPaymentId,
      status: result.status,
      payment_method: input.paymentMethod,
    })
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);

  await createNotification(
    userId,
    "Payment Created",
    `A payment of ${input.currency} ${input.amount} has been created.`,
    "TRANSACTION"
  );

  return { ...data, clientSecret: result.clientSecret };
}

async function getOwnedPayment(db: ReturnType<typeof requireSupabase>, userId: string, id: string) {
  const { data, error } = await db.from("payments").select("*").eq("id", id).eq("user_id", userId).single();
  if (error || !data) throw new HttpError(404, "Payment not found");
  return data;
}

export async function getPayment(userId: string, id: string) {
  const db = requireSupabase();
  const payment = await getOwnedPayment(db, userId, id);

  if (!payment.provider_payment_id) return payment;

  try {
    const provider = getPaymentProvider();
    const latest = await provider.getPayment(payment.provider_payment_id);
    if (latest.status !== payment.status) {
      const { data, error } = await db
        .from("payments")
        .update({ status: latest.status })
        .eq("id", id)
        .select("*")
        .single();
      if (!error && data) return data;
    }
  } catch (err) {
    console.error("Failed to refresh payment status", err);
  }

  return payment;
}

export async function refundPayment(userId: string, id: string) {
  const db = requireSupabase();
  const payment = await getOwnedPayment(db, userId, id);

  if (!payment.provider_payment_id) throw new HttpError(422, "Payment has no provider reference to refund");
  if (payment.status === "REFUNDED") throw new HttpError(422, "Payment already refunded");

  const provider = getPaymentProvider();
  await provider.refundPayment(payment.provider_payment_id);

  const { data, error } = await db
    .from("payments")
    .update({ status: "REFUNDED" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);

  await writeAuditLog(userId, "PAYMENT_REFUNDED", "payment", id, { amount: payment.amount, currency: payment.currency });
  await createNotification(
    userId,
    "Payment Refunded",
    `Your payment of ${payment.currency} ${payment.amount} has been refunded.`,
    "TRANSACTION"
  );

  return data;
}
