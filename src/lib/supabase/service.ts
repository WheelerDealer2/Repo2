import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Bypasses RLS entirely. Only import this from server-only code (Server
// Actions, Route Handlers) that does its own authorization checks first —
// never from anything that ships to the client bundle.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
