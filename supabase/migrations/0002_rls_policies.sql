-- Row Level Security: every user can only see/modify their own rows.
-- Admins (profiles.role = 'admin') get read access to everything via is_admin().

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table profiles enable row level security;
alter table kyc_verifications enable row level security;
alter table bank_accounts enable row level security;
alter table transactions enable row level security;
alter table beneficiaries enable row level security;
alter table transfers enable row level security;
alter table cards enable row level security;
alter table card_transactions enable row level security;
alter table payments enable row level security;
alter table linked_banks enable row level security;
alter table fx_rates enable row level security;
alter table budgets enable row level security;
alter table savings_goals enable row level security;
alter table savings_contributions enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- generic owner policies
create policy "kyc_select_own_or_admin" on kyc_verifications for select using (user_id = auth.uid() or is_admin());
create policy "kyc_insert_own" on kyc_verifications for insert with check (user_id = auth.uid());

create policy "accounts_select_own_or_admin" on bank_accounts for select using (user_id = auth.uid() or is_admin());

create policy "transactions_select_own_or_admin" on transactions for select using (user_id = auth.uid() or is_admin());

create policy "beneficiaries_all_own" on beneficiaries for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "transfers_select_own_or_admin" on transfers for select using (user_id = auth.uid() or is_admin());
create policy "transfers_insert_own" on transfers for insert with check (user_id = auth.uid());

create policy "cards_all_own" on cards for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "card_transactions_select_own_or_admin" on card_transactions for select using (
  exists (select 1 from cards c where c.id = card_id and (c.user_id = auth.uid() or is_admin()))
);

create policy "payments_select_own_or_admin" on payments for select using (user_id = auth.uid() or is_admin());
create policy "payments_insert_own" on payments for insert with check (user_id = auth.uid());

create policy "linked_banks_all_own" on linked_banks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "fx_rates_select_all" on fx_rates for select using (true);

create policy "budgets_all_own" on budgets for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "savings_goals_all_own" on savings_goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "savings_contributions_select_own" on savings_contributions for select using (
  exists (select 1 from savings_goals g where g.id = goal_id and g.user_id = auth.uid())
);
create policy "savings_contributions_insert_own" on savings_contributions for insert with check (
  exists (select 1 from savings_goals g where g.id = goal_id and g.user_id = auth.uid())
);

create policy "notifications_select_own" on notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on notifications for update using (user_id = auth.uid());

create policy "audit_logs_select_own_or_admin" on audit_logs for select using (user_id = auth.uid() or is_admin());

-- Admin-wide policies for tables that need broader admin visibility on writes too
create policy "accounts_admin_all" on bank_accounts for all using (is_admin()) with check (is_admin());
create policy "kyc_admin_update" on kyc_verifications for update using (is_admin());
