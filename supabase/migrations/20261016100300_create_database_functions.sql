-- Database functions (development plan, section 4 "Database functions").
-- Each function runs in one transaction: if any check fails, nothing is saved.
-- They are security definer so they can write tables the app cannot write
-- directly, which is why each one checks the caller's role first.
-- Every stock change is recorded in stock_movements.

-- ---------------------------------------------------------------------------
-- complete_sale
-- p_items: [{"product_id": 1, "quantity": 2}, ...]
-- Prices come from the products table, never from the app.
-- Returns the saved sale, including its receipt_no.
-- ---------------------------------------------------------------------------

create function public.complete_sale(
  p_items jsonb,
  p_cash_received numeric,
  p_discount numeric default 0
)
returns public.sales
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_shift_id bigint;
  v_item record;
  v_lines jsonb := '[]';
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2);
  v_total numeric(10,2);
  v_vat_amount numeric(10,2) := 0;
  v_settings public.store_settings;
  v_sale public.sales;
begin
  if not public.is_active_user() then
    raise exception 'You must be logged in with an active account.';
  end if;

  -- The shift row is locked so it cannot be closed while this sale is saved.
  select id into v_shift_id
  from public.shifts
  where cashier_id = v_user_id and closed_at is null
  for update;

  if v_shift_id is null then
    raise exception 'Open a shift before making a sale.';
  end if;

  -- Check the inputs
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'The cart is empty.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as e
    where case
      when jsonb_typeof(e -> 'product_id') = 'number' and jsonb_typeof(e -> 'quantity') = 'number'
        then (e ->> 'product_id')::numeric % 1 <> 0
          or (e ->> 'quantity')::numeric % 1 <> 0
          or (e ->> 'quantity')::numeric <= 0
      else true
    end
  ) then
    raise exception 'Each cart item needs a product and a whole-number quantity above 0.';
  end if;

  v_discount := coalesce(p_discount, 0);
  if v_discount < 0 or v_discount <> round(v_discount, 2) then
    raise exception 'The discount must be a peso amount of 0 or more.';
  end if;

  if p_cash_received is null or p_cash_received < 0 or p_cash_received <> round(p_cash_received, 2) then
    raise exception 'Enter a valid cash amount.';
  end if;

  -- Lock the products in the cart (in id order, to avoid deadlocks) so two
  -- cashiers cannot sell the same last item at the same time.
  perform 1
  from public.products
  where id in (select (e ->> 'product_id')::bigint from jsonb_array_elements(p_items) as e)
  order by id
  for update;

  -- Check each product (repeated products are combined) and add up the subtotal.
  for v_item in
    select
      i.product_id,
      i.quantity,
      p.id is not null as found,
      p.name,
      p.selling_price,
      p.stock_qty,
      p.is_active
    from (
      select
        (e ->> 'product_id')::bigint as product_id,
        sum((e ->> 'quantity')::numeric)::integer as quantity
      from jsonb_array_elements(p_items) as e
      group by 1
    ) as i
    left join public.products as p on p.id = i.product_id
    order by i.product_id
  loop
    if not v_item.found or not v_item.is_active then
      raise exception 'A product in the cart is no longer available.';
    end if;

    if v_item.stock_qty = 0 then
      raise exception '% is out of stock.', v_item.name;
    end if;

    if v_item.stock_qty < v_item.quantity then
      raise exception 'Not enough stock for %: only % left.', v_item.name, v_item.stock_qty;
    end if;

    v_subtotal := v_subtotal + v_item.selling_price * v_item.quantity;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_item.product_id,
      'product_name', v_item.name,
      'unit_price', v_item.selling_price,
      'quantity', v_item.quantity
    );
  end loop;

  -- Totals (prices include VAT, so VAT is the part of the total that is tax)
  if v_discount > v_subtotal then
    raise exception 'The discount cannot be more than the subtotal.';
  end if;

  v_total := v_subtotal - v_discount;

  select * into v_settings from public.store_settings where id = 1;
  if v_settings.vat_enabled then
    v_vat_amount := round(v_total * v_settings.vat_rate / (100 + v_settings.vat_rate), 2);
  end if;

  if p_cash_received < v_total then
    raise exception 'Insufficient cash. The total is %.', v_total;
  end if;

  -- Save the sale, its items, the new stock, and the stock movements
  insert into public.sales (
    shift_id, cashier_id, subtotal, discount, vat_amount, total, cash_received, change
  )
  values (
    v_shift_id, v_user_id, v_subtotal, v_discount, v_vat_amount, v_total,
    p_cash_received, p_cash_received - v_total
  )
  returning * into v_sale;

  insert into public.sale_items (sale_id, product_id, product_name, unit_price, quantity, line_total)
  select v_sale.id, l.product_id, l.product_name, l.unit_price, l.quantity, l.unit_price * l.quantity
  from jsonb_to_recordset(v_lines)
    as l(product_id bigint, product_name text, unit_price numeric(10,2), quantity integer);

  update public.products as p
  set stock_qty = p.stock_qty - l.quantity
  from jsonb_to_recordset(v_lines) as l(product_id bigint, quantity integer)
  where p.id = l.product_id;

  insert into public.stock_movements (product_id, type, quantity_change, reference_id, created_by)
  select l.product_id, 'sale', -l.quantity, v_sale.id, v_user_id
  from jsonb_to_recordset(v_lines) as l(product_id bigint, quantity integer);

  return v_sale;
