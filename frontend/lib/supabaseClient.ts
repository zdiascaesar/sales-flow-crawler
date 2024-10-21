import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from './types';

export function initializeSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || (!supabaseKey && !supabaseServiceRoleKey)) {
    throw new Error('Supabase URL or keys are missing from environment variables');
  }

  // Use the service role key for server-side operations, and the anon key for client-side
  const key = typeof window === 'undefined' ? supabaseServiceRoleKey : supabaseKey;

  if (!key) {
    throw new Error('Appropriate Supabase key is missing for the current environment');
  }

  console.log('Initializing Supabase client with URL:', supabaseUrl);
  console.log('Using key type:', typeof window === 'undefined' ? 'Service Role Key' : 'Anon Key');

  return createClient(supabaseUrl, key);
}
