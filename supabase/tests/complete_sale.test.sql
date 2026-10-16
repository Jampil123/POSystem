-- Tests for the database functions:
-- - complete_sale: deducts stock, rejects short cash, rejects out-of-stock items
-- - record_stock_in: increases stock and adds a movement
-- - adjust_stock: rejects negative stock and requires a reason
-- - complete_sale without an open shift is rejected
-- - close_shift: computes the expected cash and the difference
-- - void and refund: return stock; void is rejected after the shift is closed;
--   a wrong PIN or a cashier's PIN is rejected; 5 wrong PINs lock the PIN;
--   a refund lowers the current shift's expected cash
-- - report_summary: leaves out voided sales and subtracts refunds
--
-- How to run (no Docker needed):
--   npm run db:test
-- or paste this file into the Supabase dashboard SQL Editor and click Run.
--
-- The test data (a test cashier and admin, shift, category, and products) is created
-- inside a block that is always undone at the end, so nothing is saved.
-- The result is a table with one row per test: PASS or FAIL with the reason.

create temp table if not exists complete_sale_test_results (test text, result text);
truncate complete_sale_test_results;

do $$
declare
  v_tests text[] := '{}';
  v_results text[] := '{}';
  v_user_id uuid := gen_random_uuid();
  v_admin_id uuid := gen_random_uuid();
  v_username text := 'zz_test_' || left(replace(gen_random_uuid()::text, '-', ''), 12);
  v_category_id bigint;
  v_product_id bigint;
  v_empty_product_id bigint;
  v_stock integer;
  v_movements integer;
  v_error text;
  v_shift public.shifts;
  v_today date := (now() at time zone 'Asia/Manila')::date;
  v_report_before record;
  v_report_after record;
  v_cash record;
  v_result jsonb;
  v_first_sale_id bigint;
  v_second_shift_id bigint;
  v_void_sale_id bigint;
  v_kept_sale_id bigint;
  v_status text;
