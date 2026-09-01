import Stripe from "stripe";
import { env } from "../../config/env.js";
import type { PaymentProvider, PaymentResult } from "./types.js";

function mapStatus(status: Stripe.PaymentIntent.Status): PaymentResult["status"] {
  if (status === "succeeded") return "SUCCEEDED";
  if (status === "canceled") return "FAILED";
  if (status === "requires_payment_method" || status === "requires_confirmation" || status === "requires_action") return "PROCESSING";
  return "CREATED";
}

// Stripe TEST MODE only. Never store card details — Stripe Elements/PaymentIntents
// handle that entirely on Stripe's side.
export class StripePaymentProvider implements PaymentProvider {
  name = "stripe" as const;
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.stripeSecretKey);
  }

  async createPayment(amount: number, currency: string, metadata: Record<string, string>): Promise<PaymentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true },
    });
    return { providerPaymentId: intent.id, status: mapStatus(intent.status), clientSecret: intent.client_secret ?? undefined };
  }

  async getPayment(providerPaymentId: string): Promise<PaymentResult> {
    const intent = await this.stripe.paymentIntents.retrieve(providerPaymentId);
    return { providerPaymentId: intent.id, status: mapStatus(intent.status) };
  }

  async refundPayment(providerPaymentId: string): Promise<PaymentResult> {
    await this.stripe.refunds.create({ payment_intent: providerPaymentId });
    return { providerPaymentId, status: "REFUNDED" };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  }
}
