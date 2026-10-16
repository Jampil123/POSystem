-- Report functions for the Reports page (admin only). Report numbers are
-- computed here instead of loading every sale into the app.
--
-- Rules:
-- - Days use Philippine time (Asia/Manila). p_from and p_to are both included.
-- - Voided sales are left out of every total.
-- - A refunded sale counts on the day it was sold, and its refund is
--   subtracted on the day it was refunded.

-- ---------------------------------------------------------------------------
-- report_entries (internal): every counted sale and refund in the range.
-- sign is +1 for a sale and -1 for a refund of that sale.
-- ---------------------------------------------------------------------------

create function public.report_entries(p_from date, p_to date)
returns table (sale_id bigint, entry_day date, sign integer)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, (s.created_at at time zone 'Asia/Manila')::date, 1
  from public.sales as s
  where s.status in ('completed', 'refunded')
    and (s.created_at at time zone 'Asia/Manila')::date between p_from and p_to
  union all
  select v.sale_id, (v.created_at at time zone 'Asia/Manila')::date, -1
  from public.sale_voids as v
  where v.type = 'refund'
    and (v.created_at at time zone 'Asia/Manila')::date between p_from and p_to;
$$;

-- Checks the caller and the date range for every report function.
create function public.check_report_range(p_from date, p_to date)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can view reports.';
  end if;

  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Choose a valid date range.';
  end if;

  if p_to - p_from > 366 then
    raise exception 'Choose a date range of one year or less.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- report_summary: the summary cards
-- gross_profit only covers sales whose items all have a saved cost;
-- it is null when no sale in the range has cost data.
-- ---------------------------------------------------------------------------

