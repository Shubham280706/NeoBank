// Seed script for the simulated Indian neo-banking demo.
//
// This is a standalone TypeScript script (no build step) that populates a
// fresh Supabase project with realistic demo data using the SERVICE ROLE
// key, which bypasses RLS. It is meant to be run once against a project
// that has already had the migrations in supabase/migrations applied.
//
// Run from the repo root with:
//   npx tsx supabase/seed/seed.ts
// or:
//   npm run seed
//
// NOTHING in this script touches real money, real banks, or real identity
// documents — everything is synthetic demo data.

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { randomUUID, createHash } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Copy .env.example to .env at the repo root and fill in your Supabase project's URL and service role key before seeding."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "DemoPass123!";

// ---------------------------------------------------------------------------
// Static demo data
// ---------------------------------------------------------------------------

interface DemoUserSeed {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  isAdmin?: boolean;
}

const DEMO_USERS: DemoUserSeed[] = [
  { firstName: "Priya", lastName: "Sharma", email: "priya.sharma@demo.neo", phone: "+91-98765-43210", dob: "1994-03-12", isAdmin: true },
  { firstName: "Rahul", lastName: "Verma", email: "rahul.verma@demo.neo", phone: "+91-98765-43211", dob: "1991-07-24" },
  { firstName: "Ananya", lastName: "Iyer", email: "ananya.iyer@demo.neo", phone: "+91-98765-43212", dob: "1996-11-02" },
  { firstName: "Vikram", lastName: "Singh", email: "vikram.singh@demo.neo", phone: "+91-98765-43213", dob: "1989-01-30" },
  { firstName: "Neha", lastName: "Gupta", email: "neha.gupta@demo.neo", phone: "+91-98765-43214", dob: "1998-05-18" },
];

const BENEFICIARY_NAMES = [
  { name: "Arjun Mehta", bank: "HDFC Bank" },
  { name: "Kavita Rao", bank: "ICICI Bank" },
  { name: "Sanjay Kapoor", bank: "State Bank of India" },
  { name: "Divya Nair", bank: "Axis Bank" },
  { name: "Rohan Malhotra", bank: "Kotak Mahindra Bank" },
  { name: "Meera Pillai", bank: "Punjab National Bank" },
  { name: "Karan Chopra", bank: "Yes Bank" },
  { name: "Sneha Reddy", bank: "IDFC First Bank" },
  { name: "Aditya Joshi", bank: "Bank of Baroda" },
  { name: "Pooja Desai", bank: "IndusInd Bank" },
  { name: "Manish Agarwal", bank: "Union Bank of India" },
  { name: "Ritu Bhatia", bank: "Canara Bank" },
];

const DEBIT_MERCHANTS: Array<{ merchant: string; category: string }> = [
  { merchant: "Swiggy", category: "Food" },
  { merchant: "Zomato", category: "Food" },
  { merchant: "Amazon", category: "Shopping" },
  { merchant: "Flipkart", category: "Shopping" },
  { merchant: "Uber", category: "Transport" },
  { merchant: "Ola", category: "Transport" },
  { merchant: "Blinkit", category: "Food" },
  { merchant: "Zepto", category: "Food" },
  { merchant: "Netflix", category: "Entertainment" },
  { merchant: "Spotify", category: "Entertainment" },
  { merchant: "Starbucks", category: "Food" },
  { merchant: "BookMyShow", category: "Entertainment" },
  { merchant: "Electricity Bill", category: "Bills" },
  { merchant: "Airtel Postpaid", category: "Bills" },
  { merchant: "IRCTC", category: "Travel" },
  { merchant: "MakeMyTrip", category: "Travel" },
  { merchant: "Myntra", category: "Shopping" },
  { merchant: "Big Basket", category: "Food" },
  { merchant: "Apollo Pharmacy", category: "Other" },
  { merchant: "Decathlon", category: "Shopping" },
];

const BUDGET_CATEGORIES = ["Food", "Shopping", "Transport", "Entertainment", "Bills"];

