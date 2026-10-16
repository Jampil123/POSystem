-- Kuya Tata POS: enums and tables (development plan, section 4).
-- Money is numeric(10,2). Quantities are whole numbers.
-- Prices already include VAT, so a sale's total is its subtotal less the discount.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'cashier');
create type public.sale_status as enum ('completed', 'voided', 'refunded');
create type public.movement_type as enum ('stock_in', 'sale', 'adjustment', 'void', 'refund');
create type public.void_type as enum ('void', 'refund');

-- Keeps updated_at current on rows that can be edited.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

-- One row per login account. Created automatically by a trigger on auth.users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  username text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  role public.user_role not null default 'cashier',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

-- Category names are unique, ignoring upper and lower case.
create unique index categories_name_unique on public.categories (lower(name));

create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  barcode text unique check (barcode is null or length(trim(barcode)) > 0),
  cost_price numeric(10,2) not null default 0 check (cost_price >= 0),
  selling_price numeric(10,2) not null check (selling_price >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  low_stock_level integer not null default 5 check (low_stock_level >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------

-- A delivery from a supplier.
create table public.stock_ins (
  id bigint generated always as identity primary key,
  supplier_name text,
  received_at timestamptz not null default now(),
  received_by uuid references public.profiles (id), -- null only for seed data (opening stock)
  notes text,
  created_at timestamptz not null default now()
);

create table public.stock_in_items (
  id bigint generated always as identity primary key,
  stock_in_id bigint not null references public.stock_ins (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(10,2) not null check (unit_cost >= 0)
);

create index stock_in_items_stock_in_id_idx on public.stock_in_items (stock_in_id);
create index stock_in_items_product_id_idx on public.stock_in_items (product_id);

create table public.stock_adjustments (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete restrict,
  quantity_change integer not null check (quantity_change <> 0),
  reason text not null check (length(trim(reason)) > 0),
  adjusted_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index stock_adjustments_product_id_idx on public.stock_adjustments (product_id);

-- Full history of every stock change. reference_id is the id of the stock_in,
-- stock_adjustment, or sale that caused the change (depending on type).
create table public.stock_movements (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete restrict,
  type public.movement_type not null,
  quantity_change integer not null check (quantity_change <> 0),
  reference_id bigint,
  created_by uuid references public.profiles (id), -- null only for seed data (opening stock)
  created_at timestamptz not null default now(),
  -- Sales take stock out; stock in, void, and refund put it back; adjustments go either way.
  constraint stock_movements_direction check (
    (type = 'sale' and quantity_change < 0)
    or (type in ('stock_in', 'void', 'refund') and quantity_change > 0)
    or type = 'adjustment'
  )
);

create index stock_movements_product_id_idx on public.stock_movements (product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Shifts and sales
-- ---------------------------------------------------------------------------

create table public.shifts (
  id bigint generated always as identity primary key,
  cashier_id uuid not null default auth.uid() references public.profiles (id),
  opened_at timestamptz not null default now(),
  starting_cash numeric(10,2) not null check (starting_cash >= 0),
  closed_at timestamptz,
  expected_cash numeric(10,2),
  actual_cash numeric(10,2) check (actual_cash >= 0),
  difference numeric(10,2),
  -- A shift is either open (no closing values) or closed (all closing values filled in).
  constraint shifts_closing_values check (
    (closed_at is null and expected_cash is null and actual_cash is null and difference is null)
    or (
      closed_at is not null
      and expected_cash is not null
      and actual_cash is not null
      and difference = actual_cash - expected_cash
    )
  ),
  constraint shifts_closed_after_opened check (closed_at is null or closed_at >= opened_at)
);

-- A cashier can have only one open shift at a time.
create unique index shifts_one_open_per_cashier on public.shifts (cashier_id) where closed_at is null;
create index shifts_opened_at_idx on public.shifts (opened_at desc);

-- Receipt numbers: 000001, 000002, ... (keeps growing past 999999 instead of cutting digits).
create sequence public.receipt_no_seq;

create function public.next_receipt_no()
returns text
language sql
volatile
set search_path = ''
as $$
  select lpad(n::text, greatest(6, length(n::text)), '0')
  from (select nextval('public.receipt_no_seq') as n) as next_value;
$$;

create table public.sales (
  id bigint generated always as identity primary key,
  receipt_no text not null unique default public.next_receipt_no(),
  shift_id bigint not null references public.shifts (id),
  cashier_id uuid not null references public.profiles (id),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  vat_amount numeric(10,2) not null default 0 check (vat_amount >= 0),
  total numeric(10,2) not null check (total >= 0),
  cash_received numeric(10,2) not null,
  change numeric(10,2) not null,
  status public.sale_status not null default 'completed',
  created_at timestamptz not null default now(),
  constraint sales_discount_not_above_subtotal check (discount <= subtotal),
  constraint sales_total_is_subtotal_less_discount check (total = subtotal - discount),
  constraint sales_vat_not_above_total check (vat_amount <= total),
  constraint sales_cash_covers_total check (cash_received >= total),
  constraint sales_change_is_cash_less_total check (change = cash_received - total)
);

create index sales_shift_id_idx on public.sales (shift_id);
create index sales_cashier_id_idx on public.sales (cashier_id, created_at desc);
create index sales_created_at_idx on public.sales (created_at desc);

-- product_name and unit_price are copied at the time of sale so old receipts stay correct.
create table public.sale_items (
  id bigint generated always as identity primary key,
  sale_id bigint not null references public.sales (id) on delete restrict,
  product_id bigint not null references public.products (id) on delete restrict,
  product_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10,2) not null,
  constraint sale_items_line_total check (line_total = unit_price * quantity)
);

create index sale_items_sale_id_idx on public.sale_items (sale_id);
create index sale_items_product_id_idx on public.sale_items (product_id);

-- One void or refund per sale, with the admin who approved it.
create table public.sale_voids (
  id bigint generated always as identity primary key,
  sale_id bigint not null unique references public.sales (id) on delete restrict,
  type public.void_type not null,
  reason text not null check (length(trim(reason)) > 0),
  approved_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Completed sales are never edited or deleted. The only allowed change is
-- marking a completed sale as voided or refunded (done by void_sale / refund_sale).
create function public.protect_sales()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Sales cannot be deleted. Use void or refund instead.';
  end if;

  if old.status <> 'completed'
    or new.status not in ('voided', 'refunded')
    or (to_jsonb(new) - 'status') <> (to_jsonb(old) - 'status') then
    raise exception 'Sales cannot be edited. Only a completed sale can be voided or refunded.';
  end if;

  return new;
end;
$$;

create trigger sales_protect
before update or delete on public.sales
for each row execute function public.protect_sales();

create function public.protect_sale_items()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Sale items cannot be edited or deleted.';
end;
$$;

create trigger sale_items_protect
before update or delete on public.sale_items
for each row execute function public.protect_sale_items();

-- ---------------------------------------------------------------------------
-- Store settings (always exactly one row, id = 1)
-- ---------------------------------------------------------------------------

create table public.store_settings (
  id smallint primary key default 1 check (id = 1),
  store_name text not null default 'Kuya Tata Store' check (length(trim(store_name)) > 0),
  address text not null default '',
  contact_no text not null default '',
  vat_enabled boolean not null default false,
  vat_rate numeric(5,2) not null default 12.00 check (vat_rate >= 0 and vat_rate <= 100),
  receipt_footer text not null default 'This is not an official receipt. Thank you, come again!',
  updated_at timestamptz not null default now()
);

create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

insert into public.store_settings (id) values (1);
