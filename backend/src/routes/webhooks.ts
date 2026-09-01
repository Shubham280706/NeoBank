import { Router } from "express";
import express from "express";
import { env, effectivePaymentProvider } from "../config/env.js";
import { requireSupabase } from "../config/supabase.js";
import { StripePaymentProvider } from "../providers/payments/StripePaymentProvider.js";
import { createNotification } from "../services/notificationHelper.js";

export const webhookRouter = Router();

// Stripe requires the raw request body (not JSON-parsed) to verify signatures.
webhookRouter.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  // MockPaymentProvider never emits webhooks — only actually verify/process
  // when Stripe is the effective provider and a webhook secret is configured.
  if (effectivePaymentProvider !== "stripe" || !env.stripeWebhookSecret) {
    return res.status(200).json({ received: true });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "Missing Stripe signature" });
  }

  try {
    const provider = new StripePaymentProvider();
    const event = provider.verifyWebhookSignature(req.body as Buffer, signature);

    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as { id: string; metadata?: Record<string, string> };
      const status = event.type === "payment_intent.succeeded" ? "SUCCEEDED" : "FAILED";

      const db = requireSupabase();
      const { data: payment } = await db
        .from("payments")
        .update({ status })
        .eq("provider_payment_id", intent.id)
        .select("*")
        .single();

      if (payment) {
        const title = status === "SUCCEEDED" ? "Payment Succeeded" : "Payment Failed";
        const message =
          status === "SUCCEEDED"
            ? `Your payment of ${payment.currency} ${payment.amount} succeeded.`
            : `Your payment of ${payment.currency} ${payment.amount} failed.`;
        await createNotification(payment.user_id, title, message, "TRANSACTION");
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error", err);
    res.status(400).json({ error: "Webhook signature verification failed" });
  }
});