const IFSC_BANKS = [
  { ifsc: "HDFC0001234", bank: "HDFC Bank" },
  { ifsc: "ICIC0005678", bank: "ICICI Bank" },
  { ifsc: "SBIN0009012", bank: "State Bank of India" },
  { ifsc: "UTIB0003456", bank: "Axis Bank" },
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function randomAccountNumber(): string {
  let s = "";
  for (let i = 0; i < 12; i++) s += randInt(0, 9);
  return s;
}

function randomLast4(): string {
  return String(randInt(1000, 9999));
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function referenceNumber(prefix: string): string {
  return `${prefix}${Date.now()}${randomUUID().slice(0, 6).toUpperCase()}${randInt(100, 999)}`;
}

async function insertOrThrow<T = any>(label: string, promise: PromiseLike<{ data: T; error: any }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data as T;
}

// ---------------------------------------------------------------------------
// Seeding steps
// ---------------------------------------------------------------------------

async function createDemoUser(seed: DemoUserSeed): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: seed.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: seed.firstName, last_name: seed.lastName },
  });

  if (error) {
    // Already exists from a previous run — look the user up instead of failing.
    if (error.message.toLowerCase().includes("already") || error.status === 422) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users.find((u: { email?: string }) => u.email === seed.email);
      if (existing) {
        console.log(`  (already exists) ${seed.email}`);
        return existing.id;
      }
    }
    console.error(`  Failed to create ${seed.email}:`, error.message);
    return null;
  }

  const userId = data.user?.id;
  if (!userId) return null;

  // handle_new_user trigger already created the profiles row; fill in the rest.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ phone: seed.phone, date_of_birth: seed.dob })
    .eq("id", userId);
  if (profileError) console.error(`  Failed to update profile for ${seed.email}:`, profileError.message);

  if (seed.isAdmin) {
    const { error: roleError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
    if (roleError) console.error(`  Failed to make ${seed.email} admin:`, roleError.message);
  }

  console.log(`  Created ${seed.email}${seed.isAdmin ? " (admin)" : ""}`);
  return userId;
}

async function seedAccountsForUser(userId: string, name: string) {
  const numAccounts = randInt(1, 2);
  const accounts: any[] = [];

  for (let i = 0; i < numAccounts; i++) {
    const { ifsc, bank } = pick(IFSC_BANKS);
    const balance = round2(20000 + Math.random() * 130000);
    const account = await insertOrThrow(
      `bank_accounts insert (${name})`,
      supabase
        .from("bank_accounts")
        .insert({
          user_id: userId,
          account_number: randomAccountNumber(),
          ifsc,
          account_type: i === 0 ? "SAVINGS" : "CURRENT",
          balance,
          available_balance: balance,
          currency: "INR",
          status: "ACTIVE",
        })
        .select("*")
        .single()
    );
    accounts.push({ ...account, bankName: bank });
  }

  return accounts;
}

async function seedCardForUser(userId: string, name: string) {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + randInt(2, 4));
  return insertOrThrow(
    `cards insert (${name})`,
    supabase
      .from("cards")
      .insert({
        user_id: userId,
        card_type: "VIRTUAL",
        last4: randomLast4(),
        cardholder_name: name.toUpperCase(),
        expiry_month: expiry.getMonth() + 1,
        expiry_year: expiry.getFullYear(),
        status: "ACTIVE",
        spending_limit: pick([50000, 75000, 100000, 150000]),
        daily_limit: pick([10000, 15000, 25000]),
      })
      .select("*")
      .single()
  );
}

async function seedBudgetsForUser(userId: string, name: string) {
  const categories = [...BUDGET_CATEGORIES].sort(() => Math.random() - 0.5).slice(0, randInt(2, 3));
  const budgets: any[] = [];
  for (const category of categories) {
    const budget = await insertOrThrow(
      `budgets insert (${name}/${category})`,
      supabase
        .from("budgets")
        .insert({
          user_id: userId,
          category,
          amount: pick([3000, 5000, 8000, 10000, 15000]),
          period: "monthly",
        })
        .select("*")
        .single()
    );
    budgets.push(budget);
  }
  return budgets;
}

