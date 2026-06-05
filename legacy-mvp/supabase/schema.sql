create extension if not exists postgis;

create type public.user_role as enum ('public', 'admin');
create type public.ownership_type as enum ('public', 'private');
create type public.review_status as enum ('pending', 'approved', 'hidden');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'public',
  created_at timestamptz not null default now()
);

create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  lga text not null,
  phone text not null,
  email text,
  ownership public.ownership_type not null,
  specialties text[] not null default '{}',
  visiting_hours text,
  description_markdown text,
  location geography(point, 4326) not null,
  photo_urls text[] not null default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, user_id)
);

create index hospitals_location_idx on public.hospitals using gist (location);
create index hospitals_city_idx on public.hospitals (city);
create index hospitals_lga_idx on public.hospitals (lga);
create index hospitals_specialties_idx on public.hospitals using gin (specialties);
create index reviews_hospital_idx on public.reviews (hospital_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.hospitals_within_radius(
  lat double precision,
  lng double precision,
  radius_km double precision
)
returns setof public.hospitals
language sql
stable
as $$
  select *
  from public.hospitals
  where st_dwithin(
    location,
    st_setsrid(st_makepoint(lng, lat), 4326)::geography,
    radius_km * 1000
  );
$$;

alter table public.profiles enable row level security;
alter table public.hospitals enable row level security;
alter table public.reviews enable row level security;

create policy "profiles can read their own profile"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "admins can manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "everyone can read hospitals"
on public.hospitals for select
using (true);

create policy "admins can insert hospitals"
on public.hospitals for insert
with check (public.is_admin());

create policy "admins can update hospitals"
on public.hospitals for update
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete hospitals"
on public.hospitals for delete
using (public.is_admin());

create policy "everyone can read approved reviews"
on public.reviews for select
using (status = 'approved' or user_id = auth.uid() or public.is_admin());

create policy "logged in users can create reviews"
on public.reviews for insert
with check (auth.uid() = user_id);

create policy "users can update their pending reviews"
on public.reviews for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id and status = 'pending');

create policy "admins can moderate reviews"
on public.reviews for update
using (public.is_admin())
with check (public.is_admin());
