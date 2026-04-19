create extension if not exists "pgcrypto";

create table if not exists public.systems (
  id text primary key,
  label text not null,
  editable boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account text,
  email text not null,
  display_name text not null,
  role text not null default 'viewer' check (role in ('viewer', 'editor', 'admin')),
  view_system_ids text[] not null default '{}',
  edit_system_ids text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'invited')),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  system_id text not null references public.systems(id) on delete cascade,
  barcode text not null default '',
  product_code text not null default '',
  product_name text not null,
  archive_supply_price numeric(12, 2) not null default 0,
  archive_sale_price numeric(12, 2) not null default 0,
  promo_supply_price numeric(12, 2) not null default 0,
  promo_sale_price numeric(12, 2) not null default 0,
  category text,
  brand text,
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id text primary key,
  system_id text not null references public.systems(id) on delete cascade,
  store_code text not null default '',
  store_name text not null,
  city text not null default '',
  region text not null default '',
  format text not null default '',
  business_status text not null default '营业'
    check (business_status in ('营业', '已闭店', '计划闭店', '计划开业', '店改')),
  planned_close_date text,
  planned_open_date text,
  renovation_open_date text,
  sales_volume numeric(14, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_records (
  id text primary key,
  system_id text not null references public.systems(id) on delete cascade,
  brand text not null,
  period_label text not null,
  granularity text not null check (granularity in ('month', 'quarter', 'year', 'custom')),
  values_json jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by text not null default '系统'
);

create table if not exists public.price_guides (
  id text primary key,
  system_id text not null references public.systems(id) on delete cascade,
  source_file_name text not null default '',
  imported_at timestamptz not null default now(),
  sheet_name text not null default '',
  execution_period text,
  category text,
  publish_date text,
  mail_title text,
  material_code text not null default '',
  sub_category text,
  product_category text,
  product_name text not null,
  spec text,
  carton_size text,
  scope text,
  policy_note text,
  distributor_settlement_price numeric(12, 2),
  key_account_promo_supply_price numeric(12, 2)
);

create table if not exists public.change_logs (
  id text primary key,
  entity text not null check (entity in ('product', 'store', 'sales', 'user', 'system', 'price-guide')),
  action text not null check (action in ('create', 'update', 'delete', 'import', 'save-version')),
  title text not null,
  description text not null,
  system_id text,
  operator text not null,
  timestamp timestamptz not null default now()
);

create table if not exists public.alerts (
  id text primary key,
  title text not null,
  description text not null,
  level text not null check (level in ('critical', 'warning', 'info')),
  system_id text
);

alter table public.systems enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.stores enable row level security;
alter table public.sales_records enable row level security;
alter table public.price_guides enable row level security;
alter table public.change_logs enable row level security;
alter table public.alerts enable row level security;

drop policy if exists "systems authenticated read" on public.systems;
create policy "systems authenticated read"
on public.systems
for select
to authenticated
using (true);

drop policy if exists "systems admin write" on public.systems;
create policy "systems admin write"
on public.systems
for all
to authenticated
using (true)
with check (true);

drop policy if exists "profiles authenticated read" on public.profiles;
create policy "profiles authenticated read"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "products authenticated access" on public.products;
create policy "products authenticated access"
on public.products
for all
to authenticated
using (true)
with check (true);

drop policy if exists "stores authenticated access" on public.stores;
create policy "stores authenticated access"
on public.stores
for all
to authenticated
using (true)
with check (true);

drop policy if exists "sales authenticated access" on public.sales_records;
create policy "sales authenticated access"
on public.sales_records
for all
to authenticated
using (true)
with check (true);

drop policy if exists "price guides authenticated access" on public.price_guides;
create policy "price guides authenticated access"
on public.price_guides
for all
to authenticated
using (true)
with check (true);

drop policy if exists "change logs authenticated access" on public.change_logs;
create policy "change logs authenticated access"
on public.change_logs
for all
to authenticated
using (true)
with check (true);

drop policy if exists "alerts authenticated access" on public.alerts;
create policy "alerts authenticated access"
on public.alerts
for all
to authenticated
using (true)
with check (true);

insert into public.systems (id, label, editable)
values
  ('sys-1', '大润发', true),
  ('sys-2', '广东永辉', true),
  ('sys-3', '广西永辉', true),
  ('sys-4', '易初', true),
  ('sys-5', '沃尔玛', true),
  ('sys-6', '山姆', true),
  ('sys-7', '天虹', true),
  ('sys-8', '华润', true),
  ('sys-9', '麦德龙', true)
on conflict (id) do nothing;
