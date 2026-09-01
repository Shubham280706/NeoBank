-- Enable Supabase Realtime (postgres_changes) on tables the frontend subscribes to.
alter publication supabase_realtime add table bank_accounts;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table transfers;
alter publication supabase_realtime add table payments;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table budgets;
alter publication supabase_realtime add table savings_goals;
alter publication supabase_realtime add table kyc_verifications;
