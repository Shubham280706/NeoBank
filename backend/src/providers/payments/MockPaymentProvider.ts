import { randomUUID } from "crypto";
import type { PaymentProvider, PaymentResult } from "./types.js";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const store = new Map<string, PaymentResult>();

export class MockPaymentProvider implements PaymentProvider {
  name = "mock" as const;

  async createPayment(_amount: number, _currency: string, _metadata: Record<string, string>): Promise<PaymentResult> {
    await delay(300);
    const id = `mock-pay-${randomUUID()}`;
    // Simulate a ~92% success rate, like a real gateway would occasionally decline.
    const succeeded = Math.random() > 0.08;
    const result: PaymentResult = { providerPaymentId: id, status: succeeded ? "SUCCEEDED" : "FAILED" };
    store.set(id, result);
    return result;
  }

  async getPayment(providerPaymentId: string): Promise<PaymentResult> {
    await delay(100);
    return store.get(providerPaymentId) ?? { providerPaymentId, status: "FAILED" };
  }

  async refundPayment(providerPaymentId: string): Promise<PaymentResult> {
    await delay(200);
    const result: PaymentResult = { providerPaymentId, status: "REFUNDED" };
    store.set(providerPaymentId, result);
    return result;
  }
}
