import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const publicEmail = process.env.TEST_PUBLIC_EMAIL;
const publicPassword = process.env.TEST_PUBLIC_PASSWORD;

const describeIfConfigured = supabaseUrl && anonKey && publicEmail && publicPassword ? describe : describe.skip;

describeIfConfigured('Supabase RLS integration', () => {
  it('blocks non-admin hospital writes at the database layer', async () => {
    const client = createClient(supabaseUrl!, anonKey!);
    const { error: signInError } = await client.auth.signInWithPassword({
      email: publicEmail!,
      password: publicPassword!,
    });
    expect(signInError).toBeNull();

    const { error } = await client.from('hospitals').insert({
      name: 'RLS Test Hospital',
      address: 'Blocked Street',
      city: 'Lagos',
      lga: 'Eti-Osa',
      state: 'Lagos',
      phone: '+234 800 000 0000',
      ownership: 'public',
      specialties: ['Emergency'],
      location: 'SRID=4326;POINT(3.4 6.5)',
      status: 'approved',
    });

    expect(error).not.toBeNull();
    expect(error?.message.toLowerCase()).toMatch(/row-level security|policy|permission/);
  });
});
