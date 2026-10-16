-- Role helpers used by the security rules and database functions, and the
-- trigger that creates a profile for every new login account.

-- True when the logged-in user has an active profile.
-- security definer lets it read profiles without being blocked by the profiles security rules.
create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active
  );
$$;

-- True when the logged-in user is an active admin.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active and role = 'admin'
  );
$$;

revoke execute on function public.is_active_user() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Creates a profile when a login account is created.
-- The username comes from the account's metadata, or from the part of the
-- email before "@" (admin@kuyatata.local -> admin). The role is always
-- cashier; an admin is promoted by updating profiles.role.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1)
  ));
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    v_username,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), v_username),
    'cashier'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
