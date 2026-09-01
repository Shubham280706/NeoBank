export interface NormalizedBankAccount {
  providerAccountId: string;
  institutionName: string;
  accountMask: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  currency: string;
}

export interface NormalizedBankTransaction {
  providerTransactionId: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  date: string;
}

export interface BankDataProvider {
  name: "plaid" | "gocardless" | "mock";
  connectBank(userId: string, institutionId?: string): Promise<{ providerItemId: string; institutionName: string }>;
  getAccounts(providerItemId: string): Promise<NormalizedBankAccount[]>;
  getBalances(providerItemId: string): Promise<Pick<NormalizedBankAccount, "providerAccountId" | "balance" | "availableBalance">[]>;
  getTransactions(providerItemId: string, since?: string): Promise<NormalizedBankTransaction[]>;
  disconnectBank(providerItemId: string): Promise<void>;
}
