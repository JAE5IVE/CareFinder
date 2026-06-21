create extension if not exists postgis;

create type public.user_role as enum ('public', 'admin');
create type public.ownership_type as enum ('public', 'private', 'unknown');
create type public.review_status as enum ('pending', 'approved', 'hidden');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'public',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'public')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  lga text not null,
  state text not null,
  phone text not null,
  email text,
  ownership public.ownership_type not null,
  specialties text[] not null default '{}',
  visiting_hours_markdown text,
  description_markdown text,
  notes_markdown text,
  location geography(point, 4326) not null,
  photo_urls text[] not null default '{}',
  source_name text,
  source_id text,
  source_updated_at timestamptz,
  facility_category text,
  care_level text,
  functional_status text,
  status text not null default 'approved' check (status in ('approved', 'pending')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hospitals
add constraint hospitals_source_record_unique unique (source_name, source_id);

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

create or replace view public.hospitals_with_ratings as
select
  h.id,
  h.name,
  h.address,
  h.city,
  h.lga,
  h.state,
  h.phone,
  h.email,
  h.ownership,
  h.specialties,
  h.visiting_hours_markdown,
  h.description_markdown,
  h.notes_markdown,
  h.location,
  h.photo_urls,
  h.status,
  h.created_by,
  h.created_at,
  h.updated_at,
  st_y(h.location::geometry) as latitude,
  st_x(h.location::geometry) as longitude,
  coalesce(round(avg(r.rating)::numeric, 1), 0) as rating,
  count(r.id) filter (where r.status = 'approved') as review_count,
  h.source_name,
  h.source_id,
  h.source_updated_at,
  h.facility_category,
  h.care_level,
  h.functional_status
from public.hospitals h
left join public.reviews r
  on r.hospital_id = h.id
  and r.status = 'approved'
group by h.id;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
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
returns setof public.hospitals_with_ratings
language sql
stable
as $$
  select *
  from public.hospitals_with_ratings
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
using (status = 'approved' or public.is_admin());

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

insert into storage.buckets (id, name, public)
values ('hospital-images', 'hospital-images', true)
on conflict (id) do nothing;

create policy "public can read hospital images"
on storage.objects for select
using (bucket_id = 'hospital-images');

create policy "admins can upload hospital images"
on storage.objects for insert
with check (bucket_id = 'hospital-images' and public.is_admin());

create policy "admins can update hospital images"
on storage.objects for update
using (bucket_id = 'hospital-images' and public.is_admin())
with check (bucket_id = 'hospital-images' and public.is_admin());

create policy "admins can delete hospital images"
on storage.objects for delete
using (bucket_id = 'hospital-images' and public.is_admin());
