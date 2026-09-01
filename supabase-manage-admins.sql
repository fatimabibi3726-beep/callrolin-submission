-- ============================================================
-- Callrolin — "Manage Admins" secure function
-- Run this ONCE in Supabase SQL Editor
--
-- This lets an EXISTING admin promote another already-registered
-- user to admin by typing their email in the Admin Dashboard —
-- no shared secret code needed. Only someone who is already an
-- admin can successfully call this function.
-- ============================================================

create or replace function promote_user_by_email(target_email text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_role text;
  target_id uuid;
begin
  -- Confirm the person calling this is themselves an admin
  select role into caller_role from profiles where id = auth.uid();
  if caller_role is distinct from 'admin' then
    return 'not_authorized';
  end if;

  -- Find the target user by email
  select id into target_id from auth.users where email = target_email;
  if target_id is null then
    return 'user_not_found';
  end if;

  update profiles set role = 'admin' where id = target_id;
  return 'success';
end;
$$;

grant execute on function promote_user_by_email(text) to authenticated;
