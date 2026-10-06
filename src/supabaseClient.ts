import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://fpmpmoltoijhoruxqsdf.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_6IPsbChJ8y--xDWHyoulmA_UCY2LgyG';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL).trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_ANON_KEY
).trim();

export const DEFAULT_STORE_ID = import.meta.env.VITE_STORE_ID || 'c3ad358a-6412-412e-87f9-8c50986b3298';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'loyalty_client_sb_auth_token',
    persistSession: true,
    autoRefreshToken: true,
  },
});
