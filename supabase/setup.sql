create extension if not exists "pgcrypto";

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create table if not exists public.systems (
  id text primary key,
  label text not null,
  editable boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.systems
  add column if not exists system_type text,
  add column if not exists region text,
  add column if not exists cooperation_status text,
  add column if not exists business_scope text,
  add column if not exists key_categories text,
  add column if not exists settlement_notes text,
  add column if not exists completeness_score integer not null default 0,
  add column if not exists updated_at text,
  add column if not exists next_review_date text,
  add column if not exists notes text;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account text,
  email text not null,
  display_name text not null,
  role text not null default 'viewer' check (role in ('viewer', 'editor', 'admin')),
  view_system_ids text[] not null default '{}',
  edit_system_ids text[] not null default '{}',
  allowed_systems text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'invited')),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists account text,
  add column if not exists email text,
  add column if not exists display_name text,
  add column if not exists role text not null default 'viewer',
  add column if not exists view_system_ids text[] not null default '{}',
  add column if not exists edit_system_ids text[] not null default '{}',
  add column if not exists allowed_systems text[] not null default '{}',
  add column if not exists status text not null default 'active',
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  alter column role set default 'viewer';

alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check check (role in ('viewer', 'editor', 'admin'));

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
  system_id text not null default 'global-price-guide',
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

alter table public.price_guides
  drop constraint if exists price_guides_system_id_fkey,
  alter column system_id set default 'global-price-guide';

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

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists products_system_id_idx on public.products (system_id);
create index if not exists stores_system_id_idx on public.stores (system_id);
create index if not exists sales_records_system_id_idx on public.sales_records (system_id);
create index if not exists change_logs_system_id_idx on public.change_logs (system_id);
create index if not exists alerts_system_id_idx on public.alerts (system_id);

create or replace function app_private.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'viewer'
  );
$$;

create or replace function app_private.can_manage_accounts()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.current_role() = 'admin';
$$;

create or replace function app_private.can_view_system(target_system_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    app_private.current_role() = 'admin'
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and (
          target_system_id = any(view_system_ids)
          or target_system_id = any(edit_system_ids)
          or target_system_id = any(allowed_systems)
          or ('v:' || target_system_id) = any(allowed_systems)
          or ('e:' || target_system_id) = any(allowed_systems)
        )
    );
$$;

create or replace function app_private.can_edit_system(target_system_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    app_private.current_role() = 'admin'
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and (
          target_system_id = any(edit_system_ids)
          or ('e:' || target_system_id) = any(allowed_systems)
        )
    );
$$;

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on
  public.systems,
  public.profiles,
  public.products,
  public.stores,
  public.sales_records,
  public.price_guides,
  public.change_logs,
  public.alerts
to authenticated;

grant execute on function app_private.current_role() to authenticated;
grant execute on function app_private.can_manage_accounts() to authenticated;
grant execute on function app_private.can_view_system(text) to authenticated;
grant execute on function app_private.can_edit_system(text) to authenticated;

drop policy if exists "systems authenticated read" on public.systems;
drop policy if exists "systems scoped read" on public.systems;
create policy "systems scoped read"
on public.systems
for select
to authenticated
using (app_private.can_view_system(id));

drop policy if exists "systems admin write" on public.systems;
drop policy if exists "systems admin insert" on public.systems;
create policy "systems admin insert"
on public.systems
for insert
to authenticated
with check (app_private.can_manage_accounts());

drop policy if exists "systems scoped update" on public.systems;
create policy "systems scoped update"
on public.systems
for update
to authenticated
using (app_private.can_edit_system(id))
with check (app_private.can_edit_system(id));

drop policy if exists "systems admin delete" on public.systems;
create policy "systems admin delete"
on public.systems
for delete
to authenticated
using (app_private.can_manage_accounts());

drop policy if exists "profiles authenticated read" on public.profiles;
drop policy if exists "profiles readable for signed in users" on public.profiles;
drop policy if exists "profiles self or admin read" on public.profiles;
create policy "profiles self or admin read"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or app_private.can_manage_accounts());

drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "profiles admin insert" on public.profiles;
create policy "profiles admin insert"
on public.profiles
for insert
to authenticated
with check (app_private.can_manage_accounts());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update"
on public.profiles
for update
to authenticated
using (app_private.can_manage_accounts())
with check (app_private.can_manage_accounts());

drop policy if exists "profiles admin delete" on public.profiles;
create policy "profiles admin delete"
on public.profiles
for delete
to authenticated
using (app_private.can_manage_accounts());

do $$
begin
  if to_regclass('public.distribution_records') is not null then
    drop policy if exists "records editable for signed in users" on public.distribution_records;
  end if;
  if to_regclass('public.distribution_change_logs') is not null then
    drop policy if exists "logs insertable for signed in users" on public.distribution_change_logs;
  end if;
end $$;

