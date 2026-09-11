import { createBrowserClient } from "@supabase/ssr";

// Generic types will be added once `npx supabase gen types` is run against
// the real schema (see src/lib/supabase/README.md).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
