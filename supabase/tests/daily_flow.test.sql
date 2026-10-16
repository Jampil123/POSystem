-- Full day at the store, run as the real roles with the security rules on:
--   admin adds a product and stock in -> cashier opens a shift -> sales with exact
--   cash, a discount, and overpayment -> a void -> close shift -> a refund in a later
--   shift -> close shift -> admin checks the reports.
-- Also checks that a cashier cannot use admin-only tables and functions.
--
-- How to run (no Docker needed):
--   npm run db:test
-- or paste this file into the Supabase dashboard SQL Editor and click Run.
--
-- Everything happens inside a block that is always undone at the end, so nothing is saved.
-- The result is a table with one row per check: PASS or FAIL with the reason.

create temp table if not exists daily_flow_results (test text, result text);
truncate daily_flow_results;

do $$
declare
  v_tests text[] := '{}';
  v_results text[] := '{}';
  v_tag text := left(replace(gen_random_uuid()::text, '-', ''), 10);
  v_admin_id uuid := gen_random_uuid();
  v_cashier_id uuid := gen_random_uuid();
  v_today date := (now() at time zone 'Asia/Manila')::date;
  v_category_id bigint;
  v_product_id bigint;
  v_shift1_id bigint;
  v_shift2_id bigint;
  v_sale1 public.sales;
  v_sale2 public.sales;
  v_sale3 public.sales;
  v_shift public.shifts;
  v_report_before record;
  v_report_after record;
  v_cash record;
  v_result jsonb;
  v_error text;
  v_count integer;
  v_stock integer;
