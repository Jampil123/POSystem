-- Gross profit: save each product's cost price at the time of sale, like the
-- selling price. Sales made before this change have no cost (null), and the
-- Reports page shows "No cost data" for them.

alter table public.sale_items
  add column unit_cost numeric(10,2) check (unit_cost >= 0);

-- Same as before, except that each sale item now also saves unit_cost.
create or replace function public.complete_sale(
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
      p.cost_price,
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
      'unit_cost', v_item.cost_price,
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

  insert into public.sale_items (
    sale_id, product_id, product_name, unit_price, unit_cost, quantity, line_total
  )
  select
    v_sale.id, l.product_id, l.product_name, l.unit_price, l.unit_cost, l.quantity,
    l.unit_price * l.quantity
  from jsonb_to_recordset(v_lines) as l(
    product_id bigint, product_name text, unit_price numeric(10,2), unit_cost numeric(10,2), quantity integer
  );

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
