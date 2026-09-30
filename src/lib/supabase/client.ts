import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CONFIG } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  // Use configured keys or safe placeholder for non-configured build
  const url = SUPABASE_CONFIG.url || "https://placeholder-voltloop.supabase.co";
  const anonKey = SUPABASE_CONFIG.anonKey || "placeholder-anon-key";

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

export const supabase = createClient();
