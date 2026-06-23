import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Admin client — uses the service role key. Bypasses RLS.
// ONLY for use inside the backend, never expose this client to the client app.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
