import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { timedFetch } from './timed-fetch';

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: timedFetch } }
  );
}