async function seedSavingsForUser(userId: string, name: string) {
  const goalNames = ["Emergency Fund", "Goa Trip", "New Laptop", "Wedding Fund", "Home Down Payment"];
  const numGoals = randInt(1, 2);
  const picked = [...goalNames].sort(() => Math.random() - 0.5).slice(0, numGoals);
  const goals: any[] = [];

  for (const goalName of picked) {
    const target = pick([20000, 50000, 100000, 250000, 500000]);
    const current = round2(target * (0.1 + Math.random() * 0.5));
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + randInt(3, 18));

    const goal = await insertOrThrow(
      `savings_goals insert (${name}/${goalName})`,
      supabase
        .from("savings_goals")
        .insert({
          user_id: userId,
          name: goalName,
          target_amount: target,
          current_amount: current,
          deadline: deadline.toISOString().slice(0, 10),
        })
        .select("*")
        .single()
    );
    goals.push(goal);

    const numContributions = randInt(2, 4);
    let running = 0;
    for (let i = 0; i < numContributions; i++) {
      const amount = round2(current / numContributions);
      running += amount;
      await supabase.from("savings_contributions").insert({
        goal_id: goal.id,
        amount,
        type: "CONTRIBUTION",
        created_at: daysAgo(randInt(5, 150)).toISOString(),
      });
    }
  }
  return goals;
}

async function seedBeneficiariesForUser(userId: string) {
  const numBeneficiaries = randInt(2, 3);
  const chosen = [...BENEFICIARY_NAMES].sort(() => Math.random() - 0.5).slice(0, numBeneficiaries);
  const beneficiaries: any[] = [];

  for (const b of chosen) {
    const beneficiary = await insertOrThrow(
      `beneficiaries insert (${b.name})`,
      supabase
        .from("beneficiaries")
        .insert({
          user_id: userId,
          name: b.name,
          account_number: randomAccountNumber(),
          ifsc: `${b.bank.slice(0, 4).toUpperCase().replace(/\s/g, "").padEnd(4, "X")}0${randInt(100000, 999999)}`,
          bank_name: b.bank,
          nickname: b.name.split(" ")[0],
          favorite: Math.random() > 0.7,
        })
        .select("*")
        .single()
    );
    beneficiaries.push(beneficiary);
  }
  return beneficiaries;
}

async function seedTransactionsForAccount(userId: string, accountId: string, monthsBack: number) {
  const count = randInt(15, 25);
  const rows: any[] = [];

  // Roughly-monthly salary credits over the window.
  const numSalaryMonths = Math.min(monthsBack, 8);
  for (let m = 0; m < numSalaryMonths; m++) {
    rows.push({
      user_id: userId,
      account_id: accountId,
      type: "CREDIT",
      amount: round2(45000 + Math.random() * 55000),
      currency: "INR",
      category: "Salary",
      merchant: "Employer Pvt Ltd",
      description: "Monthly salary credit",
      reference_number: referenceNumber("SAL"),
      status: "SUCCESS",
      payment_method: "NEFT",
      transaction_date: daysAgo(m * 30 + randInt(0, 2)).toISOString(),
    });
  }

  for (let i = 0; i < count; i++) {
    const { merchant, category } = pick(DEBIT_MERCHANTS);
    rows.push({
      user_id: userId,
      account_id: accountId,
      type: "DEBIT",
      amount: round2(50 + Math.random() * 4500),
      currency: "INR",
      category,
      merchant,
      description: `Payment to ${merchant}`,
      reference_number: referenceNumber("TXN"),
      status: "SUCCESS",
      payment_method: pick(["UPI", "CARD", "NEFT"]),
      transaction_date: daysAgo(randInt(0, monthsBack * 30)).toISOString(),
    });
  }

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) throw new Error(`transactions insert: ${error.message}`);
  return rows.length;
}

async function seedTransfersForUser(userId: string, accounts: any[], beneficiaries: any[]) {
  if (accounts.length === 0 || beneficiaries.length === 0) return 0;
  const numTransfers = randInt(2, 4);
  let created = 0;

  for (let i = 0; i < numTransfers; i++) {
    const account = pick(accounts);
    const beneficiary = pick(beneficiaries);
    const amount = round2(200 + Math.random() * 4800);
    const refNumber = referenceNumber("TRF");
    const idempotencyKey = randomUUID();

    const transfer = await insertOrThrow(
      `transfers insert (${userId})`,
      supabase
        .from("transfers")
        .insert({
          user_id: userId,
          sender_account_id: account.id,
          beneficiary_id: beneficiary.id,
          amount,
          currency: "INR",
          transfer_type: pick(["UPI", "IMPS", "NEFT", "RTGS"]),
          status: "SUCCESS",
          reference_number: refNumber,
          remarks: pick(["Rent", "Split bill", "Gift", "Loan repayment", undefined]) ?? null,
          idempotency_key: idempotencyKey,
          created_at: daysAgo(randInt(0, 90)).toISOString(),
        })
        .select("*")
        .single()
    );

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Transfer successful",
      message: `₹${amount} sent to ${beneficiary.name} via ${transfer.transfer_type}. Ref: ${refNumber}`,
      type: "TRANSFER",
      read: Math.random() > 0.5,
      created_at: transfer.created_at,
    });

    created += 1;
  }
  return created;
}

