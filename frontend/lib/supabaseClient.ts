import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from './types';

export function initializeSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or service role key is missing from environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
