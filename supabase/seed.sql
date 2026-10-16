-- Sample data: categories, products of a small neighborhood store, opening
-- stock, and the default store settings.
--
-- Login accounts are not created here; see README.md "First admin and cashier accounts".
--
-- Runs as the database owner, so it can set the opening stock directly.
-- Safe to run more than once: it does nothing if products already exist.

do $$
declare
  v_stock_in_id bigint;
begin
  if exists (select 1 from public.products) then
    raise notice 'Seed skipped: products already exist.';
    return;
  end if;

  insert into public.categories (name)
  values
    ('Beverages'),
    ('Snacks and Bread'),
    ('Canned Goods'),
    ('Noodles and Rice'),
    ('Condiments'),
    ('Household');

  -- Barcodes start with 200, the range set aside for in-store codes.
  -- Low stock: 3-in-1 Coffee, Biscuits, Evaporated Milk, Dishwashing Liquid.
  -- Out of stock: Bread Loaf.
  insert into public.products (category_id, name, barcode, cost_price, selling_price, stock_qty, low_stock_level)
  select c.id, p.name, p.barcode, p.cost_price, p.selling_price, p.stock_qty, p.low_stock_level
  from (
    values
      ('Beverages', 'Softdrinks 1L', '2000000000011', 52.00, 65.00, 24, 6),
      ('Beverages', 'Bottled Water 500ml', '2000000000028', 12.00, 18.00, 48, 12),
      ('Beverages', '3-in-1 Coffee Sachet', '2000000000035', 8.00, 10.00, 5, 20),
      ('Snacks and Bread', 'Potato Chips 60g', '2000000000042', 28.00, 35.00, 18, 6),
      ('Snacks and Bread', 'Biscuits Pack', '2000000000059', 8.00, 10.00, 3, 10),
      ('Snacks and Bread', 'Bread Loaf', null, 55.00, 65.00, 0, 5),
      ('Canned Goods', 'Sardines in Tomato Sauce 155g', '2000000000066', 22.00, 28.00, 36, 10),
      ('Canned Goods', 'Corned Beef 150g', '2000000000073', 38.00, 45.00, 12, 6),
      ('Canned Goods', 'Evaporated Milk 370ml', '2000000000080', 32.00, 38.00, 2, 6),
      ('Noodles and Rice', 'Instant Noodles Chicken', '2000000000097', 10.00, 14.00, 60, 20),
      ('Noodles and Rice', 'Rice 1kg', '2000000000103', 48.00, 55.00, 20, 5),
      ('Condiments', 'Soy Sauce 350ml', '2000000000110', 18.00, 24.00, 15, 5),
      ('Condiments', 'Vinegar 350ml', '2000000000127', 15.00, 20.00, 10, 5),
      ('Household', 'Laundry Soap Bar', '2000000000134', 20.00, 25.00, 25, 8),
      ('Household', 'Dishwashing Liquid Sachet', '2000000000141', 6.00, 8.00, 4, 15)
  ) as p(category, name, barcode, cost_price, selling_price, stock_qty, low_stock_level)
  join public.categories as c on c.name = p.category;

  -- Record the opening stock as a stock in, so the movement history matches stock_qty.
  insert into public.stock_ins (supplier_name, notes)
  values (null, 'Opening stock (sample data)')
  returning id into v_stock_in_id;

  insert into public.stock_in_items (stock_in_id, product_id, quantity, unit_cost)
  select v_stock_in_id, id, stock_qty, cost_price
  from public.products
  where stock_qty > 0;

  insert into public.stock_movements (product_id, type, quantity_change, reference_id)
  select id, 'stock_in', stock_qty, v_stock_in_id
  from public.products
  where stock_qty > 0;

  update public.store_settings
  set
    store_name = 'Kuya Tata Store',
    address = 'Sample Street, Barangay Sample, Sample City',
    contact_no = '0900 000 0000',
    vat_enabled = false,
    vat_rate = 12.00,
    receipt_footer = 'This is not an official receipt. Thank you, come again!'
  where id = 1;
end;
$$;