create function public.report_summary(p_from date, p_to date)
returns table (
  total_sales numeric(10,2),
  transaction_count integer,
  items_sold integer,
  average_sale numeric(10,2),
  refunds numeric(10,2),
  gross_profit numeric(10,2),
  sales_without_cost integer,
  low_stock_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
-- Column names in the queries win over the output column names above.
#variable_conflict use_column
begin
  perform public.check_report_range(p_from, p_to);

  return query
  with entries as (
    select
      e.sign,
      s.total,
      items.quantity,
      items.cost
    from public.report_entries(p_from, p_to) as e
    join public.sales as s on s.id = e.sale_id
    cross join lateral (
      select
        sum(i.quantity)::integer as quantity,
        -- null when any item of the sale has no saved cost
        case when bool_and(i.unit_cost is not null) then sum(i.unit_cost * i.quantity) end as cost
      from public.sale_items as i
      where i.sale_id = s.id
    ) as items
  ),
  totals as (
    select
      coalesce(sum(sign * total), 0) as total_sales,
      (count(*) filter (where sign = 1))::integer as transaction_count,
      coalesce(sum(sign * quantity), 0)::integer as items_sold,
      coalesce(sum(total) filter (where sign = -1), 0) as refunds,
      sum(sign * (total - cost)) filter (where cost is not null) as gross_profit,
      (count(*) filter (where sign = 1 and cost is null))::integer as sales_without_cost
    from entries
  )
  select
    totals.total_sales,
    totals.transaction_count,
    totals.items_sold,
    case
      when totals.transaction_count > 0 then round(totals.total_sales / totals.transaction_count, 2)
      else 0
    end,
    totals.refunds,
    totals.gross_profit,
    totals.sales_without_cost,
    (
      select count(*)::integer
      from public.products
      where is_active and stock_qty <= low_stock_level
    )
  from totals;
end;
$$;

-- ---------------------------------------------------------------------------
-- report_daily_sales: net sales per day for the chart (days with no sales are 0)
-- ---------------------------------------------------------------------------

create function public.report_daily_sales(p_from date, p_to date)
returns table (day date, total_sales numeric(10,2), transaction_count integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
-- Column names in the queries win over the output column names above.
#variable_conflict use_column
begin
  perform public.check_report_range(p_from, p_to);

  return query
  select
    days.day::date,
    coalesce(sum(e.sign * s.total), 0)::numeric(10,2),
    (count(e.sale_id) filter (where e.sign = 1))::integer
  from generate_series(p_from, p_to, interval '1 day') as days(day)
  left join public.report_entries(p_from, p_to) as e on e.entry_day = days.day::date
  left join public.sales as s on s.id = e.sale_id
  group by days.day
  order by days.day;
end;
$$;

-- ---------------------------------------------------------------------------
-- report_best_sellers: products by quantity sold (refunded quantities subtracted).
-- sales is the item amount before the sale's discount.
-- ---------------------------------------------------------------------------

create function public.report_best_sellers(p_from date, p_to date, p_limit integer default 10)
returns table (product_id bigint, product_name text, quantity integer, sales numeric(10,2))
language plpgsql
stable
security definer
set search_path = ''
as $$
-- Column names in the queries win over the output column names above.
#variable_conflict use_column
begin
  perform public.check_report_range(p_from, p_to);

  return query
  select
    i.product_id,
    p.name,
    sum(e.sign * i.quantity)::integer as quantity,
    sum(e.sign * i.line_total)::numeric(10,2) as sales
  from public.report_entries(p_from, p_to) as e
  join public.sale_items as i on i.sale_id = e.sale_id
  join public.products as p on p.id = i.product_id
  group by i.product_id, p.name
  having sum(e.sign * i.quantity) > 0
  order by quantity desc, sales desc, p.name
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
end;
$$;

-- ---------------------------------------------------------------------------
-- report_low_stock: active products at or below their low-stock level (now)
-- ---------------------------------------------------------------------------

create function public.report_low_stock()
returns table (
  product_id bigint,
  product_name text,
  category_name text,
  stock_qty integer,
  low_stock_level integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can view reports.';
  end if;

  return query
  select p.id, p.name, c.name, p.stock_qty, p.low_stock_level
  from public.products as p
  join public.categories as c on c.id = p.category_id
  where p.is_active and p.stock_qty <= p.low_stock_level
  order by p.stock_qty, p.name;
end;
$$;

-- ---------------------------------------------------------------------------
-- report_shift_summary: shifts opened in the range
-- ---------------------------------------------------------------------------

create function public.report_shift_summary(p_from date, p_to date)
returns table (
  shift_id bigint,
  cashier_name text,
  opened_at timestamptz,
  closed_at timestamptz,
  starting_cash numeric(10,2),
  expected_cash numeric(10,2),
  actual_cash numeric(10,2),
  difference numeric(10,2)
)
language plpgsql
stable
security definer
set search_path = ''
as $$
-- Column names in the queries win over the output column names above.
#variable_conflict use_column
begin
  perform public.check_report_range(p_from, p_to);

  return query
  select
    sh.id, pr.full_name, sh.opened_at, sh.closed_at,
    sh.starting_cash, sh.expected_cash, sh.actual_cash, sh.difference
  from public.shifts as sh
  join public.profiles as pr on pr.id = sh.cashier_id
  where (sh.opened_at at time zone 'Asia/Manila')::date between p_from and p_to
  order by sh.opened_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Who can call the functions
-- ---------------------------------------------------------------------------

revoke execute on function public.report_entries(date, date) from public, anon, authenticated;
revoke execute on function public.check_report_range(date, date) from public, anon, authenticated;
revoke execute on function public.report_summary(date, date) from public, anon;
revoke execute on function public.report_daily_sales(date, date) from public, anon;
revoke execute on function public.report_best_sellers(date, date, integer) from public, anon;
revoke execute on function public.report_low_stock() from public, anon;
revoke execute on function public.report_shift_summary(date, date) from public, anon;

grant execute on function public.report_summary(date, date) to authenticated;
grant execute on function public.report_daily_sales(date, date) to authenticated;
grant execute on function public.report_best_sellers(date, date, integer) to authenticated;
grant execute on function public.report_low_stock() to authenticated;
grant execute on function public.report_shift_summary(date, date) to authenticated;