begin
  begin
    -- Setup (as the database owner): one admin and one cashier
    insert into auth.users (id, email, raw_user_meta_data)
    values
      (v_admin_id, 'zz_admin_' || v_tag || '@kuyatata.local',
        jsonb_build_object('username', 'zz_admin_' || v_tag, 'full_name', 'Test Owner')),
      (v_cashier_id, 'zz_cashier_' || v_tag || '@kuyatata.local',
        jsonb_build_object('username', 'zz_cashier_' || v_tag, 'full_name', 'Test Cashier'));
    update public.profiles set role = 'admin' where id = v_admin_id;

    -- =====================================================================
    -- Admin: product, stock in, approval PIN
    -- =====================================================================
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_admin_id, 'role', 'authenticated')::text, true);
    set local role authenticated;

    select * into v_report_before from public.report_summary(v_today, v_today);

    insert into public.categories (name) values ('zz test ' || v_tag) returning id into v_category_id;
    insert into public.products (category_id, name, barcode, cost_price, selling_price)
    values (v_category_id, 'Test Rice ' || v_tag, 'zz' || v_tag, 40.00, 50.00)
    returning id into v_product_id;

    perform public.record_stock_in(
      jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 20, 'unit_cost', 40.00)),
      'Test Supplier'
    );
    select stock_qty into v_stock from public.products where id = v_product_id;
    select count(*) into v_count from public.stock_movements where product_id = v_product_id and type = 'stock_in';

    v_tests := v_tests || 'Admin adds a product and stock in (stock 20, in history)'::text;
    v_results := v_results || case when v_stock = 20 and v_count = 1 then 'PASS'
      else format('FAIL: stock %s, movements %s', v_stock, v_count) end;

    perform public.set_approval_pin('2468');
    reset role;

    -- =====================================================================
    -- Cashier cannot use admin-only tables and functions
    -- =====================================================================
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_cashier_id, 'role', 'authenticated')::text, true);
    set local role authenticated;

    v_error := null;
    begin
      insert into public.products (category_id, name, selling_price) values (v_category_id, 'Not allowed', 1);
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'Cashier cannot add products'::text;
    v_results := v_results || case when v_error is not null then 'PASS' else 'FAIL: product was added' end;

    update public.products set selling_price = 1 where id = v_product_id;
    get diagnostics v_count = row_count;
    v_tests := v_tests || 'Cashier cannot change product prices'::text;
    v_results := v_results || case when v_count = 0 then 'PASS' else 'FAIL: price changed' end;

    v_error := null;
    begin
      update public.products set stock_qty = 999 where id = v_product_id;
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'Cashier cannot change stock directly'::text;
    v_results := v_results || case when v_error ilike '%permission denied%' then 'PASS'
      else format('FAIL: %s', coalesce(v_error, 'stock changed')) end;

    v_error := null;
    begin
      perform public.record_stock_in(
        jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 5, 'unit_cost', 1)), null);
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'Cashier cannot call record_stock_in'::text;
    v_results := v_results || case when v_error ilike '%only an admin%' then 'PASS'
      else format('FAIL: %s', coalesce(v_error, 'allowed')) end;

    v_error := null;
    begin
      perform public.adjust_stock(v_product_id, -1, 'Damaged');
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'Cashier cannot call adjust_stock'::text;
    v_results := v_results || case when v_error ilike '%only an admin%' then 'PASS'
      else format('FAIL: %s', coalesce(v_error, 'allowed')) end;

    v_error := null;
    begin
      perform * from public.report_summary(v_today, v_today);
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'Cashier cannot read reports'::text;
    v_results := v_results || case when v_error ilike '%only an admin%' then 'PASS'
      else format('FAIL: %s', coalesce(v_error, 'allowed')) end;

    v_error := null;
    begin
      perform public.set_approval_pin('1111');
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'Cashier cannot set an approval PIN'::text;
    v_results := v_results || case when v_error ilike '%only an admin%' then 'PASS'
      else format('FAIL: %s', coalesce(v_error, 'allowed')) end;

    v_error := null;
    begin
      perform public.reverse_sale(1, 'void', 'x', 'admin', '0000');
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'Cashier cannot call the internal reverse_sale'::text;
    v_results := v_results || case when v_error ilike '%permission denied%' then 'PASS'
      else format('FAIL: %s', coalesce(v_error, 'allowed')) end;

    select count(*) into v_count from public.stock_movements;
    v_tests := v_tests || 'Cashier cannot read the stock history'::text;
    v_results := v_results || case when v_count = 0 then 'PASS' else format('FAIL: sees %s rows', v_count) end;

    update public.store_settings set store_name = 'Hacked' where id = 1;
    get diagnostics v_count = row_count;
    v_tests := v_tests || 'Cashier cannot change store settings'::text;
    v_results := v_results || case when v_count = 0 then 'PASS' else 'FAIL: settings changed' end;

    v_error := null;
    begin
      update public.profiles set role = 'admin' where id = v_cashier_id;
      get diagnostics v_count = row_count;
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'Cashier cannot make themselves an admin'::text;
    v_results := v_results || case when v_error is not null or v_count = 0 then 'PASS' else 'FAIL: role changed' end;

    v_error := null;
    begin
      insert into public.sales (shift_id, cashier_id, subtotal, total, cash_received, change)
      values (1, v_cashier_id, 1, 1, 1, 0);
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'Cashier cannot write sales directly (only complete_sale)'::text;
    v_results := v_results || case when v_error is not null then 'PASS' else 'FAIL: sale inserted' end;

    -- =====================================================================
    -- Shift 1: sales with exact cash, a discount, and overpayment; then a void
    -- =====================================================================
    insert into public.shifts (starting_cash) values (1000.00) returning id into v_shift1_id;

    -- Exact cash: 2 x 50.00 = 100.00, cash 100.00
    v_sale1 := public.complete_sale(jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 2)), 100.00);
    -- Discount: 1 x 50.00 - 10.00 = 40.00, cash 100.00
    v_sale2 := public.complete_sale(jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 1)), 100.00, 10.00);
    -- Overpayment: 3 x 50.00 = 150.00, cash 200.00
    v_sale3 := public.complete_sale(jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 3)), 200.00);

    v_tests := v_tests || 'Sale with exact cash: total 100.00, change 0.00'::text;
    v_results := v_results || case when v_sale1.total = 100.00 and v_sale1.change = 0.00 then 'PASS'
      else format('FAIL: total %s, change %s', v_sale1.total, v_sale1.change) end;

    v_tests := v_tests || 'Sale with a 10.00 discount: total 40.00, change 60.00'::text;
    v_results := v_results || case when v_sale2.total = 40.00 and v_sale2.discount = 10.00 and v_sale2.change = 60.00 then 'PASS'
      else format('FAIL: total %s, discount %s, change %s', v_sale2.total, v_sale2.discount, v_sale2.change) end;

    v_tests := v_tests || 'Sale with overpayment: total 150.00, change 50.00'::text;
    v_results := v_results || case when v_sale3.total = 150.00 and v_sale3.change = 50.00 then 'PASS'
      else format('FAIL: total %s, change %s', v_sale3.total, v_sale3.change) end;

    select stock_qty into v_stock from public.products where id = v_product_id;
    v_tests := v_tests || 'Stock goes down after the sales (20 - 6 = 14)'::text;
    v_results := v_results || case when v_stock = 14 then 'PASS' else format('FAIL: stock %s', v_stock) end;

    select count(*) into v_count from public.sale_items where sale_id = v_sale1.id and unit_cost = 40.00;
    v_tests := v_tests || 'Sale items save the cost price (for gross profit)'::text;
    v_results := v_results || case when v_count = 1 then 'PASS' else 'FAIL: no unit_cost saved' end;

    select count(*) into v_count from public.sales where cashier_id <> v_cashier_id;
    v_tests := v_tests || 'Cashier sees only their own sales'::text;
    v_results := v_results || case when v_count = 0 then 'PASS' else format('FAIL: sees %s other sales', v_count) end;

    -- Void the discounted sale at the counter, approved with the admin's PIN
    v_result := public.void_sale(v_sale2.id, 'Customer changed their mind', 'zz_admin_' || v_tag, '2468');
    select stock_qty into v_stock from public.products where id = v_product_id;
    v_tests := v_tests || 'Void with the admin PIN returns the stock (14 + 1 = 15)'::text;
    v_results := v_results || case when (v_result ->> 'ok')::boolean and v_stock = 15 then 'PASS'
      else format('FAIL: result %s, stock %s', v_result, v_stock) end;

    -- Close shift 1: 1000.00 + 100.00 + 150.00 (the voided sale is not counted) = 1250.00
    v_shift := public.close_shift(v_shift1_id, 1250.00);
    v_tests := v_tests || 'Close shift 1: expected 1250.00, difference 0.00'::text;
    v_results := v_results || case when v_shift.expected_cash = 1250.00 and v_shift.difference = 0.00 then 'PASS'
      else format('FAIL: expected %s, difference %s', v_shift.expected_cash, v_shift.difference) end;

    -- =====================================================================
    -- Shift 2: refund a sale from shift 1
    -- =====================================================================
    insert into public.shifts (starting_cash) values (500.00) returning id into v_shift2_id;

    v_error := null;
    begin
      v_result := public.void_sale(v_sale1.id, 'Too late for a void', 'zz_admin_' || v_tag, '2468');
    exception when others then v_error := sqlerrm; end;
    v_tests := v_tests || 'A sale from a closed shift cannot be voided'::text;
    v_results := v_results || case when v_error ilike '%already closed%' then 'PASS'
      else format('FAIL: %s', coalesce(v_error, v_result::text)) end;

    v_result := public.refund_sale(v_sale1.id, 'Customer returned the rice', 'zz_admin_' || v_tag, '2468');
    select stock_qty into v_stock from public.products where id = v_product_id;
    select * into v_cash from public.shift_cash_summary(v_shift2_id);
    v_tests := v_tests || 'Refund in a later shift returns stock (15 + 2 = 17) and takes 100.00 from shift 2'::text;
    v_results := v_results || case
      when (v_result ->> 'ok')::boolean and v_stock = 17 and v_cash.refunds = 100.00 and v_cash.expected_cash = 400.00 then 'PASS'
      else format('FAIL: result %s, stock %s, refunds %s, expected %s', v_result, v_stock, v_cash.refunds, v_cash.expected_cash) end;

    -- Close shift 2 with 10.00 short: 400.00 expected, 390.00 counted
    v_shift := public.close_shift(v_shift2_id, 390.00);
    v_tests := v_tests || 'Close shift 2: expected 400.00, difference -10.00'::text;
    v_results := v_results || case when v_shift.expected_cash = 400.00 and v_shift.difference = -10.00 then 'PASS'
      else format('FAIL: expected %s, difference %s', v_shift.expected_cash, v_shift.difference) end;

    reset role;

    -- =====================================================================
    -- Admin checks the reports for today
    -- =====================================================================
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_admin_id, 'role', 'authenticated')::text, true);
    set local role authenticated;

    select * into v_report_after from public.report_summary(v_today, v_today);
    -- 100.00 (refunded later) + 150.00 - 100.00 refund = 150.00; the voided 40.00 is not counted
    v_tests := v_tests || 'Report: +150.00 sales, +2 transactions, +3 items, +100.00 refunds'::text;
    v_results := v_results || case
      when v_report_after.total_sales - v_report_before.total_sales = 150.00
        and v_report_after.transaction_count - v_report_before.transaction_count = 2
        and v_report_after.items_sold - v_report_before.items_sold = 3
        and v_report_after.refunds - v_report_before.refunds = 100.00 then 'PASS'
      else format('FAIL: sales %s, transactions %s, items %s, refunds %s',
        v_report_after.total_sales - v_report_before.total_sales,
        v_report_after.transaction_count - v_report_before.transaction_count,
        v_report_after.items_sold - v_report_before.items_sold,
        v_report_after.refunds - v_report_before.refunds) end;

    select quantity into v_count from public.report_best_sellers(v_today, v_today, 50) where product_id = v_product_id;
    v_tests := v_tests || 'Best sellers: 3 sold (2 + 3, minus the 2 refunded; the voided sale is not counted)'::text;
    v_results := v_results || case when v_count = 3 then 'PASS' else format('FAIL: quantity %s', v_count) end;

    select count(*) into v_count from public.report_shift_summary(v_today, v_today)
    where shift_id in (v_shift1_id, v_shift2_id);
    v_tests := v_tests || 'Shift summary lists both shifts'::text;
    v_results := v_results || case when v_count = 2 then 'PASS' else format('FAIL: %s shifts', v_count) end;

    select count(*) into v_count from public.report_daily_sales(v_today, v_today);
    v_tests := v_tests || 'Daily sales has a row for today'::text;
    v_results := v_results || case when v_count = 1 then 'PASS' else format('FAIL: %s rows', v_count) end;

    -- Admin turns the cashier off; the cashier then sees nothing.
    update public.profiles set is_active = false where id = v_cashier_id;
    reset role;
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_cashier_id, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select count(*) into v_count from public.products;
    v_tests := v_tests || 'A turned-off cashier cannot read any products'::text;
    v_results := v_results || case when v_count = 0 then 'PASS' else format('FAIL: sees %s products', v_count) end;
    reset role;

    raise exception 'test rollback';
  exception when others then
    if sqlerrm <> 'test rollback' then
      v_tests := v_tests || 'SETUP ERROR'::text;
      v_results := v_results || sqlerrm;
    end if;
  end;

  insert into daily_flow_results (test, result)
  select * from unnest(v_tests, v_results);
end;
$$;

select test, result from daily_flow_results;
