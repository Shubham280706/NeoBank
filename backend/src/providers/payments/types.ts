export interface PaymentResult {
  providerPaymentId: string;
  status: "CREATED" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  clientSecret?: string;
}

export interface PaymentProvider {
  name: "stripe" | "mock";
  createPayment(amount: number, currency: string, metadata: Record<string, string>): Promise<PaymentResult>;
  getPayment(providerPaymentId: string): Promise<PaymentResult>;
  refundPayment(providerPaymentId: string): Promise<PaymentResult>;
}
