-- ONE-TIME USE, just before the store starts using the system.
--
-- The development and the live system share one Supabase project, so it still
-- has the sample data from seed.sql and the test sales made during testing.
-- This script removes all of it and starts the receipt numbers again at 000001.
--
-- It keeps:
--   - user accounts (remove test users afterwards on the Users page or in the dashboard)
--   - the store settings row (reset to the defaults; fill in the real details on the Settings page)
--
-- How to run: Supabase dashboard -> SQL Editor -> paste this file -> Run.
-- This cannot be undone. Make a backup first (see docs/deployment-guide.md).
--
-- This is not a migration: it changes data, not the database structure, and it
-- must never run again once real sales exist.

begin;

-- TRUNCATE empties the tables at once. It does not run the "sales cannot be
-- deleted" rule, which only applies to deleting single sales.
truncate table
  public.sale_voids,
  public.sale_items,
  public.sales,
  public.shifts,
  public.stock_movements,
  public.stock_adjustments,
  public.stock_in_items,
  public.stock_ins,
  public.products,
  public.categories
restart identity;

alter sequence public.receipt_no_seq restart with 1;

update public.store_settings
set
  store_name = 'Kuya Tata Store',
  address = '',
  contact_no = '',
  vat_enabled = false,
  vat_rate = 12.00,
  receipt_footer = 'This is not an official receipt. Thank you, come again!',
  receipt_paper_width = 58,
  default_low_stock_level = 5
where id = 1;

-- Approval PIN lockouts from testing are cleared.
update public.profiles set pin_failed_attempts = 0, pin_locked_until = null;

commit;
