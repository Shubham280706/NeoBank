-- Extends transfer_money() so a transfer to another user's account within
-- this system actually credits them (double-entry), instead of only
-- debiting the sender as if the money left to an external, unmodeled bank.
--
-- Resolution order for the receiving account:
--   1. If a beneficiary was selected and its account_number matches a real
--      bank_accounts.account_number, credit that account.
--   2. Else if a recipient UPI ID was given and it matches a profiles.upi_id,
--      credit that user's first active account.
--   3. Otherwise, behave exactly as before (external/simulated recipient —
--      debit only, since we have no account of theirs to credit).

create or replace function transfer_money(
  p_user_id uuid,
  p_sender_account_id uuid,
  p_beneficiary_id uuid,
  p_amount numeric,
  p_transfer_type text,
  p_remarks text,
  p_idempotency_key text,
  p_reference_number text,
  p_merchant text default null,
  p_recipient_upi_id text default null
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
  v_beneficiary_account_number text;
  v_receiver_account bank_accounts%rowtype;
  v_sender_label text;
begin
  select * into v_existing_transfer from transfers
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then
    return query select v_existing_transfer.id, v_existing_transfer.status, v_existing_transfer.reference_number,
      (select balance from bank_accounts where id = p_sender_account_id);
    return;
  end if;

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

  -- ---- Resolve and credit an internal recipient, if there is one ----
  if p_beneficiary_id is not null then
    select account_number into v_beneficiary_account_number from beneficiaries where id = p_beneficiary_id;
  end if;

  if v_beneficiary_account_number is not null then
    select * into v_receiver_account from bank_accounts
      where account_number = v_beneficiary_account_number and status = 'ACTIVE'
      for update;
  elsif p_recipient_upi_id is not null then
    select ba.* into v_receiver_account
      from bank_accounts ba
      join profiles p on p.id = ba.user_id
      where p.upi_id = p_recipient_upi_id and ba.status = 'ACTIVE'
      order by ba.created_at
      limit 1
      for update;
  end if;

  if v_receiver_account.id is not null and v_receiver_account.id <> p_sender_account_id then
    select coalesce(nullif(trim(first_name || ' ' || last_name), ''), upi_id, 'NeoBank user')
      into v_sender_label
      from profiles where id = p_user_id;

    update bank_accounts
      set balance = balance + p_amount,
          available_balance = available_balance + p_amount
      where id = v_receiver_account.id;

    insert into transactions (user_id, account_id, type, amount, currency, category, merchant, description, reference_number, status, payment_method, transaction_date)
    values (v_receiver_account.user_id, v_receiver_account.id, 'CREDIT', p_amount, 'INR', 'Transfer', v_sender_label, p_remarks, p_reference_number || '-CR', 'SUCCESS', p_transfer_type, now());

    insert into notifications (user_id, title, message, type)
    values (v_receiver_account.user_id, 'Money received', format('₹%s received from %s via %s. Ref: %s', p_amount, v_sender_label, p_transfer_type, p_reference_number), 'TRANSACTION');
  end if;

  return query select v_transfer_id, 'SUCCESS'::text, p_reference_number, (v_account.balance - p_amount);
exception
  when others then
    raise;
end;
$$;
