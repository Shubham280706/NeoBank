import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { env } from "../../config/env.js";
import type { BankDataProvider, NormalizedBankAccount, NormalizedBankTransaction } from "./types.js";

// Plaid Sandbox only. Client secrets never leave the backend.
export class PlaidBankProvider implements BankDataProvider {
  name = "plaid" as const;
  private client: PlaidApi;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[env.plaidEnv as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": env.plaidClientId,
          "PLAID-SECRET": env.plaidSecret,
        },
      },
    });
    this.client = new PlaidApi(configuration);
  }

  // In Plaid's real flow, the frontend uses Link to obtain a public_token which
  // the backend exchanges for an access_token. For this sandbox demo we use
  // Plaid's sandbox/public_token/create to simulate that handshake server-side.
  async connectBank(_userId: string, institutionId = "ins_109508") {
    const sandboxTokenRes = await this.client.sandboxPublicTokenCreate({
      institution_id: institutionId,
      initial_products: ["transactions" as any],
    });
    const exchangeRes = await this.client.itemPublicTokenExchange({
      public_token: sandboxTokenRes.data.public_token,
    });
    const itemRes = await this.client.itemGet({ access_token: exchangeRes.data.access_token });
    const institutionName = itemRes.data.item.institution_id ?? "Plaid Sandbox Bank";
    // access_token is the real "providerItemId" we must persist to call Plaid again.
    return { providerItemId: exchangeRes.data.access_token, institutionName };
  }

  async getAccounts(accessToken: string): Promise<NormalizedBankAccount[]> {
    const res = await this.client.accountsGet({ access_token: accessToken });
    return res.data.accounts.map((a) => ({
      providerAccountId: a.account_id,
      institutionName: "Plaid Sandbox Bank",
      accountMask: a.mask ?? "0000",
      accountType: (a.subtype ?? a.type ?? "SAVINGS").toString().toUpperCase(),
      balance: a.balances.current ?? 0,
      availableBalance: a.balances.available ?? a.balances.current ?? 0,
      currency: a.balances.iso_currency_code ?? "USD",
    }));
  }

  async getBalances(accessToken: string) {
    const res = await this.client.accountsBalanceGet({ access_token: accessToken });
    return res.data.accounts.map((a) => ({
      providerAccountId: a.account_id,
      balance: a.balances.current ?? 0,
      availableBalance: a.balances.available ?? a.balances.current ?? 0,
    }));
  }

  async getTransactions(accessToken: string, since?: string): Promise<NormalizedBankTransaction[]> {
    const startDate = since ?? new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    const endDate = new Date().toISOString().slice(0, 10);
    const res = await this.client.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });
    return res.data.transactions.map((t) => ({
      providerTransactionId: t.transaction_id,
      amount: Math.abs(t.amount),
      currency: t.iso_currency_code ?? "USD",
      merchant: t.merchant_name ?? t.name,
      category: t.personal_finance_category?.primary ?? t.category?.[0] ?? "Other",
      date: t.date,
    }));
  }

  async disconnectBank(accessToken: string) {
    await this.client.itemRemove({ access_token: accessToken });
  }
}
