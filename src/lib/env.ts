export const env = {
  appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  mapboxAccessToken: (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '').trim(),
  forceDemoMode: (import.meta.env.VITE_FORCE_DEMO_MODE || '').trim().toLowerCase() === 'true',
};

function isValidUrl(value: string) {
  try {
    return Boolean(new URL(value).protocol.startsWith('http'));
  } catch {
    return false;
  }
}

export const hasSupabaseConfig = !env.forceDemoMode
  && isValidUrl(env.supabaseUrl)
  && Boolean(env.supabaseAnonKey);
export const hasMapboxConfig = Boolean(env.mapboxAccessToken);
