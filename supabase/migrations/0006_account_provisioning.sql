-- Self-serve account opening + simulated "Add Money" deposits.
-- Deposits are a simulated top-up (e.g. "from UPI" / "from linked bank") —
-- no real money moves. Kept atomic and row-locked for the same reason
-- transfer_money is: this is real financial-integrity practice even in a
-- demo, and it's what the original spec calls for.

create or replace function deposit_money(
  p_user_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_remarks text,
  p_reference_number text
)
returns table (
  transaction_id uuid,
  new_balance numeric
) language plpgsql as $$
declare
  v_account bank_accounts%rowtype;
  v_transaction_id uuid;
begin
  select * into v_account from bank_accounts
    where id = p_account_id and user_id = p_user_id
    for update;

  if not found then
    raise exception 'ACCOUNT_NOT_FOUND_OR_NOT_OWNED';
  end if;

  if v_account.status <> 'ACTIVE' then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;

  update bank_accounts
    set balance = balance + p_amount,
        available_balance = available_balance + p_amount
    where id = p_account_id;

  insert into transactions (user_id, account_id, type, amount, currency, category, merchant, description, reference_number, status, payment_method, transaction_date)
  values (p_user_id, p_account_id, 'CREDIT', p_amount, 'INR', 'Deposit', 'Add Money', p_remarks, p_reference_number, 'SUCCESS', 'UPI', now())
  returning id into v_transaction_id;

  insert into notifications (user_id, title, message, type)
  values (p_user_id, 'Money added', format('₹%s added to your account. Ref: %s', p_amount, p_reference_number), 'TRANSACTION');

  insert into audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (p_user_id, 'ACCOUNT_DEPOSIT', 'bank_account', p_account_id::text, jsonb_build_object('amount', p_amount));

  return query select v_transaction_id, (v_account.balance + p_amount);
end;
$$;