end;
$$;

-- ---------------------------------------------------------------------------
-- record_stock_in (admin only)
-- p_items: [{"product_id": 1, "quantity": 24, "unit_cost": 52.00}, ...]
-- Returns the id of the new stock_ins row.
-- ---------------------------------------------------------------------------

create function public.record_stock_in(
  p_items jsonb,
  p_supplier_name text default null,
  p_received_at timestamptz default null,
  p_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stock_in_id bigint;
  v_missing_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can record stock in.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item to the delivery.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as e
    where case
      when jsonb_typeof(e -> 'product_id') = 'number'
        and jsonb_typeof(e -> 'quantity') = 'number'
        and jsonb_typeof(e -> 'unit_cost') = 'number'
        then (e ->> 'product_id')::numeric % 1 <> 0
          or (e ->> 'quantity')::numeric % 1 <> 0
          or (e ->> 'quantity')::numeric <= 0
          or (e ->> 'unit_cost')::numeric < 0
          or (e ->> 'unit_cost')::numeric <> round((e ->> 'unit_cost')::numeric, 2)
      else true
    end
  ) then
    raise exception 'Each item needs a product, a whole-number quantity above 0, and a unit cost of 0 or more.';
  end if;

  select count(*) into v_missing_count
  from jsonb_array_elements(p_items) as e
  left join public.products as p on p.id = (e ->> 'product_id')::bigint
  where p.id is null;

  if v_missing_count > 0 then
    raise exception 'A product in the delivery was not found.';
  end if;

  insert into public.stock_ins (supplier_name, received_at, received_by, notes)
  values (
    nullif(trim(p_supplier_name), ''),
    coalesce(p_received_at, now()),
    v_user_id,
    nullif(trim(p_notes), '')
  )
  returning id into v_stock_in_id;

  insert into public.stock_in_items (stock_in_id, product_id, quantity, unit_cost)
  select v_stock_in_id, l.product_id, l.quantity, l.unit_cost
  from jsonb_to_recordset(p_items) as l(product_id bigint, quantity integer, unit_cost numeric(10,2));

  -- Repeated products are combined so each product's stock is updated once.
  update public.products as p
  set stock_qty = p.stock_qty + t.quantity
  from (
    select l.product_id, sum(l.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as l(product_id bigint, quantity integer)
    group by l.product_id
  ) as t
  where p.id = t.product_id;

  insert into public.stock_movements (product_id, type, quantity_change, reference_id, created_by)
  select l.product_id, 'stock_in', sum(l.quantity)::integer, v_stock_in_id, v_user_id
  from jsonb_to_recordset(p_items) as l(product_id bigint, quantity integer)
  group by l.product_id;

  return v_stock_in_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- adjust_stock (admin only)
-- p_quantity_change: positive adds stock, negative removes it. A reason is required.
-- Returns the id of the new stock_adjustments row.
-- ---------------------------------------------------------------------------

create function public.adjust_stock(
  p_product_id bigint,
  p_quantity_change integer,
  p_reason text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stock_qty integer;
  v_adjustment_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can adjust stock.';
  end if;

  if p_quantity_change is null or p_quantity_change = 0 then
    raise exception 'The quantity change cannot be 0.';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Enter a reason for the adjustment.';
  end if;

  select stock_qty into v_stock_qty
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found.';
  end if;

  if v_stock_qty + p_quantity_change < 0 then
    raise exception 'Cannot remove more than the current stock (%).', v_stock_qty;
  end if;

  insert into public.stock_adjustments (product_id, quantity_change, reason, adjusted_by)
  values (p_product_id, p_quantity_change, trim(p_reason), v_user_id)
  returning id into v_adjustment_id;

  update public.products
  set stock_qty = stock_qty + p_quantity_change
  where id = p_product_id;

  insert into public.stock_movements (product_id, type, quantity_change, reference_id, created_by)
  values (p_product_id, 'adjustment', p_quantity_change, v_adjustment_id, v_user_id);

  return v_adjustment_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- void_sale / refund_sale (admin only, reason required)
-- Both mark the sale, return its stock, and record the approving admin.
-- They share reverse_sale, which the app cannot call directly.
-- ---------------------------------------------------------------------------

create function public.reverse_sale(
  p_sale_id bigint,
  p_type public.void_type,
  p_reason text
)
returns public.sales
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale public.sales;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can approve a %.', p_type;
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

  update public.sales
  set status = case p_type when 'void' then 'voided' else 'refunded' end::public.sale_status
  where id = p_sale_id
  returning * into v_sale;

  insert into public.sale_voids (sale_id, type, reason, approved_by)
  values (p_sale_id, p_type, trim(p_reason), v_user_id);

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

  return v_sale;
end;
$$;

create function public.void_sale(p_sale_id bigint, p_reason text)
returns public.sales
language sql
security definer
set search_path = ''
as $$
  select * from public.reverse_sale(p_sale_id, 'void', p_reason);
$$;

create function public.refund_sale(p_sale_id bigint, p_reason text)
returns public.sales
language sql
security definer
set search_path = ''
as $$
  select * from public.reverse_sale(p_sale_id, 'refund', p_reason);
$$;

-- ---------------------------------------------------------------------------
-- close_shift (the shift's cashier or an admin)
-- expected cash = starting cash + cash sales - refunds
-- Voided sales are not counted. A refunded sale counts as a sale and a refund,
-- so it cancels out. Returns the closed shift.
-- ---------------------------------------------------------------------------

create function public.close_shift(p_shift_id bigint, p_actual_cash numeric)
returns public.shifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shift public.shifts;
  v_cash_sales numeric(10,2);
  v_refunds numeric(10,2);
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

  select
    coalesce(sum(total) filter (where status in ('completed', 'refunded')), 0),
    coalesce(sum(total) filter (where status = 'refunded'), 0)
  into v_cash_sales, v_refunds
  from public.sales
  where shift_id = p_shift_id;

  v_expected_cash := v_shift.starting_cash + v_cash_sales - v_refunds;

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

-- ---------------------------------------------------------------------------
-- Who can call the functions
-- ---------------------------------------------------------------------------

revoke execute on function public.complete_sale(jsonb, numeric, numeric) from public, anon;
revoke execute on function public.record_stock_in(jsonb, text, timestamptz, text) from public, anon;
revoke execute on function public.adjust_stock(bigint, integer, text) from public, anon;
revoke execute on function public.reverse_sale(bigint, public.void_type, text) from public, anon, authenticated;
revoke execute on function public.void_sale(bigint, text) from public, anon;
revoke execute on function public.refund_sale(bigint, text) from public, anon;
revoke execute on function public.close_shift(bigint, numeric) from public, anon;

grant execute on function public.complete_sale(jsonb, numeric, numeric) to authenticated;
grant execute on function public.record_stock_in(jsonb, text, timestamptz, text) to authenticated;
grant execute on function public.adjust_stock(bigint, integer, text) to authenticated;
grant execute on function public.void_sale(bigint, text) to authenticated;
grant execute on function public.refund_sale(bigint, text) to authenticated;
grant execute on function public.close_shift(bigint, numeric) to authenticated;
