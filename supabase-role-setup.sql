-- ============================================================
-- Callrolin — Role-based authentication setup
-- Run this ONCE in Supabase SQL Editor (SQL Editor → New query)
-- ============================================================

-- 1. Profiles table: stores each user's role (linked to Supabase Auth)
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp default now()
);

-- 2. Enable Row Level Security
alter table profiles enable row level security;

-- 3. Users can read their own profile (needed to check role after login)
create policy "Users can view their own profile"
on profiles
for select
to authenticated
using (auth.uid() = id);

-- 4. Users can insert ONLY their own profile row, and can never set
--    role to 'admin' themselves (it defaults to 'user' and the CHECK
--    constraint above only allows 'user' or 'admin' — the app never
--    sends a role value on signup, so it always defaults to 'user').
create policy "Users can insert their own profile"
on profiles
for insert
to authenticated
with check (auth.uid() = id);

-- ============================================================
-- HOW TO MAKE SOMEONE AN ADMIN (manual, secure — do this yourself
-- in the Supabase Table Editor, never from the frontend):
--
-- 1. Go to Table Editor → profiles
-- 2. Find the row for the person who should be admin
--    (they must sign up normally first, so their row exists)
-- 3. Edit that row's "role" column from "user" to "admin"
-- 4. Save
--
-- That person will now be redirected to the Admin Dashboard on
-- their next login. Nobody can do this from the website itself.
-- ============================================================
