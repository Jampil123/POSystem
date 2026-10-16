-- Void and refund rules (Phase 5):
-- - Void cancels a whole sale while the sale's shift is still open (mistakes at the counter).
-- - Refund returns a whole sale after its shift is closed. The cash is taken from
--   the open shift of the user doing the refund, so it lowers that shift's expected cash.
-- - Both need a reason and an admin's username and approval PIN.
-- Partial refunds are not part of this version.

-- Who asked for the void or refund, and (for refunds) the shift the cash came from.
alter table public.sale_voids
  add column requested_by uuid references public.profiles (id),
  add column shift_id bigint references public.shifts (id);

create index sale_voids_shift_id_idx on public.sale_voids (shift_id);

-- The old versions only allowed a logged-in admin.
drop function public.void_sale(bigint, text);
drop function public.refund_sale(bigint, text);
drop function public.reverse_sale(bigint, public.void_type, text);

-- ---------------------------------------------------------------------------
-- reverse_sale (shared by void_sale and refund_sale; not callable from the app)
-- Returns {"ok": true, "sale_id", "receipt_no", "status"}, or
-- {"ok": false, "message"} when the admin approval is rejected.
-- The approval is returned instead of raised so a wrong PIN try is saved.
-- ---------------------------------------------------------------------------

create function public.reverse_sale(
  p_sale_id bigint,
  p_type public.void_type,
  p_reason text,
  p_admin_username text,
  p_admin_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale public.sales;
  v_sale_shift public.shifts;
  v_refund_shift_id bigint;
  v_approval record;
begin
  if not public.is_active_user() then
    raise exception 'You must be logged in with an active account.';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Enter a reason for the %.', p_type;
  end if;

  select * into v_sale
  from public.sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception 'Sale not found.';
  end if;

  if v_sale.status <> 'completed' then
    raise exception 'This sale was already %.', v_sale.status;
  end if;

  select * into v_sale_shift from public.shifts where id = v_sale.shift_id;

  if p_type = 'void' and v_sale_shift.closed_at is not null then
    raise exception 'This sale''s shift is already closed, so it cannot be voided. Use a refund instead.';
  end if;

  if p_type = 'refund' then
    if v_sale_shift.closed_at is null then
      raise exception 'This sale''s shift is still open, so it cannot be refunded. Use a void instead.';
    end if;

    -- The refund cash comes out of the current drawer.
    select id into v_refund_shift_id
    from public.shifts
    where cashier_id = v_user_id and closed_at is null
    for update;

    if v_refund_shift_id is null then
      raise exception 'Open a shift first. The refund cash is taken from your drawer.';
    end if;
  end if;

  -- Checked last, so a wrong PIN try is saved only for an otherwise valid request.
  select * into v_approval from public.check_admin_approval(p_admin_username, p_admin_pin);
  if v_approval.admin_id is null then
    return jsonb_build_object('ok', false, 'message', v_approval.message);
  end if;

  update public.sales
  set status = case p_type when 'void' then 'voided' else 'refunded' end::public.sale_status
  where id = p_sale_id
  returning * into v_sale;

  insert into public.sale_voids (sale_id, type, reason, approved_by, requested_by, shift_id)
  values (p_sale_id, p_type, trim(p_reason), v_approval.admin_id, v_user_id, v_refund_shift_id);

  -- Put the sold items back into stock.
  update public.products as p
  set stock_qty = p.stock_qty + t.quantity
  from (
    select product_id, sum(quantity)::integer as quantity
    from public.sale_items
    where sale_id = p_sale_id
    group by product_id
  ) as t
  where p.id = t.product_id;

  insert into public.stock_movements (product_id, type, quantity_change, reference_id, created_by)
  select product_id, p_type::text::public.movement_type, sum(quantity)::integer, p_sale_id, v_user_id
  from public.sale_items
  where sale_id = p_sale_id
  group by product_id;

  return jsonb_build_object(
    'ok', true,
    'sale_id', v_sale.id,
    'receipt_no', v_sale.receipt_no,
    'status', v_sale.status
  );
end;
$$;

create function public.void_sale(
  p_sale_id bigint,
  p_reason text,
  p_admin_username text,
  p_admin_pin text
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.reverse_sale(p_sale_id, 'void', p_reason, p_admin_username, p_admin_pin);
$$;

create function public.refund_sale(
  p_sale_id bigint,
  p_reason text,
  p_admin_username text,
  p_admin_pin text
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.reverse_sale(p_sale_id, 'refund', p_reason, p_admin_username, p_admin_pin);
$$;

-- ---------------------------------------------------------------------------
-- shift_cash_summary: the cash a shift's drawer should have
-- (the shift's cashier or an admin). close_shift uses the same numbers.
--   cash sales = sales made in the shift that were not voided
--   refunds    = refunds paid out of this shift's drawer
--   expected   = starting cash + cash sales - refunds
-- ---------------------------------------------------------------------------

create function public.shift_cash_summary(p_shift_id bigint)
returns table (
  starting_cash numeric(10,2),
  cash_sales numeric(10,2),
  refunds numeric(10,2),
  expected_cash numeric(10,2)
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_shift public.shifts;
  v_cash_sales numeric(10,2);
  v_refunds numeric(10,2);
begin
  select * into v_shift from public.shifts where id = p_shift_id;

  if not found then
    raise exception 'Shift not found.';
  end if;

  if v_shift.cashier_id <> auth.uid() and not public.is_admin() then
    raise exception 'You can only see your own shift.';
  end if;

  select coalesce(sum(total), 0) into v_cash_sales
  from public.sales
  where shift_id = p_shift_id and status in ('completed', 'refunded');

  select coalesce(sum(s.total), 0) into v_refunds
  from public.sale_voids as v
  join public.sales as s on s.id = v.sale_id
  where v.shift_id = p_shift_id and v.type = 'refund';

  return query
  select v_shift.starting_cash, v_cash_sales, v_refunds, v_shift.starting_cash + v_cash_sales - v_refunds;
end;
$$;

-- close_shift now uses shift_cash_summary, so refunds lower the drawer they were paid from.
create or replace function public.close_shift(p_shift_id bigint, p_actual_cash numeric)
returns public.shifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shift public.shifts;
  v_expected_cash numeric(10,2);
begin
  if not public.is_active_user() then
    raise exception 'You must be logged in with an active account.';
  end if;

  if p_actual_cash is null or p_actual_cash < 0 or p_actual_cash <> round(p_actual_cash, 2) then
    raise exception 'Enter the actual cash counted (0 or more).';
  end if;

  select * into v_shift
  from public.shifts
  where id = p_shift_id
  for update;

  if not found then
    raise exception 'Shift not found.';
  end if;

  if v_shift.cashier_id <> auth.uid() and not public.is_admin() then
    raise exception 'You can only close your own shift.';
  end if;

  if v_shift.closed_at is not null then
    raise exception 'This shift is already closed.';
  end if;

  select summary.expected_cash into v_expected_cash
  from public.shift_cash_summary(p_shift_id) as summary;

  update public.shifts
  set
    closed_at = now(),
    expected_cash = v_expected_cash,
    actual_cash = p_actual_cash,
    difference = p_actual_cash - v_expected_cash
  where id = p_shift_id
  returning * into v_shift;

  return v_shift;
end;
$$;

revoke execute on function public.reverse_sale(bigint, public.void_type, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.void_sale(bigint, text, text, text) from public, anon;
revoke execute on function public.refund_sale(bigint, text, text, text) from public, anon;
revoke execute on function public.shift_cash_summary(bigint) from public, anon;

grant execute on function public.void_sale(bigint, text, text, text) to authenticated;
grant execute on function public.refund_sale(bigint, text, text, text) to authenticated;
grant execute on function public.shift_cash_summary(bigint) to authenticated;