drop policy if exists "products authenticated access" on public.products;
drop policy if exists "products scoped read" on public.products;
create policy "products scoped read"
on public.products
for select
to authenticated
using (app_private.can_view_system(system_id));

drop policy if exists "products scoped insert" on public.products;
create policy "products scoped insert"
on public.products
for insert
to authenticated
with check (app_private.can_edit_system(system_id));

drop policy if exists "products scoped update" on public.products;
create policy "products scoped update"
on public.products
for update
to authenticated
using (app_private.can_edit_system(system_id))
with check (app_private.can_edit_system(system_id));

drop policy if exists "products scoped delete" on public.products;
create policy "products scoped delete"
on public.products
for delete
to authenticated
using (app_private.can_edit_system(system_id));

drop policy if exists "stores authenticated access" on public.stores;
drop policy if exists "stores scoped read" on public.stores;
create policy "stores scoped read"
on public.stores
for select
to authenticated
using (app_private.can_view_system(system_id));

drop policy if exists "stores scoped insert" on public.stores;
create policy "stores scoped insert"
on public.stores
for insert
to authenticated
with check (app_private.can_edit_system(system_id));

drop policy if exists "stores scoped update" on public.stores;
create policy "stores scoped update"
on public.stores
for update
to authenticated
using (app_private.can_edit_system(system_id))
with check (app_private.can_edit_system(system_id));

drop policy if exists "stores scoped delete" on public.stores;
create policy "stores scoped delete"
on public.stores
for delete
to authenticated
using (app_private.can_edit_system(system_id));

drop policy if exists "sales authenticated access" on public.sales_records;
drop policy if exists "sales scoped read" on public.sales_records;
create policy "sales scoped read"
on public.sales_records
for select
to authenticated
using (app_private.can_view_system(system_id));

drop policy if exists "sales scoped insert" on public.sales_records;
create policy "sales scoped insert"
on public.sales_records
for insert
to authenticated
with check (app_private.can_edit_system(system_id));

drop policy if exists "sales scoped update" on public.sales_records;
create policy "sales scoped update"
on public.sales_records
for update
to authenticated
using (app_private.can_edit_system(system_id))
with check (app_private.can_edit_system(system_id));

drop policy if exists "sales scoped delete" on public.sales_records;
create policy "sales scoped delete"
on public.sales_records
for delete
to authenticated
using (app_private.can_edit_system(system_id));

drop policy if exists "price guides authenticated access" on public.price_guides;
drop policy if exists "price guides authenticated read" on public.price_guides;
create policy "price guides authenticated read"
on public.price_guides
for select
to authenticated
using (true);

drop policy if exists "price guides admin insert" on public.price_guides;
create policy "price guides admin insert"
on public.price_guides
for insert
to authenticated
with check (app_private.can_manage_accounts());

drop policy if exists "price guides admin update" on public.price_guides;
create policy "price guides admin update"
on public.price_guides
for update
to authenticated
using (app_private.can_manage_accounts())
with check (app_private.can_manage_accounts());

drop policy if exists "price guides admin delete" on public.price_guides;
create policy "price guides admin delete"
on public.price_guides
for delete
to authenticated
using (app_private.can_manage_accounts());

drop policy if exists "change logs authenticated access" on public.change_logs;
drop policy if exists "change logs scoped read" on public.change_logs;
create policy "change logs scoped read"
on public.change_logs
for select
to authenticated
using (
  app_private.can_manage_accounts()
  or (system_id is not null and app_private.can_view_system(system_id))
);

drop policy if exists "change logs scoped insert" on public.change_logs;
create policy "change logs scoped insert"
on public.change_logs
for insert
to authenticated
with check (
  app_private.can_manage_accounts()
  or (system_id is not null and app_private.can_edit_system(system_id))
);

drop policy if exists "change logs admin update" on public.change_logs;
create policy "change logs admin update"
on public.change_logs
for update
to authenticated
using (app_private.can_manage_accounts())
with check (app_private.can_manage_accounts());

drop policy if exists "change logs admin delete" on public.change_logs;
create policy "change logs admin delete"
on public.change_logs
for delete
to authenticated
using (app_private.can_manage_accounts());

drop policy if exists "alerts authenticated access" on public.alerts;
drop policy if exists "alerts scoped read" on public.alerts;
create policy "alerts scoped read"
on public.alerts
for select
to authenticated
using (
  app_private.can_manage_accounts()
  or (system_id is not null and app_private.can_view_system(system_id))
);

drop policy if exists "alerts admin insert" on public.alerts;
create policy "alerts admin insert"
on public.alerts
for insert
to authenticated
with check (app_private.can_manage_accounts());

drop policy if exists "alerts admin update" on public.alerts;
create policy "alerts admin update"
on public.alerts
for update
to authenticated
using (app_private.can_manage_accounts())
with check (app_private.can_manage_accounts());

drop policy if exists "alerts admin delete" on public.alerts;
create policy "alerts admin delete"
on public.alerts
for delete
to authenticated
using (app_private.can_manage_accounts());

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
