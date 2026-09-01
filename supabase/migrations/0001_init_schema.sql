-- Neo-Bank demo schema. All financial data is simulated. No real money movement.

create extension if not exists "pgcrypto";

-- ============ ENUM-ish check constraints kept as text for simplicity ============

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  date_of_birth date,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  upi_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('PAN','AADHAAR','PASSPORT','DRIVING_LICENCE')),
  document_number_hash text not null,
  status text not null default 'SUBMITTED' check (status in ('SUBMITTED','PROCESSING','VERIFIED','FAILED')),
  provider text not null default 'mock',
  submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  rejection_reason text
);

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_number text not null unique,
  ifsc text not null,
  account_type text not null default 'SAVINGS' check (account_type in ('SAVINGS','CURRENT')),
  balance numeric(14,2) not null default 0,
  available_balance numeric(14,2) not null default 0,
  currency text not null default 'INR',
  status text not null default 'ACTIVE' check (status in ('ACTIVE','FROZEN','CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references bank_accounts(id) on delete cascade,
  type text not null check (type in ('CREDIT','DEBIT')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'INR',
  category text not null default 'Other',
  merchant text,
  description text,
  reference_number text not null unique,
  status text not null default 'SUCCESS' check (status in ('PENDING','SUCCESS','FAILED')),
  payment_method text,
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists beneficiaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  account_number text not null,
  ifsc text not null,
  bank_name text,
  nickname text,
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_account_id uuid not null references bank_accounts(id),
  beneficiary_id uuid references beneficiaries(id),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'INR',
  transfer_type text not null check (transfer_type in ('UPI','IMPS','NEFT','RTGS')),
  status text not null default 'PENDING' check (status in ('PENDING','SUCCESS','FAILED')),
  reference_number text not null unique,
  remarks text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_type text not null default 'VIRTUAL' check (card_type in ('VIRTUAL','DEBIT')),
  last4 text not null,
  cardholder_name text not null,
  expiry_month int not null,
  expiry_year int not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','FROZEN','REPORTED','REPLACED')),
  spending_limit numeric(14,2) not null default 100000,
  daily_limit numeric(14,2) not null default 25000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists card_transactions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  merchant text not null,
  amount numeric(14,2) not null,
  currency text not null default 'INR',
  category text not null default 'Other',
  status text not null default 'SUCCESS' check (status in ('SUCCESS','FAILED','PENDING')),
  transaction_date timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null,
  currency text not null default 'INR',
  provider text not null default 'mock',
  provider_payment_id text,
  status text not null default 'CREATED' check (status in ('CREATED','PROCESSING','SUCCEEDED','FAILED','REFUNDED')),
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists linked_banks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'mock' check (provider in ('plaid','gocardless','mock')),
  institution_name text not null,
  account_mask text,
  provider_account_id text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','DISCONNECTED')),
  linked_at timestamptz not null default now()
);

create table if not exists fx_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null,
  target_currency text not null,
  rate numeric(18,8) not null,
  provider text not null default 'frankfurter',
  fetched_at timestamptz not null default now(),
  unique (base_currency, target_currency)
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric(14,2) not null,
  period text not null default 'monthly' check (period in ('weekly','monthly','yearly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, period)
);

create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists savings_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references savings_goals(id) on delete cascade,
  amount numeric(14,2) not null,
  type text not null check (type in ('CONTRIBUTION','WITHDRAWAL')),
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'INFO' check (type in ('INFO','TRANSACTION','TRANSFER','KYC','BUDGET','SECURITY')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============ Indexes ============
create index if not exists idx_transactions_user on transactions(user_id, transaction_date desc);
create index if not exists idx_transactions_account on transactions(account_id);
create index if not exists idx_transfers_user on transfers(user_id, created_at desc);
create index if not exists idx_notifications_user on notifications(user_id, created_at desc);
create index if not exists idx_bank_accounts_user on bank_accounts(user_id);
create index if not exists idx_card_transactions_card on card_transactions(card_id);
create index if not exists idx_audit_logs_user on audit_logs(user_id, created_at desc);

-- ============ updated_at trigger helper ============
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','bank_accounts','beneficiaries','transfers','cards','payments','budgets','savings_goals']
  loop
    execute format('drop trigger if exists trg_set_updated_at on %I', t);
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;

-- auto-create profile row on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, last_name, upi_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    lower(split_part(new.email, '@', 1)) || substr(new.id::text, 1, 4) || '@neo'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
