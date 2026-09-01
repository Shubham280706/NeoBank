import { randomUUID } from "crypto";
import type { BankDataProvider, NormalizedBankAccount, NormalizedBankTransaction } from "./types.js";

const MERCHANTS = ["Swiggy", "Zomato", "Amazon", "Flipkart", "Uber", "Blinkit", "Zepto", "Netflix", "Starbucks"];
const CATEGORIES = ["Food", "Shopping", "Transport", "Bills", "Entertainment", "Travel"];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Behaves like a real integration: simulates network latency and occasional
// failure, and returns realistic demo data — but never touches a real bank.
export class MockBankProvider implements BankDataProvider {
  name = "mock" as const;

  async connectBank(_userId: string, institutionId?: string) {
    await delay(400 + Math.random() * 400);
    return {
      providerItemId: `mock-item-${randomUUID()}`,
      institutionName: institutionId ?? "Demo Bank of India",
    };
  }

  async getAccounts(providerItemId: string): Promise<NormalizedBankAccount[]> {
    await delay(300);
    const balance = 25000 + Math.round(Math.random() * 75000);
    return [
      {
        providerAccountId: `${providerItemId}-acc-1`,
        institutionName: "Demo Bank of India",
        accountMask: String(1000 + Math.floor(Math.random() * 9000)),
        accountType: "SAVINGS",
        balance,
        availableBalance: balance,
        currency: "INR",
      },
    ];
  }

  async getBalances(providerItemId: string) {
    await delay(150);
    return [
      {
        providerAccountId: `${providerItemId}-acc-1`,
        balance: 25000 + Math.round(Math.random() * 75000),
        availableBalance: 25000 + Math.round(Math.random() * 75000),
      },
    ];
  }

  async getTransactions(providerItemId: string): Promise<NormalizedBankTransaction[]> {
    await delay(350);
    return Array.from({ length: 10 }).map((_, i) => ({
      providerTransactionId: `${providerItemId}-txn-${i}-${randomUUID()}`,
      amount: Math.round(Math.random() * 3000) + 50,
      currency: "INR",
      merchant: MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)],
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      date: new Date(Date.now() - i * 86400000).toISOString(),
    }));
  }

  async disconnectBank(_providerItemId: string) {
    await delay(200);
  }
}
