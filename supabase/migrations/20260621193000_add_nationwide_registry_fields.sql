alter type public.ownership_type add value if not exists 'unknown';

alter table public.hospitals
  add column if not exists source_name text,
  add column if not exists source_id text,
  add column if not exists source_updated_at timestamptz,
  add column if not exists facility_category text,
  add column if not exists care_level text,
  add column if not exists functional_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hospitals_source_record_unique'
  ) then
    alter table public.hospitals
      add constraint hospitals_source_record_unique unique (source_name, source_id);
  end if;
end
$$;

comment on column public.hospitals.source_name is 'Registry or dataset that supplied the record.';
comment on column public.hospitals.source_id is 'Stable identifier from the source dataset.';
comment on column public.hospitals.source_updated_at is 'Last-update timestamp reported by the source.';

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
