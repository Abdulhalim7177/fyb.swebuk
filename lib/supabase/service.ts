import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service role key.
 * This bypasses Row Level Security (RLS) policies.
 *
 * IMPORTANT: Only use this for server-side operations that need to bypass RLS,
 * such as incrementing view counts for anonymous users.
 * Never expose the service role key to the client.
 */
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
