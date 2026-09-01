-- Migration 0007: Automatic account balance sync on transaction deletion & recalculation

-- 1. Create trigger function to automatically adjust bank_accounts balance when a transaction is deleted
create or replace function handle_transaction_delete()
returns trigger language plpgsql security definer as $$
begin
  if OLD.status = 'SUCCESS' then
    if OLD.type = 'DEBIT' then
      update bank_accounts
        set balance = balance + OLD.amount,
            available_balance = available_balance + OLD.amount,
            updated_at = now()
        where id = OLD.account_id;
    elsif OLD.type = 'CREDIT' then
      update bank_accounts
        set balance = balance - OLD.amount,
            available_balance = available_balance - OLD.amount,
            updated_at = now()
        where id = OLD.account_id;
    end if;
  end if;
  return OLD;
end;
$$;

-- 2. Attach trigger to transactions table
drop trigger if exists trg_on_transaction_delete on transactions;
create trigger trg_on_transaction_delete
  after delete on transactions
  for each row
  execute function handle_transaction_delete();

-- 3. Recalculate existing bank account balances based on current transactions in DB
do $$
declare
  r record;
  v_credits numeric;
  v_debits numeric;
  v_calculated numeric;
begin
  for r in select id from bank_accounts loop
    select coalesce(sum(amount), 0) into v_credits
      from transactions
      where account_id = r.id and type = 'CREDIT' and status = 'SUCCESS';

    select coalesce(sum(amount), 0) into v_debits
      from transactions
      where account_id = r.id and type = 'DEBIT' and status = 'SUCCESS';

    v_calculated := v_credits - v_debits;

    update bank_accounts
      set balance = v_calculated,
          available_balance = v_calculated,
          updated_at = now()
      where id = r.id;
  end loop;
end;
$$;
