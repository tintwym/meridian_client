/**
 * Browser Supabase client (publishable key only).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null | undefined;

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
}

function supabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );
}

export function getSupabaseBrowser(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;
  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) {
    browserClient = null;
    return null;
  }
  browserClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 4 } },
  });
  return browserClient;
}

export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}
