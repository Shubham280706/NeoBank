-- Atomic transfer: debits sender, creates transaction/transfer/notification/audit log in one tx.
-- Runs as SECURITY DEFINER so it can be called by the backend using the service role,
-- but the backend must have already authenticated the caller and verified p_user_id = auth user.

create or replace function transfer_money(
  p_user_id uuid,
  p_sender_account_id uuid,
  p_beneficiary_id uuid,
  p_amount numeric,
  p_transfer_type text,
  p_remarks text,
  p_idempotency_key text,
  p_reference_number text,
  p_merchant text default null
)
returns table (
  transfer_id uuid,
  status text,
  reference_number text,
  new_balance numeric
) language plpgsql as $$
declare
  v_account bank_accounts%rowtype;
  v_existing_transfer transfers%rowtype;
  v_transfer_id uuid;
  v_transaction_id uuid;
begin
  -- idempotency: return existing transfer if this key was already used
  select * into v_existing_transfer from transfers
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then
    return query select v_existing_transfer.id, v_existing_transfer.status, v_existing_transfer.reference_number,
      (select balance from bank_accounts where id = p_sender_account_id);
    return;
  end if;

  -- lock the sender account row to prevent concurrent double-spends
  select * into v_account from bank_accounts
    where id = p_sender_account_id and user_id = p_user_id
    for update;

  if not found then
    raise exception 'ACCOUNT_NOT_FOUND_OR_NOT_OWNED';
  end if;

  if v_account.status <> 'ACTIVE' then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;

  if v_account.available_balance < p_amount then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  update bank_accounts
    set balance = balance - p_amount,
        available_balance = available_balance - p_amount
    where id = p_sender_account_id;

  insert into transactions (user_id, account_id, type, amount, currency, category, merchant, description, reference_number, status, payment_method, transaction_date)
  values (p_user_id, p_sender_account_id, 'DEBIT', p_amount, 'INR', 'Transfer', p_merchant, p_remarks, p_reference_number, 'SUCCESS', p_transfer_type, now())
  returning id into v_transaction_id;

  insert into transfers (user_id, sender_account_id, beneficiary_id, amount, currency, transfer_type, status, reference_number, remarks, idempotency_key)
  values (p_user_id, p_sender_account_id, p_beneficiary_id, p_amount, 'INR', p_transfer_type, 'SUCCESS', p_reference_number, p_remarks, p_idempotency_key)
  returning id into v_transfer_id;

  insert into notifications (user_id, title, message, type)
  values (p_user_id, 'Transfer successful', format('₹%s sent via %s. Ref: %s', p_amount, p_transfer_type, p_reference_number), 'TRANSFER');

  insert into audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (p_user_id, 'TRANSFER_CREATED', 'transfer', v_transfer_id::text, jsonb_build_object('amount', p_amount, 'type', p_transfer_type));

  return query select v_transfer_id, 'SUCCESS'::text, p_reference_number, (v_account.balance - p_amount);
exception
  when others then
    raise;
end;
$$;
