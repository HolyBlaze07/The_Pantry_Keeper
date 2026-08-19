create extension if not exists pgcrypto;

create table if not exists public.groceries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  quantity numeric not null default 1,
  preferred_quantity numeric,
  quantity_unit text not null,
  weight numeric,
  weight_unit text,
  expiration_date date,
  price numeric,
  sprite_id text,
  storage_location text,
  brand text,
  purchased_at text,
  date_added timestamptz default now()
);

alter table public.groceries enable row level security;

drop policy if exists "Users can view own groceries" on public.groceries;
drop policy if exists "Users can insert own groceries" on public.groceries;
drop policy if exists "Users can update own groceries" on public.groceries;
drop policy if exists "Users can delete own groceries" on public.groceries;

create policy "Users can view own groceries"
on public.groceries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own groceries"
on public.groceries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own groceries"
on public.groceries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own groceries"
on public.groceries
for delete
to authenticated
using ((select auth.uid()) = user_id);
