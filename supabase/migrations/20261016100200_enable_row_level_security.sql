-- Security rules (development plan, section 4 "Security").
-- - Cashiers read products, open their own shift, and see their own sales.
-- - Admins can do everything.
-- - Inactive users can only read their own profile (so the app can tell them why).
-- - Sales, sale items, stock changes, and closing a shift have no write rules here:
--   they are written only by the database functions, which check the role themselves.

-- ---------------------------------------------------------------------------
-- Turn on Row Level Security for every table
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_ins enable row level security;
alter table public.stock_in_items enable row level security;
alter table public.stock_adjustments enable row level security;
alter table public.stock_movements enable row level security;
alter table public.shifts enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_voids enable row level security;
alter table public.store_settings enable row level security;

-- Logged-out visitors get no table access at all.
revoke all on all tables in schema public from anon;

-- Helper and trigger functions are not meant to be called from the app.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.protect_sales() from public, anon, authenticated;
revoke execute on function public.protect_sale_items() from public, anon, authenticated;
revoke execute on function public.next_receipt_no() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "Users can view their own profile and admins can view all"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins can update profiles"
on public.profiles for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- New profiles are created only by the handle_new_user trigger.
revoke insert, delete on public.profiles from authenticated;
-- The id and username of a profile never change.
revoke update on public.profiles from authenticated;
grant update (full_name, role, is_active) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create policy "Active users can view categories"
on public.categories for select to authenticated
using ((select public.is_active_user()));

create policy "Admins can add categories"
on public.categories for insert to authenticated
with check ((select public.is_admin()));

create policy "Admins can update categories"
on public.categories for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete categories"
on public.categories for delete to authenticated
using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create policy "Active users can view products"
on public.products for select to authenticated
using ((select public.is_active_user()));

create policy "Admins can add products"
on public.products for insert to authenticated
with check ((select public.is_admin()));

create policy "Admins can update products"
on public.products for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete products"
on public.products for delete to authenticated
using ((select public.is_admin()));

-- stock_qty is left out on purpose: stock only changes through the stock and
-- sale functions, so every change is recorded in stock_movements.
revoke insert, update on public.products from authenticated;
grant insert (category_id, name, barcode, cost_price, selling_price, low_stock_level, is_active)
  on public.products to authenticated;
grant update (category_id, name, barcode, cost_price, selling_price, low_stock_level, is_active)
  on public.products to authenticated;

-- ---------------------------------------------------------------------------
-- Inventory history (written only by record_stock_in, adjust_stock, and the sale functions)
-- ---------------------------------------------------------------------------

create policy "Admins can view stock ins"
on public.stock_ins for select to authenticated
using ((select public.is_admin()));

create policy "Admins can view stock in items"
on public.stock_in_items for select to authenticated
using ((select public.is_admin()));

create policy "Admins can view stock adjustments"
on public.stock_adjustments for select to authenticated
using ((select public.is_admin()));

create policy "Admins can view stock movements"
on public.stock_movements for select to authenticated
using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- shifts (opened with a normal insert, closed only by close_shift)
-- ---------------------------------------------------------------------------

create policy "Users can view their own shifts and admins can view all"
on public.shifts for select to authenticated
using (cashier_id = (select auth.uid()) or (select public.is_admin()));

create policy "Active users can open their own shift"
on public.shifts for insert to authenticated
with check (cashier_id = (select auth.uid()) and (select public.is_active_user()));

-- Only the cashier and starting cash can be set when opening a shift;
-- opened_at is always the current time and the closing values come from close_shift.
revoke insert, update, delete on public.shifts from authenticated;
grant insert (cashier_id, starting_cash) on public.shifts to authenticated;

-- ---------------------------------------------------------------------------
-- sales (written only by complete_sale, void_sale, and refund_sale)
-- ---------------------------------------------------------------------------

create policy "Cashiers can view their own sales and admins can view all"
on public.sales for select to authenticated
using (
  (cashier_id = (select auth.uid()) and (select public.is_active_user()))
  or (select public.is_admin())
);

-- Items and voids follow the sales rule: visible when the sale itself is visible.
create policy "Users can view items of sales they can view"
on public.sale_items for select to authenticated
using (exists (select 1 from public.sales where sales.id = sale_items.sale_id));

create policy "Users can view voids of sales they can view"
on public.sale_voids for select to authenticated
using (exists (select 1 from public.sales where sales.id = sale_voids.sale_id));

-- ---------------------------------------------------------------------------
-- store_settings (one row; read by everyone for receipts and VAT, edited by admins)
-- ---------------------------------------------------------------------------

create policy "Active users can view store settings"
on public.store_settings for select to authenticated
using ((select public.is_active_user()));

create policy "Admins can update store settings"
on public.store_settings for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

revoke insert, delete on public.store_settings from authenticated;
