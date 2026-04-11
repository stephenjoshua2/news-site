import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types";

import { getSupabaseProjectConfig } from "./config";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseProjectConfig();

  return createBrowserClient<Database>(url, anonKey);
}