async function seedNotificationsForUser(userId: string) {
  const notifications = [
    { title: "Welcome to NeoBank", message: "Your account is ready. Explore your dashboard to get started.", type: "INFO" },
    { title: "KYC Verified", message: "Your identity verification has been approved.", type: "KYC" },
    { title: "Budget Alert", message: "You've used 80% of your Food budget for this month.", type: "BUDGET" },
    { title: "New login detected", message: "We noticed a new sign-in to your account.", type: "SECURITY" },
  ];
  for (const n of notifications) {
    await supabase.from("notifications").insert({
      user_id: userId,
      title: n.title,
      message: n.message,
      type: n.type,
      read: Math.random() > 0.6,
      created_at: daysAgo(randInt(0, 60)).toISOString(),
    });
  }
}

async function seedKycForUser(userId: string) {
  const documentNumber = `PAN${randInt(1000000000, 2000000000)}`;
  const hash = createHash("sha256").update(`PAN:${documentNumber}`).digest("hex");
  await supabase.from("kyc_verifications").insert({
    user_id: userId,
    document_type: "PAN",
    document_number_hash: hash,
    status: "VERIFIED",
    provider: "mock",
    verified_at: daysAgo(randInt(10, 100)).toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding NeoBank demo data...\n");

  const loginRows: Array<{ email: string; password: string; role: string }> = [];
  let totalAccounts = 0;
  let totalTransactions = 0;
  let totalBeneficiaries = 0;
  let totalTransfers = 0;

  for (const seed of DEMO_USERS) {
    try {
      console.log(`User: ${seed.firstName} ${seed.lastName} <${seed.email}>`);
      const userId = await createDemoUser(seed);
      if (!userId) {
        console.log("  Skipped (could not create/find user).\n");
        continue;
      }

      const accounts = await seedAccountsForUser(userId, `${seed.firstName} ${seed.lastName}`);
      totalAccounts += accounts.length;

      const card = await seedCardForUser(userId, `${seed.firstName} ${seed.lastName}`);
      void card;

      await seedBudgetsForUser(userId, `${seed.firstName} ${seed.lastName}`);
      await seedSavingsForUser(userId, `${seed.firstName} ${seed.lastName}`);
      await seedKycForUser(userId);

      const beneficiaries = await seedBeneficiariesForUser(userId);
      totalBeneficiaries += beneficiaries.length;

      for (const account of accounts) {
        const monthsBack = randInt(6, 12);
        const n = await seedTransactionsForAccount(userId, account.id, monthsBack);
        totalTransactions += n;
      }

      const transfersCreated = await seedTransfersForUser(userId, accounts, beneficiaries);
      totalTransfers += transfersCreated;

      await seedNotificationsForUser(userId);

      loginRows.push({ email: seed.email, password: DEMO_PASSWORD, role: seed.isAdmin ? "admin" : "user" });
      console.log(
        `  -> ${accounts.length} account(s), ${beneficiaries.length} beneficiaries, ${transfersCreated} transfers seeded.\n`
      );
    } catch (err: any) {
      console.error(`  Error seeding ${seed.email}:`, err.message ?? err);
      console.log("  Continuing with next user...\n");
    }
  }

  console.log("----------------------------------------------------------");
  console.log("Seed summary:");
  console.log(`  Users:         ${loginRows.length} / ${DEMO_USERS.length}`);
  console.log(`  Bank accounts: ${totalAccounts}`);
  console.log(`  Transactions:  ${totalTransactions}`);
  console.log(`  Beneficiaries: ${totalBeneficiaries}`);
  console.log(`  Transfers:     ${totalTransfers}`);
  console.log("----------------------------------------------------------\n");

  console.log("Demo login credentials (also usable in the frontend login form):\n");
  console.log("  Email                          | Password       | Role");
  console.log("  -------------------------------|-----------------|-------");
  for (const row of loginRows) {
    console.log(`  ${row.email.padEnd(30)} | ${row.password.padEnd(15)} | ${row.role}`);
  }
  console.log("\nAll data above is synthetic. No real money, no real KYC documents.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed script failed:", err);
    process.exit(1);
  });
