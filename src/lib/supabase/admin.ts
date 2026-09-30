import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG } from "./config";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminClient() {
  if (adminClient) return adminClient;

  const url = SUPABASE_CONFIG.url || "https://placeholder-voltloop.supabase.co";
  const key = SUPABASE_CONFIG.serviceRoleKey || SUPABASE_CONFIG.anonKey || "placeholder-anon-key";

  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