begin
  -- Everything in this inner block is undone by the final 'test rollback' error.
  -- Variables (the test results) keep their values.
  begin
    -- Test cashier (the profile is created by the handle_new_user trigger)
    insert into auth.users (id, email, raw_user_meta_data)
    values (
      v_user_id,
      v_username || '@kuyatata.local',
      jsonb_build_object('username', v_username, 'full_name', 'Test Cashier')
    );

    -- Act as the test cashier: auth.uid() reads this setting.
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_user_id, 'role', 'authenticated')::text,
      true
    );

    insert into public.categories (name)
    values (v_username || ' category')
    returning id into v_category_id;

    insert into public.products (category_id, name, selling_price, stock_qty)
    values (v_category_id, 'Test Item', 25.00, 10)
    returning id into v_product_id;

    insert into public.products (category_id, name, selling_price, stock_qty)
    values (v_category_id, 'Test Empty Item', 30.00, 0)
    returning id into v_empty_product_id;

    -- Test 0: a sale is rejected while the cashier has no open shift
    v_error := null;
    begin
      perform public.complete_sale(
        jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 1)),
        100.00
      );
    exception when others then
      v_error := sqlerrm;
    end;

    select stock_qty into v_stock from public.products where id = v_product_id;

    v_tests := v_tests || 'complete_sale is rejected without an open shift'::text;
    v_results := v_results || case
      when v_error ilike '%open a shift%' and v_stock = 10 then 'PASS'
      else format('FAIL: error was "%s", stock is %s', coalesce(v_error, 'none, sale was saved'), v_stock)
    end;

    insert into public.shifts (cashier_id, starting_cash) values (v_user_id, 500.00);

    -- Test 1: a completed sale deducts stock and records a stock movement
    perform public.complete_sale(
      jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 3)),
      100.00
    );

    select stock_qty into v_stock from public.products where id = v_product_id;
    select count(*) into v_movements
    from public.stock_movements
    where product_id = v_product_id and type = 'sale' and quantity_change = -3;

    v_tests := v_tests || 'complete_sale deducts stock (10 - 3 = 7)'::text;
    v_results := v_results || case
      when v_stock = 7 and v_movements = 1 then 'PASS'
      else format('FAIL: stock is %s, sale movements found: %s', v_stock, v_movements)
    end;

    -- Test 2: short cash is rejected and stock does not change
    v_error := null;
    begin
      perform public.complete_sale(
        jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 2)),
        40.00 -- total is 50.00
      );
    exception when others then
      v_error := sqlerrm;
    end;

    select stock_qty into v_stock from public.products where id = v_product_id;

    v_tests := v_tests || 'complete_sale rejects short cash'::text;
    v_results := v_results || case
      when v_error ilike '%insufficient cash%' and v_stock = 7 then 'PASS'
      else format('FAIL: error was "%s", stock is %s', coalesce(v_error, 'none, sale was saved'), v_stock)
    end;

    -- Test 3: an out-of-stock item is rejected
    v_error := null;
    begin
      perform public.complete_sale(
        jsonb_build_array(jsonb_build_object('product_id', v_empty_product_id, 'quantity', 1)),
        100.00
      );
    exception when others then
      v_error := sqlerrm;
    end;

    v_tests := v_tests || 'complete_sale rejects an out-of-stock item'::text;
    v_results := v_results || case
      when v_error ilike '%out of stock%' then 'PASS'
      else format('FAIL: error was "%s"', coalesce(v_error, 'none, sale was saved'))
    end;

    -- Test 4: buying more than the stock left is rejected and stock does not change
    v_error := null;
    begin
      perform public.complete_sale(
        jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 8)),
        500.00 -- only 7 left
      );
    exception when others then
      v_error := sqlerrm;
    end;

    select stock_qty into v_stock from public.products where id = v_product_id;

    v_tests := v_tests || 'complete_sale rejects more than the stock left'::text;
    v_results := v_results || case
      when v_error ilike '%not enough stock%' and v_stock = 7 then 'PASS'
      else format('FAIL: error was "%s", stock is %s', coalesce(v_error, 'none, sale was saved'), v_stock)
    end;

    -- Stock tests run as a test admin
    insert into auth.users (id, email, raw_user_meta_data)
    values (
      v_admin_id,
      v_username || '_admin@kuyatata.local',
      jsonb_build_object('username', v_username || '_admin', 'full_name', 'Test Admin')
    );
    update public.profiles set role = 'admin' where id = v_admin_id;

    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_admin_id, 'role', 'authenticated')::text,
      true
    );

    -- Today's report before the void and refund tests (real sales may exist today).
    select * into v_report_before from public.report_summary(v_today, v_today);

    -- Test 5: record_stock_in increases stock and adds a movement
    perform public.record_stock_in(
      jsonb_build_array(
        jsonb_build_object('product_id', v_product_id, 'quantity', 5, 'unit_cost', 20.00)
      ),
      'Test Supplier'
    );

    select stock_qty into v_stock from public.products where id = v_product_id;
    select count(*) into v_movements
    from public.stock_movements
    where product_id = v_product_id and type = 'stock_in' and quantity_change = 5;

    v_tests := v_tests || 'record_stock_in increases stock (7 + 5 = 12) and adds a movement'::text;
    v_results := v_results || case
      when v_stock = 12 and v_movements = 1 then 'PASS'
      else format('FAIL: stock is %s, stock in movements found: %s', v_stock, v_movements)
    end;

    -- Test 6: adjust_stock rejects a change that would make stock negative
    v_error := null;
    begin
      perform public.adjust_stock(v_product_id, -13, 'Damaged'); -- only 12 left
    exception when others then
      v_error := sqlerrm;
    end;

    select stock_qty into v_stock from public.products where id = v_product_id;

    v_tests := v_tests || 'adjust_stock rejects a negative stock result'::text;
    v_results := v_results || case
      when v_error ilike '%cannot remove more than the current stock%' and v_stock = 12 then 'PASS'
      else format('FAIL: error was "%s", stock is %s', coalesce(v_error, 'none, adjustment was saved'), v_stock)
    end;

    -- Test 7: adjust_stock requires a reason
    v_error := null;
    begin
      perform public.adjust_stock(v_product_id, -1, '   ');
    exception when others then
      v_error := sqlerrm;
    end;

    select stock_qty into v_stock from public.products where id = v_product_id;

    v_tests := v_tests || 'adjust_stock requires a reason'::text;
    v_results := v_results || case
      when v_error ilike '%reason%' and v_stock = 12 then 'PASS'
      else format('FAIL: error was "%s", stock is %s', coalesce(v_error, 'none, adjustment was saved'), v_stock)
    end;

    -- Test 8: a valid adjustment changes stock and adds a movement
    perform public.adjust_stock(v_product_id, -2, 'Damaged');

    select stock_qty into v_stock from public.products where id = v_product_id;
    select count(*) into v_movements
    from public.stock_movements
    where product_id = v_product_id and type = 'adjustment' and quantity_change = -2;

    v_tests := v_tests || 'adjust_stock changes stock (12 - 2 = 10) and adds a movement'::text;
    v_results := v_results || case
      when v_stock = 10 and v_movements = 1 then 'PASS'
      else format('FAIL: stock is %s, adjustment movements found: %s', v_stock, v_movements)
    end;

    -- Test 9: close_shift computes the expected cash and the difference.
    -- The cashier's shift started with 500.00 and has one sale of 75.00 (Test 1),
    -- so 575.00 is expected; counting 570.00 means the drawer is 5.00 short.
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_user_id, 'role', 'authenticated')::text,
      true
    );

    select * into v_shift
    from public.close_shift(
      (select id from public.shifts where cashier_id = v_user_id and closed_at is null),
      570.00
    );

    v_tests := v_tests || 'close_shift computes expected cash (575.00) and difference (-5.00)'::text;
    v_results := v_results || case
      when v_shift.expected_cash = 575.00 and v_shift.difference = -5.00 and v_shift.closed_at is not null
        then 'PASS'
      else format(
        'FAIL: expected cash %s, difference %s, closed at %s',
        v_shift.expected_cash, v_shift.difference, v_shift.closed_at
      )
    end;

    -- Void, refund, and approval PIN tests ---------------------------------
    -- Stock of Test Item is 10 here. The Test 1 sale (3 items, 75.00) is in the closed shift.
    select id into v_first_sale_id from public.sales where cashier_id = v_user_id;

    -- The test admin sets an approval PIN.
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_admin_id, 'role', 'authenticated')::text,
      true
    );
    perform public.set_approval_pin('4321');

    -- The cashier opens a second shift and makes two sales: 2 items (50.00) and 1 item (25.00).
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_user_id, 'role', 'authenticated')::text,
      true
    );
    insert into public.shifts (cashier_id, starting_cash)
    values (v_user_id, 500.00)
    returning id into v_second_shift_id;

    select id into v_void_sale_id
    from public.complete_sale(
      jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 2)),
      50.00
    );
    select id into v_kept_sale_id
    from public.complete_sale(
      jsonb_build_array(jsonb_build_object('product_id', v_product_id, 'quantity', 1)),
      25.00
    );

    -- Test 10: a void with the admin's PIN returns the stock (7 + 2 = 9)
    v_result := public.void_sale(v_void_sale_id, 'Wrong item scanned', v_username || '_admin', '4321');

    select stock_qty into v_stock from public.products where id = v_product_id;
    select status into v_status from public.sales where id = v_void_sale_id;
    select count(*) into v_movements
    from public.stock_movements
    where reference_id = v_void_sale_id and type = 'void' and quantity_change = 2;

    v_tests := v_tests || 'void_sale returns stock (7 + 2 = 9) and marks the sale voided'::text;
    v_results := v_results || case
      when (v_result ->> 'ok')::boolean and v_stock = 9 and v_status = 'voided' and v_movements = 1
        then 'PASS'
      else format('FAIL: result %s, stock %s, status %s, movements %s', v_result, v_stock, v_status, v_movements)
    end;

    -- Test 11: a wrong PIN is rejected and nothing changes
    v_result := public.void_sale(v_kept_sale_id, 'Test', v_username || '_admin', '0000');
    select status into v_status from public.sales where id = v_kept_sale_id;

    v_tests := v_tests || 'void_sale rejects a wrong PIN'::text;
    v_results := v_results || case
      when not (v_result ->> 'ok')::boolean and v_status = 'completed' then 'PASS'
      else format('FAIL: result %s, status %s', v_result, v_status)
    end;

    -- Test 12: a cashier's PIN is rejected, even if one was saved
    update public.profiles
    set approval_pin_hash = extensions.crypt('1111', extensions.gen_salt('bf'))
    where id = v_user_id;

    v_result := public.void_sale(v_kept_sale_id, 'Test', v_username, '1111');
    select status into v_status from public.sales where id = v_kept_sale_id;

    v_tests := v_tests || 'void_sale rejects a cashier''s PIN'::text;
    v_results := v_results || case
      when not (v_result ->> 'ok')::boolean and v_status = 'completed' then 'PASS'
      else format('FAIL: result %s, status %s', v_result, v_status)
    end;

    -- Test 13: a void is rejected once the sale's shift is closed
    v_error := null;
    begin
      v_result := public.void_sale(v_first_sale_id, 'Test', v_username || '_admin', '4321');
    exception when others then
      v_error := sqlerrm;
    end;

    v_tests := v_tests || 'void_sale is rejected after the shift is closed'::text;
    v_results := v_results || case
      when v_error ilike '%shift is already closed%' then 'PASS'
      else format('FAIL: error was "%s", result %s', coalesce(v_error, 'none'), v_result)
    end;

    -- Test 14: a refund returns the stock (9 + 3 = 12) and its cash comes out of the
    -- current shift: 500.00 + 25.00 (the voided sale is not counted) - 75.00 = 450.00
    v_result := public.refund_sale(v_first_sale_id, 'Customer returned the items', v_username || '_admin', '4321');

    select stock_qty into v_stock from public.products where id = v_product_id;
    select * into v_cash from public.shift_cash_summary(v_second_shift_id);

    v_tests := v_tests || 'refund_sale returns stock and lowers the current shift''s expected cash'::text;
    v_results := v_results || case
      when (v_result ->> 'ok')::boolean and v_stock = 12
        and v_cash.cash_sales = 25.00 and v_cash.refunds = 75.00 and v_cash.expected_cash = 450.00
        then 'PASS'
      else format(
        'FAIL: result %s, stock %s, cash sales %s, refunds %s, expected %s',
        v_result, v_stock, v_cash.cash_sales, v_cash.refunds, v_cash.expected_cash
      )
    end;

    -- Test 15: today's report leaves out the voided sale and subtracts the refund.
    -- Since the first report: -75.00 refund + 25.00 new sale = -50.00;
    -- 1 more transaction; items -3 + 1 = -2.
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_admin_id, 'role', 'authenticated')::text,
      true
    );
    select * into v_report_after from public.report_summary(v_today, v_today);

    v_tests := v_tests || 'report_summary leaves out voided sales and subtracts refunds'::text;
    v_results := v_results || case
      when v_report_after.total_sales - v_report_before.total_sales = -50.00
        and v_report_after.transaction_count - v_report_before.transaction_count = 1
        and v_report_after.items_sold - v_report_before.items_sold = -2
        and v_report_after.refunds - v_report_before.refunds = 75.00
        then 'PASS'
      else format(
        'FAIL: change in total %s, transactions %s, items %s, refunds %s',
        v_report_after.total_sales - v_report_before.total_sales,
        v_report_after.transaction_count - v_report_before.transaction_count,
        v_report_after.items_sold - v_report_before.items_sold,
        v_report_after.refunds - v_report_before.refunds
      )
    end;

    -- Test 16: after 5 wrong PINs, even the right PIN is refused for a while
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_user_id, 'role', 'authenticated')::text,
      true
    );
    for i in 1..5 loop
      v_result := public.void_sale(v_kept_sale_id, 'Test', v_username || '_admin', '9999');
    end loop;
    v_result := public.void_sale(v_kept_sale_id, 'Test', v_username || '_admin', '4321');
    select status into v_status from public.sales where id = v_kept_sale_id;

    v_tests := v_tests || '5 wrong PINs lock the approval PIN'::text;
    v_results := v_results || case
      when not (v_result ->> 'ok')::boolean and v_result ->> 'message' ilike '%too many%'
        and v_status = 'completed'
        then 'PASS'
      else format('FAIL: result %s, status %s', v_result, v_status)
    end;

    -- Admin account rules ---------------------------------------------------

    -- Test 17: an admin cannot demote their own account
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_admin_id, 'role', 'authenticated')::text,
      true
    );
    v_error := null;
    begin
      update public.profiles set role = 'cashier' where id = v_admin_id;
    exception when others then
      v_error := sqlerrm;
    end;
    select role::text into v_status from public.profiles where id = v_admin_id;

    v_tests := v_tests || 'an admin cannot demote their own account'::text;
    v_results := v_results || case
      when v_error ilike '%your own account%' and v_status = 'admin' then 'PASS'
      else format('FAIL: error was "%s", role is %s', coalesce(v_error, 'none'), v_status)
    end;

    -- Test 18: the last active admin cannot be deactivated.
    -- Every other admin is turned off here (undone at the end), so the test admin is the last one.
    update public.profiles set is_active = false
    where role = 'admin' and is_active and id <> v_admin_id;

    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_user_id, 'role', 'authenticated')::text,
      true
    );
    v_error := null;
    begin
      update public.profiles set is_active = false where id = v_admin_id;
    exception when others then
      v_error := sqlerrm;
    end;
    select is_active::text into v_status from public.profiles where id = v_admin_id;

    v_tests := v_tests || 'the last active admin cannot be deactivated'::text;
    v_results := v_results || case
      when v_error ilike '%last active admin%' and v_status = 'true' then 'PASS'
      else format('FAIL: error was "%s", active is %s', coalesce(v_error, 'none'), v_status)
    end;

    raise exception 'test rollback';
  exception when others then
    -- Any other error means the test setup itself failed; show it.
    if sqlerrm <> 'test rollback' then
      raise;
    end if;
  end;

  insert into complete_sale_test_results (test, result)
  select * from unnest(v_tests, v_results);
end;
$$;

select test, result from complete_sale_test_results;
