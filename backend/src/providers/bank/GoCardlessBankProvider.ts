import { env } from "../../config/env.js";
import type { BankDataProvider, NormalizedBankAccount, NormalizedBankTransaction } from "./types.js";

const BASE_URL = "https://bankaccountdata.gocardless.com/api/v2";

// GoCardless Bank Account Data (formerly Nordigen). Uses their sandbox
// institution ("SANDBOXFINANCE_SFIN0000") for safe end-to-end testing.
export class GoCardlessBankProvider implements BankDataProvider {
  name = "gocardless" as const;
  private accessToken: string | null = null;

  private async authenticate(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    const res = await fetch(`${BASE_URL}/token/new/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret_id: env.gocardlessSecretId, secret_key: env.gocardlessSecretKey }),
    });
    if (!res.ok) throw new Error(`GoCardless auth failed: ${res.status}`);
    const data = await res.json();
    this.accessToken = data.access;
    return this.accessToken!;
  }

  private async authedFetch(path: string, init?: RequestInit) {
    const token = await this.authenticate();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`GoCardless request failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async connectBank(_userId: string, institutionId = "SANDBOXFINANCE_SFIN0000") {
    const agreement = await this.authedFetch("/agreements/enduser/", {
      method: "POST",
      body: JSON.stringify({ institution_id: institutionId, max_historical_days: 90, access_valid_for_days: 90, access_scope: ["balances", "details", "transactions"] }),
    });
    const requisition = await this.authedFetch("/requisitions/", {
      method: "POST",
      body: JSON.stringify({
        redirect: env.frontendUrl,
        institution_id: institutionId,
        agreement: agreement.id,
      }),
    });
    // requisition.id is the "providerItemId"; requisition.link is where a real
    // user would authenticate with their bank in the sandbox flow.
    return { providerItemId: requisition.id, institutionName: institutionId };
  }

  async getAccounts(requisitionId: string): Promise<NormalizedBankAccount[]> {
    const requisition = await this.authedFetch(`/requisitions/${requisitionId}/`);
    const accounts: NormalizedBankAccount[] = [];
    for (const accountId of requisition.accounts ?? []) {
      const details = await this.authedFetch(`/accounts/${accountId}/details/`);
      const balances = await this.authedFetch(`/accounts/${accountId}/balances/`);
      const bal = balances.balances?.[0]?.balanceAmount;
      accounts.push({
        providerAccountId: accountId,
        institutionName: requisition.institution_id,
        accountMask: (details.account?.iban ?? "").slice(-4) || "0000",
        accountType: "SAVINGS",
        balance: Number(bal?.amount ?? 0),
        availableBalance: Number(bal?.amount ?? 0),
        currency: bal?.currency ?? "EUR",
      });
    }
    return accounts;
  }

  async getBalances(requisitionId: string) {
    const accounts = await this.getAccounts(requisitionId);
    return accounts.map((a) => ({ providerAccountId: a.providerAccountId, balance: a.balance, availableBalance: a.availableBalance }));
  }

  async getTransactions(requisitionId: string): Promise<NormalizedBankTransaction[]> {
    const requisition = await this.authedFetch(`/requisitions/${requisitionId}/`);
    const results: NormalizedBankTransaction[] = [];
    for (const accountId of requisition.accounts ?? []) {
      const txns = await this.authedFetch(`/accounts/${accountId}/transactions/`);
      for (const t of txns.transactions?.booked ?? []) {
        results.push({
          providerTransactionId: t.transactionId ?? `${accountId}-${t.bookingDate}-${Math.random()}`,
          amount: Math.abs(Number(t.transactionAmount?.amount ?? 0)),
          currency: t.transactionAmount?.currency ?? "EUR",
          merchant: t.creditorName ?? t.debtorName ?? "Unknown",
          category: "Other",
          date: t.bookingDate,
        });
      }
    }
    return results;
  }

  async disconnectBank(requisitionId: string) {
    await this.authedFetch(`/requisitions/${requisitionId}/`, { method: "DELETE" });
  }
}
