create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  allowed_systems text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.distribution_records (
  id uuid primary key default gen_random_uuid(),
  system text not null,
  barcode text not null,
  product_name text not null,
  archive_supply_price numeric(12,2) not null default 0,
  archive_sale_price numeric(12,2) not null default 0,
  promo_supply_price numeric(12,2) not null default 0,
  promo_sale_price numeric(12,2) not null default 0,
  monthly_guide_price numeric(12,2) not null default 0,
  updated_by uuid references auth.users(id),
  updated_by_name text,
  updated_at timestamptz not null default now()
);

create table if not exists public.distribution_change_logs (
  id uuid primary key default gen_random_uuid(),
  record_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  system text not null,
  product_name text not null,
  changed_by uuid references auth.users(id),
  changed_by_name text,
  changed_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.distribution_records enable row level security;
alter table public.distribution_change_logs enable row level security;

create policy "profiles readable for signed in users"
on public.profiles
for select
to authenticated
using (true);

create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "records readable for signed in users"
on public.distribution_records
for select
to authenticated
using (true);

create policy "records editable for signed in users"
on public.distribution_records
for all
to authenticated
using (true)
with check (true);

create policy "logs readable for signed in users"
on public.distribution_change_logs
for select
to authenticated
using (true);

create policy "logs insertable for signed in users"
on public.distribution_change_logs
for insert
to authenticated
with check (true);
