-- Phase 6: settings for receipts and new products, and safety rules for admin accounts.

-- ---------------------------------------------------------------------------
-- Store settings
-- ---------------------------------------------------------------------------

alter table public.store_settings
  add column receipt_paper_width smallint not null default 58
    check (receipt_paper_width in (58, 80)),
  add column default_low_stock_level integer not null default 5
    check (default_low_stock_level >= 0 and default_low_stock_level <= 1000000);

-- ---------------------------------------------------------------------------
-- Admin accounts
-- - An admin cannot deactivate or demote their own account.
-- - The last active admin cannot be deactivated or demoted.
-- The Users page and the admin-users Edge Function check the same rules first
-- to show a clear message; this trigger makes sure they always hold.
-- (Changes made by the Edge Function have no logged-in user, so only the
-- last-admin rule applies to them; the function checks the own-account rule itself.)
-- ---------------------------------------------------------------------------

create function public.protect_admin_accounts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only an active admin losing admin access matters here.
  if not (old.role = 'admin' and old.is_active) or (new.role = 'admin' and new.is_active) then
    return new;
  end if;

  if old.id = auth.uid() then
    raise exception 'You cannot deactivate or demote your own account.';
  end if;

  -- Lock the admin rows so two admins cannot remove each other at the same time.
  perform 1 from public.profiles where role = 'admin' and is_active for update;

  if not exists (
    select 1 from public.profiles
    where role = 'admin' and is_active and id <> old.id
  ) then
    raise exception 'This is the last active admin. Make another user an admin first.';
  end if;

  return new;
end;
$$;

revoke execute on function public.protect_admin_accounts() from public, anon, authenticated;

create trigger profiles_protect_admin_accounts
before update of role, is_active on public.profiles
for each row execute function public.protect_admin_accounts();
