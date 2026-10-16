-- Admin approval PIN for voids and refunds, so a cashier does not need to log out.
-- The PIN is stored only as a bcrypt hash. After 5 wrong tries the PIN is
-- locked for 5 minutes.

alter table public.profiles
  add column approval_pin_hash text,
  add column pin_failed_attempts integer not null default 0 check (pin_failed_attempts >= 0),
  add column pin_locked_until timestamptz;

-- The PIN columns are never readable from the app; only the functions below use them.
revoke select on public.profiles from authenticated;
grant select (id, full_name, username, role, is_active, created_at, updated_at)
  on public.profiles to authenticated;

-- Active users can now see everyone's name (for example, who approved a void
-- or which cashier made a sale). Inactive users still only see their own profile.
drop policy "Users can view their own profile and admins can view all" on public.profiles;

create policy "Users can view their own profile and active users can view all"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_active_user()));

-- ---------------------------------------------------------------------------
-- set_approval_pin: an admin sets or changes their own PIN (4 to 6 digits)
-- ---------------------------------------------------------------------------

create function public.set_approval_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can set an approval PIN.';
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    raise exception 'The PIN must be 4 to 6 digits.';
  end if;

  update public.profiles
  set
    approval_pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')),
    pin_failed_attempts = 0,
    pin_locked_until = null
  where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- check_admin_approval: checks an admin's username and PIN.
-- Returns the admin's id, or a message when the approval is rejected.
-- It does not raise an error for a wrong PIN, so the failed try is saved.
-- Used only by the void and refund functions.
-- ---------------------------------------------------------------------------

create function public.check_admin_approval(
  p_username text,
  p_pin text,
  out admin_id uuid,
  out message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin public.profiles;
  v_attempts integer;
begin
  select * into v_admin
  from public.profiles
  where username = lower(trim(p_username))
  for update;

  -- Unknown users, cashiers, and inactive accounts get the same message.
  if not found or v_admin.role <> 'admin' or not v_admin.is_active then
    message := 'Wrong admin username or PIN.';
    return;
  end if;

  if v_admin.pin_locked_until is not null and v_admin.pin_locked_until > now() then
    message := format(
      'Too many wrong PINs. Try again after %s.',
      to_char(v_admin.pin_locked_until at time zone 'Asia/Manila', 'FMHH12:MI AM')
    );
    return;
  end if;

  if v_admin.approval_pin_hash is null then
    message := 'This admin has not set an approval PIN yet.';
    return;
  end if;

  if p_pin is null or v_admin.approval_pin_hash <> extensions.crypt(p_pin, v_admin.approval_pin_hash) then
    v_attempts := v_admin.pin_failed_attempts + 1;

    if v_attempts >= 5 then
      update public.profiles
      set pin_failed_attempts = 0, pin_locked_until = now() + interval '5 minutes'
      where id = v_admin.id;
      message := 'Too many wrong PINs. The PIN is locked for 5 minutes.';
    else
      update public.profiles set pin_failed_attempts = v_attempts where id = v_admin.id;
      message := format('Wrong admin username or PIN. %s tries left.', 5 - v_attempts);
    end if;
    return;
  end if;

  update public.profiles
  set pin_failed_attempts = 0, pin_locked_until = null
  where id = v_admin.id;

  admin_id := v_admin.id;
end;
$$;

revoke execute on function public.set_approval_pin(text) from public, anon;
grant execute on function public.set_approval_pin(text) to authenticated;
revoke execute on function public.check_admin_approval(text, text) from public, anon, authenticated;
