alter table public.profiles
add column if not exists allowed_systems text[] not null default '{}';

update public.profiles
set allowed_systems = '{}'
where allowed_systems is null;
