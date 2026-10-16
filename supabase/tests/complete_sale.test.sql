-- Tests for complete_sale: deducts stock, rejects short cash, rejects out-of-stock items.
--
-- How to run (no Docker needed):
--   npx supabase db query --linked -f supabase/tests/complete_sale.test.sql
-- or paste this file into the Supabase dashboard SQL Editor and click Run.
--
-- The test data (a test cashier, shift, category, and products) is created
-- inside a block that is always undone at the end, so nothing is saved.
-- The result is a table with one row per test: PASS or FAIL with the reason.

create temp table if not exists complete_sale_test_results (test text, result text);
truncate complete_sale_test_results;

do $$
declare
  v_tests text[] := '{}';
  v_results text[] := '{}';
  v_user_id uuid := gen_random_uuid();
  v_username text := 'zz_test_' || left(replace(gen_random_uuid()::text, '-', ''), 12);
  v_category_id bigint;
  v_product_id bigint;
  v_empty_product_id bigint;
  v_stock integer;
  v_movements integer;
  v_error text;
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

    insert into public.shifts (cashier_id, starting_cash) values (v_user_id, 500.00);

    insert into public.categories (name)
    values (v_username || ' category')
    returning id into v_category_id;

    insert into public.products (category_id, name, selling_price, stock_qty)
    values (v_category_id, 'Test Item', 25.00, 10)
    returning id into v_product_id;

    insert into public.products (category_id, name, selling_price, stock_qty)
    values (v_category_id, 'Test Empty Item', 30.00, 0)
    returning id into v_empty_product_id;

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
