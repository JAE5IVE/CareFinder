export const env = {
  appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  forceDemoMode: import.meta.env.VITE_FORCE_DEMO_MODE === 'true',
};

export const hasSupabaseConfig = !env.forceDemoMode && Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasMapboxConfig = Boolean(env.mapboxAccessToken);
