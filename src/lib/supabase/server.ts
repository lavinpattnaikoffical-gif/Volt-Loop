import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_CONFIG } from "./config";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const url = SUPABASE_CONFIG.url || "https://placeholder-voltloop.supabase.co";
  const anonKey = SUPABASE_CONFIG.anonKey || "placeholder-anon-key";

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
