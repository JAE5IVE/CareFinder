import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(resolve(process.cwd(), 'supabase/schema.sql'), 'utf8').toLowerCase();

describe('Supabase schema and RLS contract', () => {
  it('enables PostGIS for radius queries', () => {
    expect(schema).toContain('create extension if not exists postgis');
    expect(schema).toContain('hospitals_within_radius');
    expect(schema).toContain('st_dwithin');
  });

  it('enables RLS on protected tables', () => {
    expect(schema).toContain('alter table public.profiles enable row level security');
    expect(schema).toContain('alter table public.hospitals enable row level security');
    expect(schema).toContain('alter table public.reviews enable row level security');
  });

  it('restricts hospital writes to admins', () => {
    expect(schema).toContain('admins can insert hospitals');
    expect(schema).toContain('admins can update hospitals');
    expect(schema).toContain('admins can delete hospitals');
    expect(schema).toContain('public.is_admin()');
  });

  it('allows public reads of approved hospitals and reviews', () => {
    expect(schema).toContain('everyone can read hospitals');
    expect(schema).toContain('everyone can read approved reviews');
  });

  it('includes storage policies for hospital images', () => {
    expect(schema).toContain('hospital-images');
    expect(schema).toContain('admins can upload hospital images');
  });
});
