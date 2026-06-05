import { createClient } from "@supabase/supabase-js";

// Typed as any: without a generated Database schema, ReturnType<typeof createClient>
// resolves to SupabaseClient<unknown> which makes every .insert/.update return never.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _admin: any;

/** Server-only admin client. Never import this in browser code. Reuses a single instance per process. */
export function createAdminClient() {
  if (!_admin) {
    _admin = createClient(
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
  return _admin;
}
