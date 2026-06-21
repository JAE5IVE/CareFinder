import { supabase } from './supabase';
import { Hospital, Review, User } from '../types';

type HospitalPayload = Omit<Hospital, 'id' | 'createdAt' | 'rating' | 'reviewCount'>;

function pointFromHospital(hospital: Pick<Hospital, 'longitude' | 'latitude'>) {
  return `SRID=4326;POINT(${hospital.longitude} ${hospital.latitude})`;
}

function mapHospital(row: any): Hospital {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    lga: row.lga,
    state: row.state,
    latitude: row.latitude ?? row.lat ?? 0,
    longitude: row.longitude ?? row.lng ?? 0,
    phone: row.phone,
    email: row.email || '',
    specialties: row.specialties || [],
    visitingHours: row.visiting_hours_markdown || row.visiting_hours || '',
    description: row.description_markdown || row.description || '',
    notes: row.notes_markdown || row.notes || '',
    ownership: row.ownership,
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    status: row.status || 'approved',
    photoUrls: row.photo_urls || [],
    sourceName: row.source_name || '',
    sourceId: row.source_id || '',
    sourceUpdatedAt: row.source_updated_at || '',
    facilityCategory: row.facility_category || '',
    careLevel: row.care_level || '',
    functionalStatus: row.functional_status || '',
    createdAt: row.created_at,
  };
}

function mapReview(row: any): Review {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    userName: row.user_name || row.profiles?.email || 'Carefinder user',
    userEmail: row.user_email || row.profiles?.email || '',
    rating: row.rating,
    text: row.body || row.text || '',
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getUser();
  const authUser = sessionData.user;
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,email,role,created_at')
    .eq('id', authUser.id)
    .maybeSingle();

  return {
    id: authUser.id,
    name: authUser.user_metadata?.name || profile?.email?.split('@')[0] || authUser.email || 'User',
    email: profile?.email || authUser.email || '',
    role: profile?.role || 'public',
    createdAt: profile?.created_at || authUser.created_at || new Date().toISOString(),
  };
}

export async function signIn(email: string, password: string): Promise<User> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = await getCurrentUser();
  if (!user) throw new Error('Signed in but profile was not found.');
  return user;
}

export async function signUpPublic(name: string, email: string, password: string): Promise<User> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Sign-up did not return a user.');
  return {
    id: data.user.id,
    name: name || email.split('@')[0],
    email,
    role: 'public',
    createdAt: data.user.created_at || new Date().toISOString(),
  };
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

export async function listHospitals(): Promise<Hospital[]> {
  if (!supabase) return [];
  const pageSize = 1000;
  const rows: any[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('hospitals_with_ratings')
      .select('*')
      .order('name')
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows.map(mapHospital);
}

export async function listReviews(): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(email)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapReview);
}

export async function createHospital(payload: HospitalPayload): Promise<Hospital> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('hospitals')
    .insert({
      name: payload.name,
      address: payload.address,
      city: payload.city,
      lga: payload.lga,
      state: payload.state,
      phone: payload.phone,
      email: payload.email,
      ownership: payload.ownership,
      specialties: payload.specialties,
      visiting_hours_markdown: payload.visitingHours,
      description_markdown: payload.description,
      notes_markdown: payload.notes,
      status: payload.status,
      photo_urls: payload.photoUrls || [],
      location: pointFromHospital(payload),
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapHospital(data);
}

export async function updateHospital(id: string, payload: Partial<Hospital>): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const update: Record<string, unknown> = {
    name: payload.name,
    address: payload.address,
    city: payload.city,
    lga: payload.lga,
    state: payload.state,
    phone: payload.phone,
    email: payload.email,
    ownership: payload.ownership,
    specialties: payload.specialties,
    visiting_hours_markdown: payload.visitingHours,
    description_markdown: payload.description,
    notes_markdown: payload.notes,
    status: payload.status,
    photo_urls: payload.photoUrls,
  };
  if (typeof payload.latitude === 'number' && typeof payload.longitude === 'number') {
    update.location = pointFromHospital(payload as Hospital);
  }
  Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);
  const { error } = await supabase.from('hospitals').update(update).eq('id', id);
  if (error) throw error;
}

export async function deleteHospital(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('hospitals').delete().eq('id', id);
  if (error) throw error;
}

export async function createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('You must be signed in to review a hospital.');
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      hospital_id: review.hospitalId,
      user_id: userData.user.id,
      rating: review.rating,
      body: review.text,
      status: 'pending',
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapReview(data);
}

export async function updateReviewStatus(id: string, status: Review['status']): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteReview(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadHospitalPhoto(file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const path = `hospital-photos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, '-')}`;
  const { error } = await supabase.storage.from('hospital-images').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('hospital-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function sendHospitalShare(recipientEmail: string, hospitals: Hospital[], shareUrl: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.functions.invoke('share-hospitals', {
    body: { recipientEmail, hospitals, shareUrl },
  });
  if (error) throw error;
}

export async function inviteAdmin(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.functions.invoke('invite-admin', {
    body: { email },
  });
  if (error) throw error;
}
